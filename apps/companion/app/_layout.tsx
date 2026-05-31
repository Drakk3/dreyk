import Stack from 'expo-router/stack';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuthBootstrap } from '../features/auth/hooks/useAuthBootstrap';

export default function RootLayout(): JSX.Element {
  const { errorMessage, isReady } = useAuthBootstrap();

  if (isReady === false) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color="#38bdf8" size="large" />
        <Text style={styles.title}>Restoring companion session…</Text>
        {errorMessage === null ? null : <Text style={styles.copy}>{errorMessage}</Text>}
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = {
  copy: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  screen: {
    alignItems: 'center',
    backgroundColor: '#020617',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
};
