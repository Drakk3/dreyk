'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface DataFieldProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DataField({ label, value, highlight = false }: DataFieldProps): JSX.Element {
  return (
    <div className="space-y-1">
      <div className="text-[10px] tracking-widest text-foreground/80 uppercase">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-primary">|</span>
        <span
          className={cn(
            'font-mono text-sm tracking-wide uppercase',
            highlight ? 'bg-primary/20 px-2 py-0.5' : '',
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

interface DataCardField {
  label: string;
  value: string;
  highlight?: boolean;
}

interface DataCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  fields?: DataCardField[];
  status?: 'active' | 'inactive' | 'alert';
}

export function DataCard({
  title,
  subtitle,
  fields = [],
  status = 'active',
  className,
  children,
  ...props
}: DataCardProps): JSX.Element {
  const statusColors = {
    active: 'border-primary/50',
    inactive: 'border-muted',
    alert: 'border-destructive/50',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded border bg-card/80 backdrop-blur-sm',
        statusColors[status],
        className,
      )}
      data-slot="tron-data-card"
      data-status={status}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

      {(title !== undefined || subtitle !== undefined) ? (
        <div className="border-b border-border/50 px-4 py-2">
          {subtitle !== undefined ? (
            <div className="text-[10px] tracking-widest text-foreground/80 uppercase">{subtitle}</div>
          ) : null}
          {title !== undefined ? (
            <div className="flex items-center gap-2">
              <span className="text-primary">|</span>
              <h3 className="text-lg font-bold tracking-wider uppercase">{title}</h3>
            </div>
          ) : null}
        </div>
      ) : null}

      {fields.length > 0 ? (
        <div className="space-y-3 p-4">
          {fields.map((field, index) => {
            return (
              <DataField
                key={`${field.label}-${index}`}
                highlight={field.highlight}
                label={field.label}
                value={field.value}
              />
            );
          })}
        </div>
      ) : null}

      {children !== undefined ? children : null}

      <div className="pointer-events-none absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-primary/50" />
      <div className="pointer-events-none absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary/50" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-primary/50" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2 border-primary/50" />
    </div>
  );
}
