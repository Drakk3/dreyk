'use client';

import type { RealtimeSnapshotRefreshConfig } from './types';
import { useRealtimeSnapshotRefresh } from './useRealtimeSnapshotRefresh';

interface RealtimeSnapshotRefreshBridgeProps {
  config: RealtimeSnapshotRefreshConfig;
}

export function RealtimeSnapshotRefreshBridge({ config }: RealtimeSnapshotRefreshBridgeProps): JSX.Element | null {
  useRealtimeSnapshotRefresh(config);

  return null;
}
