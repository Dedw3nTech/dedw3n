/**
 * Unified Logout System
 * Consolidates all logout implementations into a single, reliable system
 */

import { queryClient } from '@/lib/queryClient';

interface LogoutConfig {
  redirectToSuccessPage?: boolean;
  clearRememberedCredentials?: boolean;
  broadcastToTabs?: boolean;
}

class UnifiedLogoutSystem {
  private static instance: UnifiedLogoutSystem | null = null;
  private isInitialized = false;
  private storageEventListener: ((event: StorageEvent) => void) | null = null;

  private constructor() {}

  public static getInstance(): UnifiedLogoutSystem {
    if (!UnifiedLogoutSystem.instance) {
      UnifiedLogoutSystem.instance = new UnifiedLogoutSystem();
    }
    return UnifiedLogoutSystem.instance;
  }

  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    console.log('[UNIFIED-LOGOUT] Initializing unified logout system');

    // Set up cross-tab coordination listener
    this.storageEventListener = (event: StorageEvent) => {
      if (event.key === 'unified_logout_trigger' && event.newValue === 'true') {
        console.log('[UNIFIED-LOGOUT] Cross-tab logout detected');
        // Don't process if already on logout success page
        if (!window.location.pathname.includes('/logout-success')) {
          this.handleCrossTabLogout();
        }
      }
    };

    window.addEventListener('storage', this.storageEventListener);
    this.isInitialized = true;
    console.log('[UNIFIED-LOGOUT] System initialized');
  }

  public async performLogout(config: LogoutConfig = {}): Promise<void> {
    console.log('[UNIFIED-LOGOUT] Starting logout process');

    const {
      redirectToSuccessPage = true,
      clearRememberedCredentials = false,
      broadcastToTabs = true
    } = config;

    try {
      // 1. Clear React Query cache immediately
      queryClient.clear();

      // 2. Clear user data from storage
      this.clearUserData();

      // 3. Clear remembered credentials if requested
      if (clearRememberedCredentials) {
        localStorage.removeItem('dedwen_remembered_credentials');
      }

      // 4. Call server logout endpoint
      await this.callServerLogout();

      // 5. Set unified logout flags
      this.setLogoutFlags();

      // 6. Broadcast to other tabs if needed
      if (broadcastToTabs) {
        this.broadcastLogout();
      }

      // 7. Redirect to success page
      if (redirectToSuccessPage) {
        window.location.href = '/logout-success';
      }

      console.log('[UNIFIED-LOGOUT] Logout completed successfully');

    } catch (error) {
      console.error('[UNIFIED-LOGOUT] Logout error:', error);
      
      // Even on error, clear local state and redirect
      this.clearUserData();
      this.setLogoutFlags();
      
      if (redirectToSuccessPage) {
        window.location.href = '/logout-success';
      }
    }
  }

  private async callServerLogout(): Promise<void> {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Unified-Logout': 'true'
        }
      });

      if (!response.ok) {
        console.warn('[UNIFIED-LOGOUT] Server logout warning:', response.status);
      }
    } catch (error) {
      console.warn('[UNIFIED-LOGOUT] Server logout error (non-blocking):', error);
    }
  }

  private clearUserData(): void {
    // Clear localStorage items
    const localStorageKeys = [
      'userData',
      'dedwen_auth_token',
      'user_session',
      'auth_state',
      'last_login'
    ];

    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key} from localStorage:`, e);
      }
    });

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }
  }

  private setLogoutFlags(): void {
    try {
      // Set unified logout flags
      localStorage.setItem('unified_logout_state', 'true');
      localStorage.setItem('unified_logout_timestamp', Date.now().toString());
      
      // Set short-lived logout cookies for server coordination
      const expires = new Date(Date.now() + 30000).toUTCString(); // 30 seconds
      document.cookie = `unified_logout=true; path=/; expires=${expires}; SameSite=Lax`;
      
    } catch (e) {
      console.error('Error setting logout flags:', e);
    }
  }

  private broadcastLogout(): void {
    try {
      // Trigger cross-tab coordination
      localStorage.setItem('unified_logout_trigger', 'true');
      setTimeout(() => {
        try {
          localStorage.removeItem('unified_logout_trigger');
        } catch (e) {
          console.warn('Failed to cleanup logout trigger:', e);
        }
      }, 1000);
    } catch (e) {
      console.error('Error broadcasting logout:', e);
    }
  }

  private handleCrossTabLogout(): void {
    console.log('[UNIFIED-LOGOUT] Processing cross-tab logout');
    
    // Clear local state without server call (already done by originating tab)
    queryClient.clear();
    this.clearUserData();
    this.setLogoutFlags();
    
    // Redirect to logout success page
    window.location.href = '/logout-success';
  }

  public isLoggedOut(): boolean {
    try {
      const logoutState = localStorage.getItem('unified_logout_state') === 'true';
      const logoutCookie = document.cookie.includes('unified_logout=true');
      return logoutState || logoutCookie;
    } catch (e) {
      return false;
    }
  }

  public clearLogoutState(): void {
    try {
      localStorage.removeItem('unified_logout_state');
      localStorage.removeItem('unified_logout_timestamp');
      document.cookie = 'unified_logout=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {
      console.warn('Error clearing logout state:', e);
    }
  }

  public destroy(): void {
    if (this.storageEventListener) {
      window.removeEventListener('storage', this.storageEventListener);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const unifiedLogoutSystem = UnifiedLogoutSystem.getInstance();

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  unifiedLogoutSystem.initialize();
}

// Export logout function for easy use
export const performUnifiedLogout = (config?: LogoutConfig) => {
  return unifiedLogoutSystem.performLogout(config);
};

export const isUserLoggedOut = () => {
  return unifiedLogoutSystem.isLoggedOut();
};

export const clearLogoutState = () => {
  return unifiedLogoutSystem.clearLogoutState();
};