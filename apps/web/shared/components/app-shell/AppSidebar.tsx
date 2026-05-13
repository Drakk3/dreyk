'use client';

import { useAuthSignOut } from '@/shared/hooks/useAuthSignOut';

export interface AppSidebarItem {
  key: string;
  label: string;
  icon: string;
  badge?: string;
  isDisabled?: boolean;
}

export interface AppSidebarSection {
  key: string;
  label: string;
  items: AppSidebarItem[];
}

interface AppSidebarProps {
  activeItemKey: string;
  brandName: string;
  brandTagline: string;
  navSections: AppSidebarSection[];
  onItemSelect: (key: string) => void;
  userDisplayName: string;
  userInitials: string;
  userRoleLabel: string;
}

export function AppSidebar({
  activeItemKey,
  brandName,
  brandTagline,
  navSections,
  onItemSelect,
  userDisplayName,
  userInitials,
  userRoleLabel,
}: AppSidebarProps): JSX.Element {
  const { handleSignOut, isSigningOut } = useAuthSignOut();

  const handleSignOutClick = (): void => {
    void handleSignOut();
  };

  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-border bg-card/40">
      <div className="px-5 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative size-7 rounded border-thin border-primary/60 flex items-center justify-center bg-primary/10 glow-sm">
            <span className="font-mono text-primary text-xs font-bold">{brandName.slice(0, 1)}</span>
            <span className="absolute inset-0 rounded border border-primary/30 blink" />
          </div>
          <div>
            <div className="font-mono text-sm tracking-[0.22em] uppercase">{brandName}</div>
            <div className="font-mono text-[9px] tracking-widest text-foreground/40 uppercase">
              {brandTagline}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {navSections.map((section) => (
          <div key={section.key} className="contents">
            <div className="px-4 pb-1.5 font-mono text-[9px] tracking-widest text-foreground/30 uppercase">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = activeItemKey === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => onItemSelect(item.key)}
                  className={`relative w-full grid grid-cols-[18px_1fr_auto] items-center gap-3 px-4 h-9 text-left font-mono text-xs tracking-widest uppercase transition-colors ${
                    item.isDisabled
                      ? 'text-foreground/30'
                      : isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground/60 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {isActive && !item.isDisabled ? (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-px bg-primary"
                      style={{ boxShadow: '0 0 8px var(--primary)' }}
                    />
                  ) : null}
                  <span
                    className={`text-center ${
                      item.isDisabled
                        ? 'text-foreground/40'
                        : isActive
                          ? 'text-primary'
                          : 'text-foreground/40'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined ? (
                    <span className="font-mono text-[9px] px-1.5 rounded border-thin border-destructive/50 bg-destructive/20 text-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-2 px-2">
          <div className="size-7 rounded-full border-thin border-primary/40 flex items-center justify-center font-mono text-[10px] text-primary bg-primary/10 shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] tracking-widest uppercase truncate">
              {userDisplayName}
            </div>
            <div className="font-mono text-[9px] tracking-widest text-foreground/40 uppercase">
              {userRoleLabel}
            </div>
          </div>
          <span
            className="size-1.5 rounded-full bg-primary shrink-0"
            style={{ boxShadow: '0 0 6px var(--primary)' }}
          />
        </div>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={handleSignOutClick}
          className="w-full flex items-center justify-between gap-2 px-3 h-9 rounded border-thin border-destructive/30 bg-background/60 hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
        >
          <span className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase">
            {isSigningOut ? 'SIGNING OUT…' : '⏻ SIGN OUT'}
          </span>
        </button>
      </div>
    </aside>
  );
}
