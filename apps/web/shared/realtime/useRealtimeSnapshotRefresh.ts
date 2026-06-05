'use client';

import { REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { handleError } from '@/shared/lib/errors';

import type { RealtimeSnapshotPayload, RealtimeSnapshotRefreshConfig } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getPayloadRecordId(payload: RealtimeSnapshotPayload): string {
  const candidateRecords: unknown[] = [payload.new, payload.old];

  for (const candidateRecord of candidateRecords) {
    if (!isRecord(candidateRecord)) {
      continue;
    }

    const recordId = candidateRecord.id;

    if (typeof recordId === 'string' && recordId.length > 0) {
      return recordId;
    }
  }

  return 'unknown';
}

function buildPayloadDedupeKey(payload: RealtimeSnapshotPayload): string {
  return [payload.table, payload.eventType, getPayloadRecordId(payload), payload.commit_timestamp].join(':');
}

export function useRealtimeSnapshotRefresh(config: RealtimeSnapshotRefreshConfig): void {
  // 1. External dependencies (store, router, clients)
  const router = useRouter();

  // 2. Local state
  const timeoutIdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedPayloadKeyRef = React.useRef<string | null>(null);
  const lastProcessedPayloadKeyRef = React.useRef<string | null>(null);

  // 3. Derived values (useMemo)
  const channelName = React.useMemo<string>(() => {
    return `realtime-snapshot-refresh:${config.scope}`;
  }, [config.scope]);

  // 4. Handlers and effects (useCallback, useEffect)
  const clearPendingRefresh = React.useCallback((): void => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const queueRefresh = React.useCallback(
    (payload: RealtimeSnapshotPayload): void => {
      const payloadKey = buildPayloadDedupeKey(payload);

      if (payloadKey === queuedPayloadKeyRef.current || payloadKey === lastProcessedPayloadKeyRef.current) {
        return;
      }

      queuedPayloadKeyRef.current = payloadKey;
      clearPendingRefresh();

      timeoutIdRef.current = setTimeout(() => {
        const processedPayloadKey = queuedPayloadKeyRef.current;

        timeoutIdRef.current = null;
        queuedPayloadKeyRef.current = null;
        lastProcessedPayloadKeyRef.current = processedPayloadKey;
        router.refresh();
      }, config.throttleMs);
    },
    [clearPendingRefresh, config.throttleMs, router],
  );

  React.useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      const channel = supabase.channel(channelName);

      config.tables.forEach((tableSubscription) => {
        channel.on(
          'postgres_changes',
          {
            event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
            schema: tableSubscription.schema,
            table: tableSubscription.table,
          },
          (payload) => {
            queueRefresh(payload);
          },
        );
      });

      channel.subscribe();

      return () => {
        clearPendingRefresh();
        queuedPayloadKeyRef.current = null;

        void (async (): Promise<void> => {
          try {
            await supabase.removeChannel(channel);
          } catch (error: unknown) {
            handleError(error, 'useRealtimeSnapshotRefresh.removeChannel');
          }
        })();
      };
    } catch (error: unknown) {
      handleError(error, 'useRealtimeSnapshotRefresh.subscribe');
      clearPendingRefresh();

      return undefined;
    }
  }, [channelName, clearPendingRefresh, config.tables, queueRefresh]);
}
