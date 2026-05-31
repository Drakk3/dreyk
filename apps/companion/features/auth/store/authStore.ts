import { create } from 'zustand';

import {
  createAnonymousAuthSessionSnapshot,
  createAuthenticatedAuthSessionSnapshot,
  createHydratingAuthSessionSnapshot,
} from '../services/authSession';
import type { ResolvedAuthContext } from '../types';

export interface AuthStoreState {
  clearSession: () => void;
  errorMessage: string | null;
  profile: ResolvedAuthContext['profile'] | null;
  session: ResolvedAuthContext['session'] | null;
  setAnonymous: (errorMessage?: string | null) => void;
  setAuthenticated: (context: ResolvedAuthContext) => void;
  setErrorMessage: (errorMessage: string | null) => void;
  setHydrating: () => void;
  status: 'hydrating' | 'anonymous' | 'authenticated';
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  ...createHydratingAuthSessionSnapshot(),
  clearSession: () => {
    set(createAnonymousAuthSessionSnapshot());
  },
  setAnonymous: (errorMessage = null) => {
    set(createAnonymousAuthSessionSnapshot(errorMessage));
  },
  setAuthenticated: (context) => {
    set(createAuthenticatedAuthSessionSnapshot(context));
  },
  setErrorMessage: (errorMessage) => {
    set((state) => ({
      ...state,
      errorMessage,
    }));
  },
  setHydrating: () => {
    set(createHydratingAuthSessionSnapshot());
  },
}));
