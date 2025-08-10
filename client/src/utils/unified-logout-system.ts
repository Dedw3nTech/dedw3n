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
    console.log('[UNIFIED-LOGOUT] Starting fast logout process');

    const {
      redirectToSuccessPage = true,
      clearRememberedCredentials = false,
      broadcastToTabs = true
    } = config;

    // Immediate client-side cleanup (steps 2-6) - no awaiting
    queryClient.clear();
    this.clearUserData();
    
    if (clearRememberedCredentials) {
      localStorage.removeItem('dedwen_remembered_credentials');
    }
    
    this.setLogoutFlags();
    
    if (broadcastToTabs) {
      this.broadcastLogout();
    }

    // Start server logout in background (non-blocking)
    this.callServerLogout().catch(() => {
      // Silent fail - client cleanup already done
    });

    // Immediate redirect (step 7)
    if (redirectToSuccessPage) {
      window.location.href = '/logout-success';
    }

    console.log('[UNIFIED-LOGOUT] Fast logout completed');
  }

  private async callServerLogout(): Promise<void> {
    try {
      // Ultra-fast 1-second timeout for background cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Unified-Logout': 'true',
          'X-Fast-Logout': 'true',
          'X-Background-Logout': 'true',
          'X-User-Logged-Out': 'true'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('[UNIFIED-LOGOUT] Background server logout completed');
      }
    } catch (error: any) {
      // Silent fail for background operation
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
      // Set unified logout flags with faster expiration
      localStorage.setItem('unified_logout_state', 'true');
      localStorage.setItem('unified_logout_timestamp', Date.now().toString());
      
      // Set short-lived logout cookies for server coordination (reduced to 10 seconds)
      const expires = new Date(Date.now() + 10000).toUTCString(); // 10 seconds
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