'use client';

import { DataCard } from '@/components/thegridcn/data-card';
import { Select } from '@/components/thegridcn/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { ZoneFormValues, ZoneManagementGroupOption, ZoneManagementValidationErrors } from '../types';

interface ZoneManagementFormProps {
  draft: ZoneFormValues;
  groupOptions: ZoneManagementGroupOption[];
  isBusy: boolean;
  mode: 'create' | 'edit';
  mutationMessage: string | null;
  onDeleteRequest: () => void;
  onDraftChange: (field: keyof ZoneFormValues, value: boolean | string) => void;
  onSave: () => Promise<void>;
  onStartCreate: () => void;
  onToggleActive: () => Promise<void>;
  selectedZoneId: string | null;
  validationErrors: ZoneManagementValidationErrors;
}

function renderFieldError(message: string | undefined): JSX.Element | null {
  if (message === undefined) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

export function ZoneManagementForm({
  draft,
  groupOptions,
  isBusy,
  mode,
  mutationMessage,
  onDeleteRequest,
  onDraftChange,
  onSave,
  onStartCreate,
  onToggleActive,
  selectedZoneId,
  validationErrors,
}: ZoneManagementFormProps): JSX.Element {
  return (
    <DataCard title={mode === 'create' ? 'Create zone' : 'Edit zone'} subtitle="Persisted circle-zone fields">
      <div className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="zone-name">
              Zone name
            </label>
            <Input id="zone-name" onChange={(event) => onDraftChange('name', event.currentTarget.value)} value={draft.name} />
            {renderFieldError(validationErrors.name)}
          </div>

          <div className="space-y-2">
            <Select
              label="Group"
              onChange={(value) => onDraftChange('groupId', value)}
              options={groupOptions.map((group) => ({ label: group.name, value: group.id }))}
              value={draft.groupId}
            />
            {renderFieldError(validationErrors.groupId)}
          </div>

          <label className="flex items-center gap-2 rounded border border-border/50 px-3 py-2 text-sm">
            <input checked={draft.isActive} onChange={(event) => onDraftChange('isActive', event.currentTarget.checked)} type="checkbox" />
            Active zone
          </label>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="zone-latitude">
              Latitude
            </label>
            <Input id="zone-latitude" onChange={(event) => onDraftChange('latitude', event.currentTarget.value)} value={draft.latitude} />
            {renderFieldError(validationErrors.latitude)}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="zone-longitude">
              Longitude
            </label>
            <Input id="zone-longitude" onChange={(event) => onDraftChange('longitude', event.currentTarget.value)} value={draft.longitude} />
            {renderFieldError(validationErrors.longitude)}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="zone-radius">
              Radius meters
            </label>
            <Input id="zone-radius" onChange={(event) => onDraftChange('radiusMeters', event.currentTarget.value)} value={draft.radiusMeters} />
            {renderFieldError(validationErrors.radiusMeters)}
          </div>
        </div>

        {mutationMessage !== null ? <p className="text-sm text-muted-foreground">{mutationMessage}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button disabled={isBusy} onClick={() => void onSave()} size="sm">
            {mode === 'create' ? 'Create persisted zone' : 'Save changes'}
          </Button>
          <Button disabled={isBusy || selectedZoneId === null} onClick={() => void onToggleActive()} size="sm" variant="outline">
            Toggle active
          </Button>
          <Button disabled={isBusy || selectedZoneId === null} onClick={onDeleteRequest} size="sm" variant="destructive">
            Delete zone
          </Button>
          <Button disabled={isBusy} onClick={onStartCreate} size="sm" variant="ghost">
            New draft
          </Button>
        </div>
      </div>
    </DataCard>
  );
}
