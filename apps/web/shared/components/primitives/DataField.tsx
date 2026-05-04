import * as React from 'react';

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  accent?: boolean;
  mono?: boolean;
}

export function DataField({
  label,
  value,
  highlight = false,
  accent = false,
  mono = true,
}: DataFieldProps): JSX.Element {
  return (
    <div className="space-y-1">
      <div className="text-[10px] tracking-widest text-foreground/60 uppercase">{label}</div>
      <div className="flex items-center gap-2">
        <span className={`font-mono ${accent ? 'text-accent' : 'text-primary'}`}>|</span>
        <span
          className={`${mono ? 'font-mono' : ''} text-sm tracking-wide uppercase ${highlight ? 'bg-primary/20 px-2 py-0.5' : ''}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
