import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

export function useLoginPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<string>("continue");
  const { user } = useAuth();

  const showLoginPrompt = useCallback((actionType: string = "continue") => {
    if (!user) {
      setAction(actionType);
      setIsOpen(true);
      return true; // Indicates that login prompt was shown
    }
    return false; // User is authenticated, no prompt needed
  }, [user]);

  const closePrompt = useCallback(() => {
    setIsOpen(false);
  }, []);

  const requireAuth = useCallback((actionType: string, callback: () => void) => {
    if (!user) {
      showLoginPrompt(actionType);
      return;
    }
    callback();
  }, [user, showLoginPrompt]);

  return {
    isOpen,
    action,
    showLoginPrompt,
    closePrompt,
    requireAuth,
    isAuthenticated: !!user
  };
}