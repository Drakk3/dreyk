import { DataCard } from '@/components/thegridcn/data-card';

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  trend?: { dir: 'up' | 'down'; val: string };
  status?: 'active' | 'inactive' | 'alert';
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  status = 'active',
}: KpiCardProps): JSX.Element {
  return (
    <DataCard status={status}>
      <div className="px-4 py-4 space-y-3">
        <div className="text-[10px] tracking-widest text-foreground/60 uppercase">{label}</div>
        <div className="flex items-end gap-2">
          <span className="text-primary font-mono text-2xl">|</span>
          <span className="font-mono text-3xl tracking-tight">{value}</span>
          {trend !== undefined ? (
            <span
              className={`font-mono text-[10px] tracking-widest uppercase ${
                trend.dir === 'up' ? 'text-accent' : 'text-destructive'
              }`}
            >
              {trend.dir === 'up' ? '▲' : '▼'} {trend.val}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-widest text-foreground/40 uppercase">
          <span className="size-1 rounded-full bg-primary shrink-0" />
          {sub}
        </div>
      </div>
    </DataCard>
  );
}
