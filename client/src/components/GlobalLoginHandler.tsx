import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { useLocation } from "wouter";

export function GlobalLoginHandler() {
  const { user } = useAuth();
  const { isOpen, action, showLoginPrompt, closePrompt } = useLoginPrompt();
  const [location] = useLocation();

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
        // Skip if on auth page - users are already on the authentication page
        if (location === '/auth' || location.startsWith('/auth?')) {
          return;
        }
        
        // Skip if on password reset pages - these should work without authentication
        if (location === '/reset-password' || location === '/reset-password-confirm' || location.startsWith('/reset-password-confirm?')) {
          return;
        }
        
        // Skip if on vidz page - allow unauthenticated users to browse demo videos
        if (location === '/vidz') {
          return;
        }
        
        // Prevent showing login popup if user clicked on existing modal/dialog elements
        const target = event.target as HTMLElement;
        
        // Check entire event propagation path for opt-out markers
        const path = event.composedPath();
        for (const element of path) {
          if (element instanceof HTMLElement) {
            if (element.hasAttribute('data-no-login') || element.hasAttribute('data-login-skip')) {
              return;
            }
          }
        }
        
        // Skip if clicking on login modal itself or its children
        if (target.closest('[role="dialog"]') || target.closest('.login-modal')) {
          return;
        }
        
        // Skip if clicking on certain UI elements that shouldn't trigger login
        if (
          target.closest('a[href^="/"]') || // Internal links
          target.closest('.no-login-trigger') || // Elements marked to skip login
          target.closest('input') || // Form inputs
          target.closest('textarea') || // Text areas
          target.closest('[role="button"][aria-label*="close"]') || // Close buttons
          target.closest('footer') || // Footer elements
          target.closest('[data-radix-popper-content-wrapper]') || // Dropdown menus (language, currency)
          target.closest('[role="menuitem"]') || // Dropdown menu items
          target.closest('[role="menu"]') || // Dropdown menus
          target.closest('[data-state="open"]') || // Open dropdowns
          target.closest('[data-radix-select-content]') || // Select dropdowns
          target.closest('[data-radix-select-item]') || // Select dropdown items
          target.closest('[data-radix-dropdown-menu-content]') || // Dropdown menu content
          target.closest('[data-radix-dropdown-menu-item]') || // Dropdown menu items
          target.closest('.language-switcher') || // Language switcher elements
          target.closest('.currency-selector') || // Currency selector elements
          target.closest('[data-language-selector]') || // Language selector marked elements
          target.closest('[data-currency-selector]') // Currency selector marked elements
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
  }, [user, showLoginPrompt, location]);

  // Render the login modal
  return (
    <LoginPromptModal 
      isOpen={isOpen} 
      onClose={closePrompt} 
      action={action} 
    />
  );
}