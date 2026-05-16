import { LifePlanDashboard } from '@/features/life-plan/components/LifePlanDashboard';
import { isLifePlanSectionKey, LIFE_PLAN_DEFAULT_SECTION } from '@/features/life-plan/navigation';
import type { LifePlanSectionKey } from '@/features/life-plan/types';
import { requireAuthenticatedAppUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

interface LifePlanPageProps {
  searchParams?: {
    section?: string | string[];
  };
}

function resolveInitialSection(section: string | string[] | undefined): LifePlanSectionKey {
  if (typeof section !== 'string') {
    return LIFE_PLAN_DEFAULT_SECTION;
  }

  if (isLifePlanSectionKey(section)) {
    return section;
  }

  return LIFE_PLAN_DEFAULT_SECTION;
}

export default async function LifePlanPage({ searchParams }: LifePlanPageProps): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAuthenticatedAppUser();
  } catch (error: unknown) {
    handleError(error, 'LifePlanPage');
    throw error;
  }

  return (
    <LifePlanDashboard
      initialSection={resolveInitialSection(searchParams?.section)}
      profile={authUserContext.profile}
      role={authUserContext.role}
    />
  );
}
