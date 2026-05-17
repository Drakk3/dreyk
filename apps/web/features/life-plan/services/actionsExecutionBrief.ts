export interface ActionChecklistItem {
  detail: string;
  tag: string;
  title: string;
}

export interface ActionTimeBlock {
  description: string;
  items: ActionChecklistItem[];
  label: string;
}

export interface ActionsExecutionBrief {
  intro: string;
  principle: string;
  timeline: ActionTimeBlock[];
}

export function buildActionsExecutionBrief(): ActionsExecutionBrief {
  return {
    intro:
      'This tab is the execution lane for Protocolo Colombia. It keeps only dated actions that move the plan forward, so the work does not dissolve into vague next-step lists.',
    principle:
      'Every item here should either reduce debt pressure, unlock the teaching route, or prepare the move toward Cumaral by 2029.',
    timeline: [
      {
        label: 'Now · May 2026',
        description: 'Immediate actions that build traction without waiting for the UTEL degree or Colombia move window.',
        items: [
          {
            title: 'Register in Banco de Instructores SENA',
            detail: 'Open the instructor route now so logistics/technology teaching experience starts accumulating before 2029.',
            tag: 'career',
          },
          {
            title: 'Request certified work letters',
            detail: 'Collect ALO and related employment evidence in English and Spanish with dates, duties, and signatures.',
            tag: 'docs',
          },
          {
            title: 'Review escalafón course options',
            detail: 'Compare UNAD, UNIMINUTO, and UNIR Colombia for the pedagogical entry requirement under Decreto 1278.',
            tag: 'academic',
          },
          {
            title: 'Keep debt pressure moving down',
            detail: 'Continue using cash-flow execution to lower active debt and protect the 2029 runway.',
            tag: 'financial',
          },
        ],
      },
      {
        label: 'By Dec 2028',
        description: 'Everything that must be ready before the UTEL title is in hand.',
        items: [
          {
            title: 'Finish the UTEL degree',
            detail: 'The title is the academic key that unlocks the Colombia teaching route.',
            tag: 'academic',
          },
          {
            title: 'Prepare Mexico document path',
            detail: 'Line up diploma, acta de grado, and transcripts for apostille through SEP/SRE.',
            tag: 'docs',
          },
          {
            title: 'Keep the route documented',
            detail: 'Preserve proof of technical instruction, process training, and operational leadership for later applications.',
            tag: 'career',
          },
        ],
      },
      {
        label: 'By Mar 2029',
        description: 'Actions that put the Colombia clock in motion as soon as the title is available.',
        items: [
          {
            title: 'Radicar convalidación ante el MEN',
            detail: 'Submit the full digital process as early as possible to start the 120–180 day administrative clock.',
            tag: 'docs',
          },
          {
            title: 'Close or complete escalafón requirement',
            detail: 'The pedagogical requirement cannot stay fuzzy by the time the title route is active.',
            tag: 'academic',
          },
          {
            title: 'Protect the relocation cash runway',
            detail: 'Savings and debt decisions still need to defend the 2029 move and landing capital.',
            tag: 'financial',
          },
        ],
      },
      {
        label: 'By Sep 2029',
        description: 'The operational steps that enable a provisional entry into the Meta teaching system.',
        items: [
          {
            title: 'Receive MEN convalidación resolution',
            detail: 'No provisional route is serious without the title already recognized in Colombia.',
            tag: 'docs',
          },
          {
            title: 'Register in Sistema Maestro when open',
            detail: 'Be ready to apply for Tecnología e Informática vacancies in Meta as soon as the window appears.',
            tag: 'career',
          },
          {
            title: 'Prepare the Cumaral move scenario',
            detail: 'Keep housing, runway cash, and mobility assumptions aligned with a Meta landing.',
            tag: 'financial',
          },
        ],
      },
      {
        label: 'By 2030+',
        description: 'Longer-range actions that convert provisional entry into stable teaching career movement.',
        items: [
          {
            title: 'Enter the CNSC / SIMO concurso path',
            detail: 'Use the provisional route and accumulated evidence to compete for a formal position in the Meta system.',
            tag: 'career',
          },
          {
            title: 'Consolidate the salary ladder plan',
            detail: 'Specialization, maestría, and career progression become relevant only after the route is structurally active.',
            tag: 'academic',
          },
        ],
      },
    ],
  };
}
