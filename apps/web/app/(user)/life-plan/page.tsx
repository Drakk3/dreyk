import { LifePlanDashboard } from '@/features/life-plan/components/LifePlanDashboard';
import { isLifePlanSectionKey } from '@/features/life-plan/navigation';
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
    return 'overview';
  }

  if (isLifePlanSectionKey(section)) {
    return section;
  }

  return 'overview';
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
