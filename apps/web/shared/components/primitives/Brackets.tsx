import * as React from 'react';

interface BracketsProps {
  size?: number;
  color?: 'primary' | 'destructive' | 'muted';
}

export function Brackets({ size = 4, color = 'primary' }: BracketsProps): JSX.Element {
  const s = `${size * 0.25}rem`;
  const colorClass = {
    primary: 'border-primary/50',
    destructive: 'border-destructive/50',
    muted: 'border-muted',
  }[color];
  const cls = `pointer-events-none absolute ${colorClass}`;
  return (
    <>
      <span
        className={`${cls} top-0 left-0`}
        style={{ width: s, height: s, borderTop: '2px solid', borderLeft: '2px solid' }}
      />
      <span
        className={`${cls} top-0 right-0`}
        style={{ width: s, height: s, borderTop: '2px solid', borderRight: '2px solid' }}
      />
      <span
        className={`${cls} bottom-0 left-0`}
        style={{ width: s, height: s, borderBottom: '2px solid', borderLeft: '2px solid' }}
      />
      <span
        className={`${cls} bottom-0 right-0`}
        style={{ width: s, height: s, borderBottom: '2px solid', borderRight: '2px solid' }}
      />
    </>
  );
}
