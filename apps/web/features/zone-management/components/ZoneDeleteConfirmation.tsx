'use client';

import { DataCard } from '@/components/thegridcn/data-card';
import { Button } from '@/components/ui/button';

interface ZoneDeleteConfirmationProps {
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  zoneName: string;
}

export function ZoneDeleteConfirmation({ isBusy, onCancel, onConfirm, zoneName }: ZoneDeleteConfirmationProps): JSX.Element {
  return (
    <DataCard status="alert" title="Delete confirmation" subtitle="Cascades to related records">
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Delete <span className="font-semibold text-foreground">{zoneName}</span>? This also removes dependent
          records from <span className="font-mono text-foreground">alexa_triggers</span> and{' '}
          <span className="font-mono text-foreground">location_events</span>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isBusy} onClick={() => void onConfirm()} size="sm" variant="destructive">
            Confirm delete
          </Button>
          <Button disabled={isBusy} onClick={onCancel} size="sm" variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </DataCard>
  );
}
