'use client';

import { DataCard } from '@/components/thegridcn/data-card';
import { GeofencingMapCanvas } from '@/shared/geofencing/GeofencingMapCanvas';
import { RealtimeSnapshotRefreshBridge } from '@/shared/realtime/RealtimeSnapshotRefreshBridge';
import { ZoneDetailsPanel } from '@/shared/geofencing/ZoneDetailsPanel';

import { ZONE_MANAGEMENT_REALTIME_REFRESH_CONFIG } from '../realtime';
import { useZoneManagement } from '../hooks/useZoneManagement';
import type { ZoneManagementSnapshot } from '../types';
import { ZoneDeleteConfirmation } from './ZoneDeleteConfirmation';
import { ZoneManagementForm } from './ZoneManagementForm';
import { ZoneManagementList } from './ZoneManagementList';
import { ZoneVoiceConfigurationPanel } from './ZoneVoiceConfigurationPanel';

interface ZoneManagementWorkspaceProps {
  adminDisplayName: string;
  adminUserId: string;
  snapshot: ZoneManagementSnapshot;
}

export function ZoneManagementWorkspace({ adminDisplayName, adminUserId, snapshot }: ZoneManagementWorkspaceProps): JSX.Element {
  const {
    deleteCandidate,
    draft,
    handleConfirmDelete,
    handleDeleteRequest,
    handleDismissDelete,
    handleDraftChange,
    handleSaveZone,
    handleSelectZone,
    handleStartCreate,
    handleToggleZoneActive,
    isMutating,
    mode,
    mutationMessage,
    selectedZone,
    selectedZoneId,
    validationErrors,
  } = useZoneManagement({ adminUserId, snapshot });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <RealtimeSnapshotRefreshBridge config={ZONE_MANAGEMENT_REALTIME_REFRESH_CONFIG} />
      <header className="space-y-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">Admin-only zone management</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl uppercase tracking-[0.18em] text-foreground">/admin/zones</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Persisted zone CRUD lives here so <span className="font-mono text-foreground">/geofencing</span> stays a read-only operational surface.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DataCard className="min-w-[180px]" fields={[{ label: 'Admin', value: adminDisplayName }]} />
            <DataCard className="min-w-[180px]" fields={[{ label: 'Fetched at', value: new Date(snapshot.fetchedAt).toLocaleString() }]} />
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <ZoneManagementList
            onCreateZone={handleStartCreate}
            onSelectZone={handleSelectZone}
            selectedZoneId={selectedZoneId}
            zones={snapshot.zones}
          />
          {deleteCandidate !== null ? (
            <ZoneDeleteConfirmation
              isBusy={isMutating}
              onCancel={handleDismissDelete}
              onConfirm={handleConfirmDelete}
              zoneName={deleteCandidate.name}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <GeofencingMapCanvas events={[]} onSelectZone={handleSelectZone} selectedZoneId={selectedZoneId} zones={snapshot.zones} />
            <ZoneDetailsPanel selectedZone={selectedZone} />
          </div>
          <ZoneManagementForm
            draft={draft}
            groupOptions={snapshot.groupOptions}
            isBusy={isMutating}
            mode={mode}
            mutationMessage={mutationMessage}
            onDeleteRequest={handleDeleteRequest}
            onDraftChange={handleDraftChange}
            onSave={handleSaveZone}
            onStartCreate={handleStartCreate}
            onToggleActive={handleToggleZoneActive}
            selectedZoneId={selectedZoneId}
            validationErrors={validationErrors}
          />
          <ZoneVoiceConfigurationPanel selectedZone={selectedZone} />
        </div>
      </section>
    </main>
  );
}
