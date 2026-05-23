'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { handleError } from '@/shared/lib/errors';
import type { SharedGeofencingZoneView } from '@/shared/geofencing/types';

import {
  buildZoneMutationInput,
  mapZoneMutationInputToInsertPayload,
  mapZoneMutationInputToUpdatePayload,
} from '../services/zoneManagementPayloads';
import { validateZoneFormValues } from '../services/zoneManagementValidation';
import {
  createZoneManagementStoreState,
  reduceZoneManagementStoreState,
  type ZoneManagementStoreAction,
} from '../store/zoneManagementStore';
import type { ZoneFormValues, ZoneManagementSnapshot, ZoneManagementValidationErrors } from '../types';

interface UseZoneManagementParams {
  adminUserId: string;
  snapshot: ZoneManagementSnapshot;
}

interface UseZoneManagementResult {
  deleteCandidate: SharedGeofencingZoneView | null;
  draft: ZoneFormValues;
  handleConfirmDelete: () => Promise<void>;
  handleDeleteRequest: () => void;
  handleDismissDelete: () => void;
  handleDraftChange: (field: keyof ZoneFormValues, value: boolean | string) => void;
  handleSaveZone: () => Promise<void>;
  handleSelectZone: (selectedZoneId: string | null) => void;
  handleStartCreate: () => void;
  handleToggleZoneActive: () => Promise<void>;
  isMutating: boolean;
  mode: 'create' | 'edit';
  mutationMessage: string | null;
  selectedZone: SharedGeofencingZoneView | null;
  selectedZoneId: string | null;
  validationErrors: ZoneManagementValidationErrors;
}

export function useZoneManagement({ adminUserId, snapshot }: UseZoneManagementParams): UseZoneManagementResult {
  // 1. External dependencies (store, router, clients)
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // 2. Local state
  const [state, dispatchBase] = React.useReducer(
    (currentState: ReturnType<typeof createZoneManagementStoreState>, action: ZoneManagementStoreAction) =>
      reduceZoneManagementStoreState(currentState, action, snapshot),
    snapshot,
    createZoneManagementStoreState,
  );
  const [isMutating, setIsMutating] = React.useState<boolean>(false);
  const [mutationMessage, setMutationMessage] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<ZoneManagementValidationErrors>({});

  // 3. Derived values (useMemo)
  const selectedZone = React.useMemo<SharedGeofencingZoneView | null>(() => {
    return snapshot.zones.find((zone) => zone.id === state.selectedZoneId) ?? null;
  }, [snapshot.zones, state.selectedZoneId]);

  const deleteCandidate = React.useMemo<SharedGeofencingZoneView | null>(() => {
    return snapshot.zones.find((zone) => zone.id === state.pendingDeleteZoneId) ?? null;
  }, [snapshot.zones, state.pendingDeleteZoneId]);

  // 4. Handlers and effects (useCallback, useEffect)
  React.useEffect(() => {
    dispatchBase({ snapshot, type: 'syncSnapshot' });
  }, [snapshot]);

  const dispatch = React.useCallback((action: ZoneManagementStoreAction): void => {
    dispatchBase(action);
  }, []);

  const handleDraftChange = React.useCallback((field: keyof ZoneFormValues, value: boolean | string): void => {
    setValidationErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    dispatch({ field, type: 'updateDraftField', value });
  }, [dispatch]);

  const handleSelectZone = React.useCallback((selectedZoneId: string | null): void => {
    setValidationErrors({});
    setMutationMessage(null);
    dispatch({ selectedZoneId, type: 'selectZone' });
  }, [dispatch]);

  const handleStartCreate = React.useCallback((): void => {
    setValidationErrors({});
    setMutationMessage(null);
    dispatch({ defaultGroupId: snapshot.groupOptions[0]?.id ?? null, type: 'startCreate' });
  }, [dispatch, snapshot.groupOptions]);

  const createValidationContext = React.useCallback(() => ({
    allowedGroupIds: snapshot.groupOptions.map((group) => group.id),
    createdBy: adminUserId,
    mode: state.mode,
  } as const), [adminUserId, snapshot.groupOptions, state.mode]);

  const handleSaveZone = React.useCallback(async (): Promise<void> => {
    const validationContext = createValidationContext();
    const validationResult = validateZoneFormValues(state.draft, validationContext);

    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors);
      return;
    }

    setIsMutating(true);
    setMutationMessage(null);
    setValidationErrors({});

      try {
        const mutationInput = buildZoneMutationInput(state.draft, {
          ...validationContext,
          createdBy: adminUserId,
          ...(selectedZone?.id !== undefined ? { id: selectedZone.id } : {}),
        });

      if (state.mode === 'create') {
        // @ts-expect-error Supabase client infers `zones` write payloads as `never` in this workspace despite the generated Database type.
        const createResult = await supabase.from('zones').insert(mapZoneMutationInputToInsertPayload(mutationInput));

        if (createResult.error !== null) {
          throw createResult.error;
        }

        dispatch({ defaultGroupId: snapshot.groupOptions[0]?.id ?? null, type: 'startCreate' });
        setMutationMessage('Zone created. Refreshing the persisted snapshot.');
      } else {
        if (selectedZone === null) {
          return;
        }

        // @ts-expect-error Supabase client infers `zones` write payloads as `never` in this workspace despite the generated Database type.
        const updateResult = await supabase.from('zones').update(mapZoneMutationInputToUpdatePayload(mutationInput)).eq('id', selectedZone.id);

        if (updateResult.error !== null) {
          throw updateResult.error;
        }

        setMutationMessage('Zone updated. Refreshing the persisted snapshot.');
      }

      router.refresh();
    } catch (error: unknown) {
      handleError(error, 'useZoneManagement.handleSaveZone');
      setMutationMessage('Unable to save the zone right now.');
    } finally {
      setIsMutating(false);
    }
  }, [adminUserId, createValidationContext, dispatch, router, selectedZone, snapshot.groupOptions, state.draft, state.mode, supabase]);

  const handleToggleZoneActive = React.useCallback(async (): Promise<void> => {
    if (selectedZone === null) {
      return;
    }

    setIsMutating(true);
    setMutationMessage(null);

    try {
      // @ts-expect-error Supabase client infers `zones` write payloads as `never` in this workspace despite the generated Database type.
      const toggleResult = await supabase.from('zones').update({ is_active: !selectedZone.isActive }).eq('id', selectedZone.id);

      if (toggleResult.error !== null) {
        throw toggleResult.error;
      }

      setMutationMessage(`Zone ${selectedZone.isActive ? 'deactivated' : 'activated'}. Refreshing the persisted snapshot.`);
      router.refresh();
    } catch (error: unknown) {
      handleError(error, 'useZoneManagement.handleToggleZoneActive');
      setMutationMessage('Unable to change the zone status right now.');
    } finally {
      setIsMutating(false);
    }
  }, [router, selectedZone, supabase]);

  const handleDeleteRequest = React.useCallback((): void => {
    if (selectedZone === null) {
      return;
    }

    dispatch({ type: 'openDeleteConfirmation', zoneId: selectedZone.id });
  }, [dispatch, selectedZone]);

  const handleDismissDelete = React.useCallback((): void => {
    dispatch({ type: 'closeDeleteConfirmation' });
  }, [dispatch]);

  const handleConfirmDelete = React.useCallback(async (): Promise<void> => {
    if (deleteCandidate === null) {
      return;
    }

    setIsMutating(true);
    setMutationMessage(null);

    try {
      const deleteResult = await supabase.from('zones').delete().eq('id', deleteCandidate.id);

      if (deleteResult.error !== null) {
        throw deleteResult.error;
      }

      dispatch({ type: 'closeDeleteConfirmation' });
      dispatch({ defaultGroupId: snapshot.groupOptions[0]?.id ?? null, type: 'startCreate' });
      setMutationMessage('Zone deleted. Refreshing the persisted snapshot.');
      router.refresh();
    } catch (error: unknown) {
      handleError(error, 'useZoneManagement.handleConfirmDelete');
      setMutationMessage('Unable to delete the zone right now.');
    } finally {
      setIsMutating(false);
    }
  }, [deleteCandidate, dispatch, router, snapshot.groupOptions, supabase]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    deleteCandidate,
    draft: state.draft,
    handleConfirmDelete,
    handleDeleteRequest,
    handleDismissDelete,
    handleDraftChange,
    handleSaveZone,
    handleSelectZone,
    handleStartCreate,
    handleToggleZoneActive,
    isMutating,
    mode: state.mode,
    mutationMessage,
    selectedZone,
    selectedZoneId: state.selectedZoneId,
    validationErrors,
  };
}
