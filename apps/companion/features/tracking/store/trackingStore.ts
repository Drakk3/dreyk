import { useStore } from 'zustand/react';
import { createStore } from 'zustand/vanilla';

import {
  createInitialTrackingSnapshot,
  createTrackingCapturedSnapshot,
  createTrackingErrorSnapshot,
  createTrackingPermissionSnapshot,
  createTrackingStatusSnapshot,
  createTrackingUploadedSnapshot,
} from '../services/trackingState';
import type { TrackingPermissionStatus, TrackingRuntimeSnapshot } from '../types';

export interface TrackingStoreState extends TrackingRuntimeSnapshot {
  markCaptured: (capturedAt: string) => void;
  markUploaded: (uploadedAt: string) => void;
  setActive: () => void;
  setBlocked: (errorMessage: string) => void;
  setErrorMessage: (errorMessage: string | null) => void;
  setPaused: () => void;
  setPermissionStatus: (permissionStatus: TrackingPermissionStatus) => void;
}

const trackingStore = createStore<TrackingStoreState>((set) => ({
  ...createInitialTrackingSnapshot(),
  markCaptured: (capturedAt) => {
    set((state) => createTrackingCapturedSnapshot(state, capturedAt));
  },
  markUploaded: (uploadedAt) => {
    set((state) => createTrackingUploadedSnapshot(state, uploadedAt));
  },
  setActive: () => {
    set((state) => createTrackingStatusSnapshot(state, 'active'));
  },
  setBlocked: (errorMessage) => {
    set((state) => createTrackingStatusSnapshot(state, 'blocked', errorMessage));
  },
  setErrorMessage: (errorMessage) => {
    set((state) => createTrackingErrorSnapshot(state, errorMessage));
  },
  setPaused: () => {
    set((state) => createTrackingStatusSnapshot(state, 'paused'));
  },
  setPermissionStatus: (permissionStatus) => {
    set((state) => createTrackingPermissionSnapshot(state, permissionStatus));
  },
}));

export function useTrackingStore<Selected>(selector: (state: TrackingStoreState) => Selected): Selected {
  return useStore(trackingStore, selector);
}

export function markTrackingCaptured(capturedAt: string): void {
  trackingStore.getState().markCaptured(capturedAt);
}

export function markTrackingUploaded(uploadedAt: string): void {
  trackingStore.getState().markUploaded(uploadedAt);
}

export function setTrackingBlocked(errorMessage: string): void {
  trackingStore.getState().setBlocked(errorMessage);
}

export function setTrackingErrorMessage(errorMessage: string | null): void {
  trackingStore.getState().setErrorMessage(errorMessage);
}

export function resetTrackingStore(): void {
  trackingStore.setState((state) => ({
    ...state,
    ...createInitialTrackingSnapshot(),
  }));
}
