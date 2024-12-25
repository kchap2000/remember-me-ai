import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useUnsavedChanges(hasChanges: boolean) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleNavigate = (e: PopStateEvent) => {
      if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleNavigate);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleNavigate);
    };
  }, [hasChanges, navigate]);
}