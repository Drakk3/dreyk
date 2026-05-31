import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuthSignIn } from '../../features/auth/hooks/useAuthSignIn';
import { useAuthStore } from '../../features/auth/store/authStore';

export default function SignInScreen(): JSX.Element {
  const { errorMessage, handleSignIn, isSubmitting } = useAuthSignIn();
  const authErrorMessage = useAuthStore((state) => state.errorMessage);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && isSubmitting === false;
  }, [email, isSubmitting, password]);
  const resolvedErrorMessage = useMemo(() => {
    return errorMessage ?? authErrorMessage;
  }, [authErrorMessage, errorMessage]);

  const submitCredentials = useCallback(async (): Promise<void> => {
    await handleSignIn({
      email,
      password,
    });
  }, [email, handleSignIn, password]);

  const handleSubmitPress = useCallback((): void => {
    void submitCredentials();
  }, [submitCredentials]);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>PHASE 7 AUTH</Text>
        <Text style={styles.title}>Sign in to Dreyk Companion</Text>
        <Text style={styles.copy}>
          Use the same Supabase credentials as the web app. The companion will restore this session on the next launch.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        {resolvedErrorMessage === null ? null : <Text style={styles.error}>{resolvedErrorMessage}</Text>}

        <Pressable
          disabled={canSubmit === false}
          onPress={handleSubmitPress}
          style={[styles.button, canSubmit ? styles.buttonEnabled : styles.buttonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <Text style={styles.buttonLabel}>Sign in</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
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
  buttonEnabled: {
    backgroundColor: '#38bdf8',
  },
  buttonLabel: {
    color: '#020617',
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
  fieldGroup: {
    gap: 8,
  },
  input: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
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
