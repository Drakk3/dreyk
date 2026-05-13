'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { SessionSignOutButton } from '@/shared/components/SessionSignOutButton';

interface TopbarProps {
  onCmdK: () => void;
  initials: string;
}

export function Topbar({ onCmdK, initials }: TopbarProps): JSX.Element {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now?.toUTCString().slice(17, 25) ?? '--:--:--';
  const date = now?.toISOString().slice(0, 10) ?? '----.--.--';

  return (
    <header className="flex items-center gap-4 h-14 px-5 border-b border-border bg-card/40 shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase">
          PWA / WEB · APPS/WEB
        </span>
        <span className="font-mono text-[10px] text-foreground/30">/</span>
        <span className="font-mono text-[10px] tracking-widest text-primary uppercase">
          OPERATIONS
        </span>
        <span className="font-mono text-[10px] text-foreground/30">/</span>
        <span className="font-mono text-[10px] tracking-widest text-foreground/60 uppercase">
          DASHBOARD
        </span>
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-foreground/60 uppercase">
          <span className="text-primary">|</span>
          <span>MOCK STATUS · PREVIEW</span>
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
        onClick={onCmdK}
        className="font-mono text-[10px] tracking-widest uppercase gap-2"
      >
        <span>⌕</span>
        COMMAND
        <kbd className="font-mono text-[9px] px-1 py-px rounded border-thin border-border">⌘K</kbd>
      </Button>

      <SessionSignOutButton className="font-mono text-[10px] tracking-widest uppercase" />

      <div className="size-9 rounded-full border-thin border-primary/40 bg-primary/10 flex items-center justify-center font-mono text-xs text-primary shrink-0">
        {initials}
      </div>
    </header>
  );
}
