import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/LoginPromptModal";

export function GlobalLoginHandler() {
  const { user } = useAuth();
  const { isOpen, action, showLoginPrompt, closePrompt } = useLoginPrompt();

  // Close login modal when user becomes authenticated
  useEffect(() => {
    if (user && isOpen) {
      closePrompt();
    }
  }, [user, isOpen, closePrompt]);

  useEffect(() => {
    // Only add global click handler if user is not authenticated
    if (!user) {
      const handleGlobalClick = (event: MouseEvent) => {
        // Prevent showing login popup if user clicked on existing modal/dialog elements
        const target = event.target as HTMLElement;
        
        // Skip if clicking on login modal itself or its children
        if (target.closest('[role="dialog"]') || target.closest('.login-modal')) {
          return;
        }
        
        // Skip if clicking on certain UI elements that shouldn't trigger login
        if (
          target.closest('a[href^="/"]') || // Internal links
          target.closest('button[data-no-login]') || // Buttons marked to skip login
          target.closest('.no-login-trigger') || // Elements marked to skip login
          target.closest('input') || // Form inputs
          target.closest('textarea') || // Text areas
          target.closest('[role="button"][aria-label*="close"]') // Close buttons
        ) {
          return;
        }

        // Show login prompt for any other click
        showLoginPrompt('interact');
      };

      // Add event listener to document
      document.addEventListener('click', handleGlobalClick, true);

      // Cleanup function
      return () => {
        document.removeEventListener('click', handleGlobalClick, true);
      };
    }
  }, [user, showLoginPrompt]);

  // Render the login modal
  return (
    <LoginPromptModal 
      isOpen={isOpen} 
      onClose={closePrompt} 
      action={action} 
    />
  );
}