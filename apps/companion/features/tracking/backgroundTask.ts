import * as TaskManager from 'expo-task-manager';

import { handleError } from '../../shared/lib/errors';
import {
  createSupabaseFunctionUrl,
  getSupabaseAccessToken,
} from '../../shared/lib/supabase/mobile';
import {
  createTrackingIngestRequestBody,
  createTrackingUploadPayload,
} from './services/trackingPayloads';
import {
  markTrackingCaptured,
  markTrackingUploaded,
  setTrackingBlocked,
  setTrackingErrorMessage,
} from './store/trackingStore';
import { pauseTrackingRuntime } from './runtime';
import {
  TRACKING_TASK_NAME,
  type TrackingLocationSample,
  type TrackingUploadPayload,
} from './types';

interface TrackingUploadResponse {
  shouldBlock: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTrackingLocationSample(value: unknown): value is TrackingLocationSample {
  if (isRecord(value) === false) {
    return false;
  }

  const coords = value.coords;
  const timestamp = value.timestamp;

  return isRecord(coords) && typeof timestamp === 'number';
}

function resolveTrackingLocationSamples(data: unknown): TrackingLocationSample[] {
  if (isRecord(data) === false || Array.isArray(data.locations) === false) {
    return [];
  }

  return data.locations.filter(isTrackingLocationSample);
}

async function uploadTrackingPayload(
  accessToken: string,
  payload: TrackingUploadPayload,
): Promise<TrackingUploadResponse> {
  const response = await fetch(createSupabaseFunctionUrl('ingest-location'), {
    body: JSON.stringify(createTrackingIngestRequestBody(payload)),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 401 || response.status === 403) {
    return {
      shouldBlock: true,
    };
  }

  if (response.ok === false) {
    const errorBody = await response.text();

    throw new Error(`Tracking ingestion failed with ${response.status}: ${errorBody}`);
  }

  return {
    shouldBlock: false,
  };
}

if (TaskManager.isTaskDefined(TRACKING_TASK_NAME) === false) {
  TaskManager.defineTask(TRACKING_TASK_NAME, async ({ data, error }) => {
    if (error != null) {
      handleError(error, 'tracking.backgroundTask.defineTask');
      setTrackingErrorMessage('Background tracking reported an unexpected task error.');
      return;
    }

    const locations = resolveTrackingLocationSamples(data);

    if (locations.length === 0) {
      return;
    }

    try {
      const accessToken = await getSupabaseAccessToken();

      if (accessToken === null) {
        await pauseTrackingRuntime();
        setTrackingBlocked('Tracking paused because the companion session is no longer authenticated.');
        return;
      }

      for (const location of locations) {
        const payload = createTrackingUploadPayload(location);

        markTrackingCaptured(payload.capturedAt);

        const uploadResponse = await uploadTrackingPayload(accessToken, payload);

        if (uploadResponse.shouldBlock) {
          await pauseTrackingRuntime();
          setTrackingBlocked('Tracking paused because the companion session must be restored.');
          return;
        }

        markTrackingUploaded(new Date().toISOString());
      }
    } catch (taskError: unknown) {
      handleError(taskError, 'tracking.backgroundTask.upload');
      setTrackingErrorMessage('Tracking captured a point but could not upload it right now.');
    }
  });
}
