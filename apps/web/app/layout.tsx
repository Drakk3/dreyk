import type { ReactNode } from 'react';

import './globals.css';

import { ThemeProvider } from '@/components/Theme';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="ares"
          disableTransitionOnChange
          enableSystem={false}
          themes={['ares']}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
