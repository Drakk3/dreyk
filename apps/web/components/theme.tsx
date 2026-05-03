"use client";

// STUB — reemplazar ejecutando: npx shadcn@latest add @thegridcn/theme-ares
// El CLI generará el ThemeProvider real con soporte completo de identidades GridCN.

import * as React from "react";

type GridCNTheme = "ares" | "tron" | "clu" | "athena" | "aphrodite" | "poseidon";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: GridCNTheme;
}

export function ThemeProvider({ children, defaultTheme = "ares" }: ThemeProviderProps): React.ReactElement {
  return (
    <div data-theme={defaultTheme} className="contents">
      {children}
    </div>
  );
}
