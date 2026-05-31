import { Redirect } from 'expo-router';
import Stack from 'expo-router/stack';

import { useAuthStore } from '../../features/auth/store/authStore';

export default function MainLayout(): JSX.Element | null {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);

  if (status === 'hydrating') {
    return null;
  }

  if (status !== 'authenticated' || profile === null) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
