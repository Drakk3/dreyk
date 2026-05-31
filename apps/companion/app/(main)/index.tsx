import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAuthSignOut } from '../../features/auth/hooks/useAuthSignOut';
import { useAuthStore } from '../../features/auth/store/authStore';

export default function MainIndexScreen(): JSX.Element {
  const { errorMessage, handleSignOut, isSigningOut } = useAuthSignOut();
  const profile = useAuthStore((state) => state.profile);

  const welcomeLabel = useMemo(() => {
    return profile?.display_name ?? 'Companion user';
  }, [profile]);

  const handleSignOutPress = useCallback((): void => {
    void handleSignOut();
  }, [handleSignOut]);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>AUTHENTICATED</Text>
        <Text style={styles.title}>Welcome, {welcomeLabel}</Text>
        <Text style={styles.copy}>Your companion session is active and protected routes are now available.</Text>
        <View style={styles.detailList}>
          <Text style={styles.detailLabel}>Profile ID</Text>
          <Text style={styles.detailValue}>{profile?.id ?? 'Unknown profile'}</Text>
          <Text style={styles.detailLabel}>Role</Text>
          <Text style={styles.detailValue}>{profile?.role ?? 'Unknown role'}</Text>
        </View>
        {errorMessage === null ? null : <Text style={styles.error}>{errorMessage}</Text>}
        <Pressable
          onPress={handleSignOutPress}
          style={styles.button}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#e2e8f0" />
          ) : (
            <Text style={styles.buttonLabel}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
  button: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  buttonLabel: {
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
