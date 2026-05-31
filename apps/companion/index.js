import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { createElement } from 'react';

export function App() {
  const context = require.context('./app');

  return createElement(ExpoRoot, { context });
}

registerRootComponent(App);
