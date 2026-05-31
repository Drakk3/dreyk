import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAuthSignOut } from '../../features/auth/hooks/useAuthSignOut';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useTrackingController } from '../../features/tracking/hooks/useTrackingController';

interface MainIndexScreenProps {
  readonly unused?: never;
}

function formatTimestamp(value: string | null): string {
  if (value === null) {
    return 'Not yet available';
  }

  return new Date(value).toLocaleString();
}

function resolveTrackingSummary(status: 'inactive' | 'active' | 'paused' | 'blocked'): string {
  if (status === 'active') {
    return 'Background capture is active and raw coordinates will upload with your authenticated session.';
  }

  if (status === 'paused') {
    return 'Tracking is paused locally. Resume to continue raw coordinate capture and uploads.';
  }

  if (status === 'blocked') {
    return 'Tracking is blocked until permissions and companion authentication are restored.';
  }

  return 'Tracking is off by default. Start it only after you are ready to grant background location access.';
}

export default function MainIndexScreen(_props: MainIndexScreenProps): JSX.Element {
  void _props;

  const { errorMessage, handleSignOut, isSigningOut } = useAuthSignOut();
  const authStatus = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);
  const session = useAuthStore((state) => state.session);
  const {
    canPause,
    canResume,
    canStart,
    errorMessage: trackingErrorMessage,
    handlePauseTracking,
    handleResumeTracking,
    handleStartTracking,
    isTransitioning,
    lastCapturedAt,
    lastUploadedAt,
    permissionStatus,
    status,
  } = useTrackingController({
    hasSession: session !== null,
    isAuthenticated: authStatus === 'authenticated',
  });

  const welcomeLabel = useMemo(() => {
    return profile?.display_name ?? 'Companion user';
  }, [profile]);
  const trackingSummary = useMemo(() => {
    return resolveTrackingSummary(status);
  }, [status]);
  const formattedCapturedAt = useMemo(() => {
    return formatTimestamp(lastCapturedAt);
  }, [lastCapturedAt]);
  const formattedUploadedAt = useMemo(() => {
    return formatTimestamp(lastUploadedAt);
  }, [lastUploadedAt]);

  const handleSignOutPress = useCallback((): void => {
    void handleSignOut();
  }, [handleSignOut]);
  const handleStartTrackingPress = useCallback((): void => {
    void handleStartTracking();
  }, [handleStartTracking]);
  const handlePauseTrackingPress = useCallback((): void => {
    void handlePauseTracking();
  }, [handlePauseTracking]);
  const handleResumeTrackingPress = useCallback((): void => {
    void handleResumeTracking();
  }, [handleResumeTracking]);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>PHASE 8 TRACKING</Text>
        <Text style={styles.title}>Welcome, {welcomeLabel}</Text>
        <Text style={styles.copy}>{trackingSummary}</Text>
        <View style={styles.detailList}>
          <Text style={styles.detailLabel}>Profile ID</Text>
          <Text style={styles.detailValue}>{profile?.id ?? 'Unknown profile'}</Text>
          <Text style={styles.detailLabel}>Tracking status</Text>
          <Text style={styles.detailValue}>{status}</Text>
          <Text style={styles.detailLabel}>Permission</Text>
          <Text style={styles.detailValue}>{permissionStatus}</Text>
          <Text style={styles.detailLabel}>Last capture</Text>
          <Text style={styles.detailValue}>{formattedCapturedAt}</Text>
          <Text style={styles.detailLabel}>Last upload</Text>
          <Text style={styles.detailValue}>{formattedUploadedAt}</Text>
        </View>
        <View style={styles.actionGroup}>
          <Pressable
            disabled={canStart === false || isTransitioning}
            onPress={handleStartTrackingPress}
            style={[styles.button, canStart && isTransitioning === false ? styles.buttonPrimary : styles.buttonDisabled]}
          >
            {isTransitioning && canStart ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonPrimaryLabel}>Start tracking</Text>}
          </Pressable>
          <Pressable
            disabled={canPause === false || isTransitioning}
            onPress={handlePauseTrackingPress}
            style={[styles.button, canPause && isTransitioning === false ? styles.buttonSecondary : styles.buttonDisabled]}
          >
            <Text style={styles.buttonSecondaryLabel}>Pause tracking</Text>
          </Pressable>
          <Pressable
            disabled={canResume === false || isTransitioning}
            onPress={handleResumeTrackingPress}
            style={[styles.button, canResume && isTransitioning === false ? styles.buttonPrimary : styles.buttonDisabled]}
          >
            <Text style={styles.buttonPrimaryLabel}>Resume tracking</Text>
          </Pressable>
        </View>
        {trackingErrorMessage === null ? null : <Text style={styles.error}>{trackingErrorMessage}</Text>}
        {errorMessage === null ? null : <Text style={styles.error}>{errorMessage}</Text>}
        <Pressable
          onPress={handleSignOutPress}
          style={[styles.button, styles.buttonSecondary]}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#e2e8f0" />
          ) : (
            <Text style={styles.buttonSecondaryLabel}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
  actionGroup: {
    gap: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    backgroundColor: '#475569',
  },
  buttonPrimary: {
    backgroundColor: '#38bdf8',
  },
  buttonPrimaryLabel: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: '#1e293b',
  },
  buttonSecondaryLabel: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    maxWidth: 420,
    padding: 24,
    width: '100%',
  },
  copy: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailList: {
    gap: 6,
  },
  detailValue: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  eyebrow: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  screen: {
    alignItems: 'center',
    backgroundColor: '#020617',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
};
