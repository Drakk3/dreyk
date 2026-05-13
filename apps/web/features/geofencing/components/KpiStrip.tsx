import { KpiCard } from './KpiCard';

export function KpiStrip(): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        label="ACTIVE ZONES"
        value="04 / 05"
        sub="GROUP-α · ARMED"
        trend={{ dir: 'up', val: '+1' }}
      />
      <KpiCard
        label="MEMBERS ONLINE"
        value="04 / 05"
        sub="LIVE GPS · < 30S"
        trend={{ dir: 'up', val: '100%' }}
      />
      <KpiCard
        label="EVENTS / 24H"
        value="418"
        sub="ENTER 247 · EXIT 171"
        trend={{ dir: 'up', val: '12.4%' }}
      />
      <KpiCard
        label="ALEXA TRIGGERS"
        value="037"
        sub="3 DEVICES · OK"
        trend={{ dir: 'down', val: '1.1%' }}
        status="alert"
      />
    </div>
  );
}
