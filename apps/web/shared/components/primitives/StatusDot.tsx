import * as React from 'react';

interface StatusDotProps {
  tone?: 'primary' | 'accent' | 'destructive' | 'muted';
  pulse?: boolean;
  size?: number;
}

export function StatusDot({
  tone = 'primary',
  pulse = false,
  size = 6,
}: StatusDotProps): JSX.Element {
  const bgColor = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    destructive: 'bg-destructive',
    muted: 'bg-foreground/20',
  }[tone];

  const glowColor = {
    primary: 'var(--primary)',
    accent: 'var(--accent)',
    destructive: 'var(--destructive)',
    muted: 'transparent',
  }[tone];

  return (
    <span
      className={`inline-block rounded-full shrink-0 ${bgColor} ${pulse ? 'blink' : ''}`}
      style={{
        width: size,
        height: size,
        boxShadow: tone !== 'muted' ? `0 0 6px ${glowColor}` : undefined,
      }}
    />
  );
}
