import type { TeachingPathSummary } from '../types';

export interface TeachingRequirementRow {
  note: string;
  requirement: string;
  status: string;
}

export interface TeachingRouteOption {
  description: string;
  title: string;
}

export interface TeachingSalaryRow {
  note: string;
  stage: string;
  usdReference: string;
  valueCop: string;
}

export interface TeachingTimelineEntry {
  date: string;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
  title: string;
}

export interface TeachingChecklistEntry {
  detail: string;
  title: string;
}

export interface TeachingConvalidationCallout {
  cost: string;
  timeline: string;
}

export interface TeachingRouteBrief {
  checklist: TeachingChecklistEntry[];
  convalidationCallout: TeachingConvalidationCallout;
  currentFocusLabel: string;
  intro: string;
  salaryRows: TeachingSalaryRow[];
  timeline: TeachingTimelineEntry[];
  routeOptions: TeachingRouteOption[];
  requirements: TeachingRequirementRow[];
}

export function buildTeachingRouteBrief(teachingPath: TeachingPathSummary): TeachingRouteBrief {
  return {
    currentFocusLabel: teachingPath.currentMilestone?.dueLabel ?? 'Ruta activa',
    intro:
      'Esta pestaña documenta la ruta real para entrar al sistema oficial de educación en Meta con foco en Cumaral: requisitos, tiempos, costos, vías de ingreso y acciones de ejecución inmediata.',
    requirements: [
      {
        requirement: 'Título UTEL',
        status: 'Base académica',
        note: 'Sirve como punto de partida, pero por sí solo no habilita ingreso al sistema oficial colombiano.',
      },
      {
        requirement: 'Convalidación MEN',
        status: 'No negociable',
        note: 'El título extranjero debe quedar convalidado ante el Ministerio de Educación Nacional antes de mover la ruta formal.',
      },
      {
        requirement: 'Curso para entrar al escalafón',
        status: 'Requerido para no licenciado',
        note: 'Se necesita formación pedagógica o programa equivalente para entrar bien armado al Decreto 1278.',
      },
      {
        requirement: 'Documentos apostillados',
        status: 'Soporte crítico',
        note: 'México exige apostilla previa por SEP/SRE para que la convalidación en Colombia tenga piso documental.',
      },
      {
        requirement: 'Cédula colombiana vigente',
        status: 'Operativo',
        note: 'La piden para trámites, plataformas, contratación, SIMO y cualquier movimiento administrativo.',
      },
    ],
    convalidationCallout: {
      timeline: 'Referencia: 4 a 8 meses si el expediente sale limpio; puede alargarse si el MEN pide aclaraciones.',
      cost: 'Referencia: COP 1.3M a 2.2M en trámites, apostillas, copias y envíos (sin contar traducciones extraordinarias).',
    },
    routeOptions: [
      {
        title: 'UNAD',
        description: 'Ruta pública y conocida para cerrar el componente pedagógico con buena lógica de costo-beneficio.',
      },
      {
        title: 'UNIMINUTO',
        description: 'Alternativa práctica si conviene por calendario, modalidad o velocidad de matrícula.',
      },
      {
        title: 'UNIR Colombia',
        description: 'Opción más flexible para compatibilizar trabajo, trámite documental y preparación de ingreso.',
      },
    ],
    salaryRows: [
      {
        stage: 'Entrada provisional / reemplazos',
        valueCop: 'COP 2.8M – 3.4M',
        usdReference: '≈ USD 720 – 875',
        note: 'Referencia operativa; depende de grado, asignación y prestaciones liquidadas.',
      },
      {
        stage: 'Ingreso estable bajo Decreto 1278',
        valueCop: 'COP 3.6M – 4.4M',
        usdReference: '≈ USD 925 – 1,130',
        note: 'Escenario razonable al entrar formalmente al sistema con área de Tecnología e Informática.',
      },
      {
        stage: 'Con escalafón más afinado',
        valueCop: 'COP 4.5M – 5.4M',
        usdReference: '≈ USD 1,155 – 1,385',
        note: 'Sube con antigüedad, grado y mejor posición administrativa.',
      },
      {
        stage: '2030+ con continuidad',
        valueCop: 'COP 5.5M+',
        usdReference: '≈ USD 1,410+',
        note: 'Proyección editorial, no promesa salarial; sirve para ordenar expectativas del plan de vida.',
      },
    ],
    timeline: [
      {
        date: '2026 · ahora',
        title: 'Blindar expediente y mover salida rápida',
        description:
          'Apostillar por SEP/SRE, organizar carpeta MEN, activar Banco de Instructores SENA y vigilar Sistema Maestro para entrada provisional.',
        status: 'active',
      },
      {
        date: '2026 · segundo semestre',
        title: 'Radicar convalidación y sostener visibilidad',
        description:
          'El objetivo es que el expediente no duerma: radicación MEN, seguimiento y evidencia complementaria de perfil docente.',
        status: 'upcoming',
      },
      {
        date: '2027',
        title: 'Cerrar componente pedagógico para escalafón',
        description:
          'Tomar el curso o programa requerido y usarlo para entrar con mejor posición al marco del Decreto 1278.',
        status: 'upcoming',
      },
      {
        date: '2028',
        title: 'Competir por concurso',
        description:
          'Entrar fuerte a CNSC/SIMO con expediente limpio, área objetivo clara y preparación enfocada en plaza oficial.',
        status: 'upcoming',
      },
      {
        date: '2029',
        title: 'Estabilizar plaza y aterrizaje en Meta',
        description:
          'Usar el ingreso oficial para reforzar vivienda, continuidad laboral y la meta financiera del plan general.',
        status: 'upcoming',
      },
      {
        date: '2030+',
        title: 'Consolidar carrera docente',
        description:
          'Ya no se trata de entrar, sino de sostener escalafón, salario y capacidad de compra con disciplina administrativa.',
        status: 'upcoming',
      },
    ],
    checklist: [
      {
        title: 'Abrir carpeta maestra del proceso',
        detail: 'Cédula, título UTEL, certificados, notas y soportes listos en versión física y digital.',
      },
      {
        title: 'Solicitar apostilla en México',
        detail: 'Mover SEP/SRE antes de pensar en MEN; sin eso el expediente nace flojo.',
      },
      {
        title: 'Preparar radicación de convalidación MEN',
        detail: 'Definir costo, tiempos, orden documental y seguimiento de respuesta.',
      },
      {
        title: 'Entrar ya a Banco de Instructores SENA',
        detail: 'Es la jugada inmediata para ganar tracción, experiencia visible y relato operativo.',
      },
      {
        title: 'Monitorear Sistema Maestro',
        detail: 'Ruta A para provisionalidad mientras madura la entrada más estable del sistema.',
      },
      {
        title: 'Abrir radar CNSC / SIMO',
        detail: 'Ruta B para concurso; se prepara con tiempo, no el día que publiquen la convocatoria.',
      },
    ],
  };
}
