import { useLocation } from 'wouter';

/**
 * Custom hook to provide navigation functionality similar to React Router's useNavigate
 * but works with wouter which only has useLocation by default
 */
export function useNavigate() {
  const [, setLocation] = useLocation();

  /**
   * Navigate to a specific path
   * @param to The destination path
   * @param options Optional navigation options
   */
  const navigate = (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      // Replace current entry in history stack
      window.history.replaceState(null, '', to);
    }
    setLocation(to);
  };

  /**
   * Navigate back in history
   */
  const goBack = () => {
    window.history.back();
  };

  /**
   * Navigate forward in history
   */
  const goForward = () => {
    window.history.forward();
  };

  /**
   * Refresh the current page
   */
  const refresh = () => {
    const currentPath = window.location.pathname;
    // Add a tiny delay to ensure state is reset before navigating
    setTimeout(() => {
      navigate(currentPath, { replace: true });
    }, 10);
  };

  return {
    navigate,
    goBack,
    goForward,
    refresh
  };
}