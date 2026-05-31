import { describe, expect, it } from 'vitest';

import {
  createInitialTrackingSnapshot,
  createTrackingPermissionSnapshot,
  createTrackingStatusSnapshot,
} from './trackingState';

describe('trackingState', () => {
  it('starts inactive by default', () => {
    expect(createInitialTrackingSnapshot()).toEqual({
      errorMessage: null,
      lastCapturedAt: null,
      lastUploadedAt: null,
      permissionStatus: 'unknown',
      status: 'inactive',
    });
  });

  it('derives permission and status snapshots without mutating unrelated fields', () => {
    const snapshot = createTrackingPermissionSnapshot(createInitialTrackingSnapshot(), 'granted');
    const activeSnapshot = createTrackingStatusSnapshot(snapshot, 'active');

    expect(activeSnapshot).toEqual({
      errorMessage: null,
      lastCapturedAt: null,
      lastUploadedAt: null,
      permissionStatus: 'granted',
      status: 'active',
    });
  });
});
