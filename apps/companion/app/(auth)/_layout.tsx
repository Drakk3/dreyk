import { Redirect } from 'expo-router';
import Stack from 'expo-router/stack';

import { useAuthStore } from '../../features/auth/store/authStore';

export default function AuthLayout(): JSX.Element | null {
  const status = useAuthStore((state) => state.status);

  if (status === 'hydrating') {
    return null;
  }

  if (status === 'authenticated') {
    return <Redirect href="/(main)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
