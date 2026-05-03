'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface CommandMenuItem {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect?: () => void;
  group?: string;
}

interface CommandMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  items: CommandMenuItem[];
  placeholder?: string;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandMenu({
  items,
  placeholder = 'Type a command...',
  label,
  open: controlledOpen,
  onOpenChange,
  className,
  ...props
}: CommandMenuProps): JSX.Element | null {
  const [isInternalOpen, setIsInternalOpen] = React.useState(false);
  const isOpen = controlledOpen ?? isInternalOpen;
  const setOpen = onOpenChange ?? setIsInternalOpen;

  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim().toLowerCase();
  const filteredItems = React.useMemo(() => {
    if (trimmedQuery.length === 0) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.label.toLowerCase().includes(trimmedQuery) ||
        item.description?.toLowerCase().includes(trimmedQuery) === true ||
        item.group?.toLowerCase().includes(trimmedQuery) === true
      );
    });
  }, [items, trimmedQuery]);

  const groupedItems = React.useMemo(() => {
    const itemMap = new Map<string, CommandMenuItem[]>();

    filteredItems.forEach((item) => {
      const key = item.group ?? '';
      const currentItems = itemMap.get(key) ?? [];
      currentItems.push(item);
      itemMap.set(key, currentItems);
    });

    return Array.from(itemMap.entries());
  }, [filteredItems]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  React.useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen(!isOpen);
      }

      if (event.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [isOpen, setOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.min(currentIndex + 1, filteredItems.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      filteredItems[activeIndex]?.onSelect?.();
      setOpen(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  let flatIndex = -1;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
        }}
      />

      <div
        className={cn(
          'fixed top-[20%] left-1/2 z-50 w-full max-w-md -translate-x-1/2 overflow-hidden rounded border border-primary/40 bg-card/95 shadow-[0_0_40px_rgba(var(--primary-rgb,0,180,255),0.08)] backdrop-blur-md',
          className,
        )}
        data-slot="tron-command-menu"
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

        {label !== undefined ? (
          <div className="border-b border-primary/20 px-4 py-2 text-[9px] tracking-widest text-foreground/30 uppercase">
            {label}
          </div>
        ) : null}

        <div className="relative border-b border-primary/20">
          <svg
            className="absolute top-1/2 left-4 -translate-y-1/2 text-foreground/30"
            fill="none"
            height="14"
            viewBox="0 0 14 14"
            width="14"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          </svg>
          <input
            ref={inputRef}
            className="w-full bg-transparent py-3 pr-4 pl-10 font-mono text-sm text-foreground outline-none placeholder:text-foreground/25"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            type="text"
            value={query}
          />
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
          {groupedItems.map(([groupName, groupItems]) => {
            return (
              <div key={groupName}>
                {groupName.length > 0 ? (
                  <div className="px-4 pt-2 pb-1 text-[9px] tracking-widest text-foreground/25 uppercase">
                    {groupName}
                  </div>
                ) : null}
                {groupItems.map((item) => {
                  flatIndex += 1;
                  const currentIndex = flatIndex;

                  return (
                    <button
                      key={`${groupName}-${item.label}`}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                        currentIndex === activeIndex
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/70 hover:bg-primary/5',
                      )}
                      onClick={() => {
                        item.onSelect?.();
                        setOpen(false);
                      }}
                      onMouseEnter={() => {
                        setActiveIndex(currentIndex);
                      }}
                      type="button"
                    >
                      {item.icon !== undefined ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-foreground/30">
                          {item.icon}
                        </span>
                      ) : null}
                      <div className="flex-1">
                        <div className="font-mono text-xs">{item.label}</div>
                        {item.description !== undefined ? (
                          <div className="text-[10px] text-foreground/30">{item.description}</div>
                        ) : null}
                      </div>
                      {item.shortcut !== undefined ? (
                        <kbd className="rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 font-mono text-[9px] text-foreground/30">
                          {item.shortcut}
                        </kbd>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {filteredItems.length === 0 ? (
            <div className="py-6 text-center font-mono text-[10px] tracking-widest text-foreground/25 uppercase">
              No results found
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 border-t border-primary/20 px-4 py-2">
          <span className="font-mono text-[8px] text-foreground/20">
            <kbd className="rounded border border-primary/15 bg-primary/5 px-1 py-0.5">↑↓</kbd>{' '}
            navigate
          </span>
          <span className="font-mono text-[8px] text-foreground/20">
            <kbd className="rounded border border-primary/15 bg-primary/5 px-1 py-0.5">↵</kbd>{' '}
            select
          </span>
          <span className="font-mono text-[8px] text-foreground/20">
            <kbd className="rounded border border-primary/15 bg-primary/5 px-1 py-0.5">esc</kbd>{' '}
            close
          </span>
        </div>

        <div className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-primary/50" />
        <div className="pointer-events-none absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-primary/50" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-primary/50" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-primary/50" />
      </div>
    </>
  );
}
