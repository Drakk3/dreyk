'use client';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { Timeline } from '@/components/thegridcn/timeline';

import { useTeachingRouteBrief } from '../hooks/useTeachingRouteBrief';
import type { TeachingPathSummary } from '../types';

interface TeachingSurfaceProps {
  teachingPath: TeachingPathSummary;
}

interface SectionTitleProps {
  title: string;
}

interface ChecklistItemProps {
  detail: string;
  title: string;
}

function SectionTitle({ title }: SectionTitleProps): JSX.Element {
  return <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">{title}</h2>;
}

function ChecklistItem({ detail, title }: ChecklistItemProps): JSX.Element {
  return (
    <li className="flex gap-3 rounded border border-border/50 bg-background/25 px-3 py-3">
      <span className="mt-0.5 text-xs text-primary">✓</span>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

export function TeachingSurface({ teachingPath }: TeachingSurfaceProps): JSX.Element {
  const brief = useTeachingRouteBrief(teachingPath);

  return (
    <DataCard
      subtitle="TEACHING · RUTA OFICIAL"
      title="Teaching / Ruta Cumaral Meta"
      headerRight={<Badge variant="default">{brief.currentFocusLabel}</Badge>}
    >
      <div className="space-y-8 p-5">
        <div className="space-y-3 border-b border-border/50 pb-5">
          <p className="max-w-4xl text-sm leading-7 text-muted-foreground">{brief.intro}</p>
        </div>

        <section className="space-y-3">
          <SectionTitle title="Marco administrativo" />
          <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
            <li>• Cumaral no es entidad territorial certificada; la gobernanza educativa la lleva la Secretaría de Educación Departamental del Meta.</li>
            <li>• La ruta objetivo es magisterio oficial bajo Decreto 1278, no una salida académica difusa o privada sin estrategia.</li>
            <li>• El frente funcional es el área de Tecnología e Informática, porque ahí debe alinearse el relato profesional, documental y de convocatoria.</li>
            <li>• Las vacantes, provisionales y movimientos administrativos relevantes pasan por la lógica departamental y sus plataformas de ingreso.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <SectionTitle title="Requisitos no negociables" />
          <div className="overflow-x-auto rounded border border-border/60">
            <table className="w-full border-collapse text-left">
              <thead className="bg-background/60">
                <tr>
                  <th className="border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    Requisito
                  </th>
                  <th className="border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    Estado
                  </th>
                  <th className="border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {brief.requirements.map((requirement) => (
                  <tr key={requirement.requirement} className="align-top">
                    <td className="border-b border-border/40 px-3 py-3 text-sm font-medium text-foreground">
                      {requirement.requirement}
                    </td>
                    <td className="border-b border-border/40 px-3 py-3 text-sm text-foreground/80">{requirement.status}</td>
                    <td className="border-b border-border/40 px-3 py-3 text-sm leading-6 text-muted-foreground">{requirement.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle title="Convalidación del título" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <p className="text-sm leading-7 text-muted-foreground">
              El título de UTEL necesita convalidación formal ante el MEN para jugar en serio dentro del sistema oficial colombiano.
              Antes de radicar, los soportes deben salir apostillados desde México por la vía SEP/SRE. Esa secuencia importa: si el expediente
              entra incompleto o flojo, el reloj administrativo se estira y te quema meses por gusto.
            </p>
            <div className="rounded border border-primary/30 bg-primary/5 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">Timeline / costo de referencia</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>{brief.convalidationCallout.timeline}</p>
                <p>{brief.convalidationCallout.cost}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle title="Ingreso al escalafón" />
          <p className="text-sm leading-7 text-muted-foreground">
            Si el título base no es licenciatura, la entrada al escalafón pide cerrar el componente pedagógico con una institución que te dé
            validez, calendario manejable y costo razonable. Acá la jugada no es improvisar: es escoger una ruta que conviva con trabajo,
            convalidación y vigilancia de convocatorias.
          </p>
          <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
            {brief.routeOptions.map((option) => (
              <li key={option.title}>
                • <span className="font-medium text-foreground">{option.title}:</span> {option.description}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Rutas de entrada" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-border/60 bg-background/25 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">Ruta A · provisional</div>
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Sistema Maestro</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Es la vía más rápida para entrar al aula si aparece vacante y el expediente ya respira seriedad. No reemplaza el concurso,
                pero sí te da tracción, experiencia visible y presencia territorial mientras la ruta larga madura.
              </p>
            </div>
            <div className="rounded border border-border/60 bg-background/25 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">Ruta B · concurso</div>
              <h3 className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">CNSC / SIMO</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Es la vía estructural para entrar con mayor estabilidad. Pide más paciencia, preparación y timing administrativo, pero es la
                ruta que convierte intención en carrera formal y sostenida dentro del sistema oficial.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle title="Proyección salarial" />
          <div className="overflow-x-auto rounded border border-border/60">
            <table className="w-full border-collapse text-left">
              <thead className="bg-background/60">
                <tr>
                  <th className="border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    Etapa
                  </th>
                  <th className="border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    Referencia COP
                  </th>
                  <th className="border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    Referencia USD
                  </th>
                  <th className="border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {brief.salaryRows.map((row) => (
                  <tr key={row.stage} className="align-top">
                    <td className="border-b border-border/40 px-3 py-3 text-sm font-medium text-foreground">{row.stage}</td>
                    <td className="border-b border-border/40 px-3 py-3 text-sm text-foreground/80">{row.valueCop}</td>
                    <td className="border-b border-border/40 px-3 py-3 text-sm text-foreground/80">{row.usdReference}</td>
                    <td className="border-b border-border/40 px-3 py-3 text-sm leading-6 text-muted-foreground">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle title="Ventaja estratégica" />
          <div className="rounded border border-primary/35 bg-primary/6 p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              La ventaja no está en esperar a que todo quede perfecto. Está en jugar doble carril: convalidación + componente pedagógico para
              abrir la puerta formal, mientras Banco de Instructores SENA y la vigilancia de Sistema Maestro te ponen en movimiento ya. Perfil
              tecnológico, foco territorial en Meta y disciplina documental: esa combinación es la que vuelve esta ruta defendible.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle title="Timeline" />
          <Timeline
            label="2026 → 2030+ · RUTA DOCENTE"
            items={brief.timeline.map((entry) => ({
              date: entry.date,
              description: entry.description,
              status: entry.status,
              title: entry.title,
            }))}
          />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Acciones inmediatas" />
          <ul className="space-y-3">
            {brief.checklist.map((entry) => (
              <ChecklistItem key={entry.title} detail={entry.detail} title={entry.title} />
            ))}
          </ul>
        </section>
      </div>
    </DataCard>
  );
}
