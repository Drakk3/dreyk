'use client';

import { DataCard } from '@/components/thegridcn/data-card';
import type { SharedGeofencingZoneView } from '@/shared/geofencing/types';

interface ZoneVoiceConfigurationPanelProps {
  selectedZone: SharedGeofencingZoneView | null;
}

function formatOptionalValue(value: string | null): string {
  return value ?? 'Unavailable';
}

export function ZoneVoiceConfigurationPanel({ selectedZone }: ZoneVoiceConfigurationPanelProps): JSX.Element {
  if (selectedZone === null) {
    return (
      <DataCard subtitle="Alexa admin linkage" title="Voice configuration">
        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">No zone selected</div>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Select a persisted zone to inspect its Alexa trigger, linkage, and delivery audit state.
          </p>
        </div>
      </DataCard>
    );
  }

  const alexa = selectedZone.alexa;

  return (
    <DataCard
      status={alexa.state === 'failed' ? 'alert' : alexa.state === 'ready' ? 'active' : 'inactive'}
      subtitle="Alexa admin linkage"
      title="Voice configuration"
      fields={[
        { label: 'Readiness', value: alexa.statusLabel, highlight: alexa.state === 'ready' },
        { label: 'Next action', value: alexa.nextAction },
        { label: 'Workflow', value: formatOptionalValue(alexa.workflowKey) },
        { label: 'Trigger id', value: formatOptionalValue(alexa.triggerId) },
        { label: 'Trigger active', value: alexa.isTriggerActive ? 'Yes' : 'No', highlight: alexa.isTriggerActive },
        { label: 'Linked user id', value: formatOptionalValue(alexa.linkedUserId) },
        { label: 'Linked profile id', value: formatOptionalValue(alexa.linkedProfileId) },
        { label: 'Alexa user ref', value: formatOptionalValue(alexa.linkedUserReference) },
        { label: 'Linkage status', value: formatOptionalValue(alexa.linkageStatus) },
        { label: 'Permission', value: formatOptionalValue(alexa.notificationPermissionStatus) },
        { label: 'Subscription', value: formatOptionalValue(alexa.notificationSubscriptionStatus) },
        { label: 'Readiness status', value: formatOptionalValue(alexa.readinessStatus) },
        { label: 'Last delivery', value: formatOptionalValue(alexa.lastDeliveryStatus) },
        { label: 'Last attempted at', value: formatOptionalValue(alexa.lastAttemptedAt) },
        { label: 'Last failure', value: formatOptionalValue(alexa.lastFailureReason) },
        { label: 'Message template', value: formatOptionalValue(alexa.messageTemplate) },
      ]}
    />
  );
}
