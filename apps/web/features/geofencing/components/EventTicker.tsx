const TICKER_ITEMS: string[] = [
  '06:42:11 / HELENA.M / ENTER / OFICINA / DIST 12M',
  '06:39:48 / DRAKK3 / EXIT / CASA-NORTH / DIST 132M',
  '06:33:02 / IKER.A / ENTER / ESCUELA / DIST 24M',
  '06:28:55 / NORA.V / ENTER / ESTUDIO / DIST 8M',
  '06:14:09 / THEO.R / EXIT / RUTA-TEST / DIST 41M',
  '06:11:51 / DRAKK3 / ENTER / CASA-NORTH / DIST 4M',
  '06:02:30 / HELENA.M / EXIT / CASA-NORTH / DIST 96M',
];

const STREAM: string[] = [...TICKER_ITEMS, ...TICKER_ITEMS];

export function EventTicker(): JSX.Element {
  return (
    <div className="border-thin border-primary/30 bg-card/60 overflow-hidden relative rounded">
      <div className="flex items-center">
        <div className="px-3 py-2 border-r border-primary/30 bg-primary/10 flex items-center gap-2 shrink-0">
          <span
            className="size-1.5 rounded-full bg-destructive blink"
            style={{ boxShadow: '0 0 8px var(--destructive)' }}
          />
          <span className="font-mono text-[10px] tracking-widest text-primary uppercase">MOCK</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-flow flex gap-8 whitespace-nowrap py-2 font-mono text-[11px] tracking-widest text-foreground/70">
            {STREAM.map((tickerItem, index) => (
              <span key={`${tickerItem}-${index}`} className="flex items-center gap-3">
                <span className="text-primary">|</span>
                {tickerItem}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
