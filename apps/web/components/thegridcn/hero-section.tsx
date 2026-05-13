'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface HeroSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  align?: 'left' | 'center';
  contentClassName?: string;
}

export function HeroSection({
  title,
  subtitle,
  description,
  badge,
  align = 'center',
  className,
  contentClassName,
  children,
  ...props
}: HeroSectionProps): JSX.Element {
  const isCentered = align === 'center';

  return (
    <section className={cn('w-full', className)} {...props}>
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-5',
          isCentered ? 'items-center text-center' : 'items-start text-left',
          contentClassName,
        )}
      >
        {badge !== undefined ? <div>{badge}</div> : null}

        {subtitle !== undefined ? (
          <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">{subtitle}</p>
        ) : null}

        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-[0.12em] text-foreground uppercase md:text-5xl">{title}</h1>

          {description !== undefined ? (
            <p
              className={cn(
                'text-sm leading-7 text-muted-foreground md:text-base',
                isCentered ? 'mx-auto max-w-3xl' : 'max-w-3xl',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        {children !== undefined ? (
          <div className={cn('flex w-full flex-wrap gap-3', isCentered ? 'justify-center' : 'justify-start')}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
