'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, type FormEvent } from 'react';

import { AppError, handleError } from '@/shared/lib/errors';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

interface SignInFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface UseAuthSignInResult {
  email: string;
  errorMessage: string | null;
  handleRememberMeChange: (checked: boolean) => void;
  handleSignIn: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isRememberMeEnabled: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
}

export function useAuthSignIn(): UseAuthSignInResult {
  // 1. External dependencies (store, supabase, theme)
  const router = useRouter();
  const [supabase] = useState(() => getSupabaseBrowserClient());

  // 2. Local state
  const [formValues, setFormValues] = useState<SignInFormValues>({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3. Derived values (useMemo)
  const isSubmitDisabled = useMemo(() => {
    return (
      isSubmitting ||
      formValues.email.trim().length === 0 ||
      formValues.password.trim().length === 0
    );
  }, [formValues.email, formValues.password, isSubmitting]);

  // 4. Handlers and effects (useCallback, useEffect)
  const setEmail = useCallback((value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      email: value,
    }));
  }, []);

  const setPassword = useCallback((value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      password: value,
    }));
  }, []);

  const handleRememberMeChange = useCallback((checked: boolean) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      rememberMe: checked,
    }));
  }, []);

  const handleSignIn = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formValues.email.trim(),
          password: formValues.password,
        });

        if (error !== null) {
          throw new AppError(error.message, 'useAuthSignIn.handleSignIn', error);
        }

        router.replace('/');
        router.refresh();
      } catch (error: unknown) {
        handleError(error, 'useAuthSignIn.handleSignIn');
        setErrorMessage('Unable to establish the DREYK access session. Verify your credentials and retry.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues.email, formValues.password, supabase, router],
  );

  // 5. Single return object — NEVER return an array from a hook
  return {
    email: formValues.email,
    errorMessage,
    handleRememberMeChange,
    handleSignIn,
    isRememberMeEnabled: formValues.rememberMe,
    isSubmitDisabled,
    isSubmitting,
    password: formValues.password,
    setEmail,
    setPassword,
  };
}
