import { FitnessDashboard } from '@/features/fitness/components/FitnessDashboard';
import { FITNESS_DEFAULT_SECTION, isFitnessSectionKey } from '@/features/fitness/navigation';
import type { FitnessSectionKey } from '@/features/fitness/types';
import { requireAuthenticatedAppUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

interface FitnessPageProps {
  searchParams?: {
    section?: string | string[];
  };
}

function resolveInitialSection(section: string | string[] | undefined): FitnessSectionKey {
  if (typeof section !== 'string') {
    return FITNESS_DEFAULT_SECTION;
  }

  if (isFitnessSectionKey(section)) {
    return section;
  }

  return FITNESS_DEFAULT_SECTION;
}

export default async function FitnessPage({ searchParams }: FitnessPageProps): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAuthenticatedAppUser();
  } catch (error: unknown) {
    handleError(error, 'FitnessPage');
    throw error;
  }

  return (
    <FitnessDashboard
      initialSection={resolveInitialSection(searchParams?.section)}
      profile={authUserContext.profile}
      role={authUserContext.role}
    />
  );
}
