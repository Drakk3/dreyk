'use client';

import * as React from 'react';
import { PanelLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface AppTopbarProps {
  breadcrumbs: string[];
  highlightedBreadcrumbIndex?: number;
  initials: string;
  onCommandOpen: () => void;
  onDesktopSidebarToggle?: () => void;
  statusLabel: string;
  isDesktopSidebarOpen?: boolean;
}

export function AppTopbar({
  breadcrumbs,
  highlightedBreadcrumbIndex = 0,
  initials,
  onCommandOpen,
  onDesktopSidebarToggle,
  statusLabel,
  isDesktopSidebarOpen = true,
}: AppTopbarProps): JSX.Element {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(timer);
  }, []);

  const time = now?.toUTCString().slice(17, 25) ?? '--:--:--';
  const date = now?.toISOString().slice(0, 10) ?? '----.--.--';

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card/80 px-5 backdrop-blur">
      {onDesktopSidebarToggle !== undefined ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onDesktopSidebarToggle}
          className="hidden lg:inline-flex"
          aria-label={isDesktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <PanelLeft className="size-4" />
        </Button>
      ) : null}

      <div className="flex items-center gap-3">
        {breadcrumbs.map((breadcrumb, index) => {
          const isHighlighted = index === highlightedBreadcrumbIndex;
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={`${breadcrumb}-${index}`}>
              {index > 0 ? <span className="font-mono text-[10px] text-foreground/30">/</span> : null}
              <span
                className={`font-mono text-[10px] tracking-widest uppercase ${
                  isHighlighted
                    ? 'text-primary'
                    : isLast
                      ? 'text-foreground/60'
                      : 'text-foreground/40'
                }`}
              >
                {breadcrumb}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-foreground/60 uppercase">
          <span className="text-primary">|</span>
          <span>{statusLabel}</span>
          <span
            className="size-1 rounded-full bg-primary shrink-0"
            style={{ boxShadow: '0 0 6px var(--primary)' }}
          />
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-foreground/60 uppercase">
          <span className="text-primary">|</span>
          <span>
            {date} · {time} UTC
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-border/60" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onCommandOpen}
        className="font-mono text-[10px] tracking-widest uppercase gap-2"
      >
        <span>⌕</span>
        COMMAND
        <kbd className="font-mono text-[9px] px-1 py-px rounded border-thin border-border">⌘K</kbd>
      </Button>

      <div className="size-9 rounded-full border-thin border-primary/40 bg-primary/10 flex items-center justify-center font-mono text-xs text-primary shrink-0">
        {initials}
      </div>
    </header>
  );
}
