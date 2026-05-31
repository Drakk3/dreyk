declare module '@react-native-async-storage/async-storage' {
  export interface AsyncStorageStatic {
    clear(): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    setItem(key: string, value: string): Promise<void>;
  }

  const AsyncStorage: AsyncStorageStatic;

  export default AsyncStorage;
}

declare module 'react-native-url-polyfill/auto' {}

declare module 'react-native' {
  import type * as React from 'react';

  export interface ActivityIndicatorProps {
    color?: string;
    size?: 'small' | 'large' | number;
    style?: unknown;
  }

  export interface PressableProps {
    children?: React.ReactNode;
    disabled?: boolean;
    onPress?: () => void;
    style?: unknown;
  }

  export interface TextInputProps {
    autoCapitalize?: 'characters' | 'none' | 'sentences' | 'words';
    autoComplete?: string;
    keyboardType?: 'default' | 'email-address';
    onChangeText?: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    style?: unknown;
    value?: string;
  }

  export interface TextProps {
    children?: React.ReactNode;
    style?: unknown;
  }

  export interface ViewProps {
    children?: React.ReactNode;
    style?: unknown;
  }

  export const ActivityIndicator: (props: ActivityIndicatorProps) => JSX.Element;
  export const Pressable: (props: PressableProps) => JSX.Element;
  export const Text: (props: TextProps) => JSX.Element;
  export const TextInput: (props: TextInputProps) => JSX.Element;
  export const View: (props: ViewProps) => JSX.Element;
}

declare module 'expo-router' {
  export interface RedirectProps {
    href: string;
  }

  export const Redirect: (props: RedirectProps) => JSX.Element | null;
  export const Slot: () => JSX.Element | null;
  export function useSegments(): string[];
}

declare module 'zustand' {
  export type StoreUpdater<TState> =
    | TState
    | Partial<TState>
    | ((state: TState) => TState | Partial<TState>);

  export interface UseBoundStore<TState> {
    (): TState;
    <TSelected>(selector: (state: TState) => TSelected): TSelected;
  }

  export function create<TState>(
    initializer: (set: (updater: StoreUpdater<TState>) => void) => TState,
  ): UseBoundStore<TState>;
}
