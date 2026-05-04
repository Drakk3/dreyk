'use client';

import { Button } from '@/components/ui/Button';
import { useAuthSignOut } from '@/shared/hooks/useAuthSignOut';

interface SessionSignOutButtonProps {
  className?: string;
}

export function SessionSignOutButton({ className }: SessionSignOutButtonProps): JSX.Element {
  const { errorMessage, handleSignOut, isSigningOut } = useAuthSignOut();

  const handleButtonClick = (): void => {
    void handleSignOut();
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <Button className={className} disabled={isSigningOut} onClick={handleButtonClick} type="button" variant="outline">
        {isSigningOut ? 'Signing out…' : 'Log out'}
      </Button>
      {errorMessage !== null ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
