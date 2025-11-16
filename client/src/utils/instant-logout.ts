/**
 * Instant Logout System
 * Near-instant logout with zero blocking operations
 * All cleanup happens instantly without waiting for server responses
 */

import { queryClient } from '@/lib/queryClient';
import { startLogoutVerification } from './logout-verifier';

interface InstantLogoutConfig {
  redirect?: boolean;
  clearRemembered?: boolean;
  broadcast?: boolean;
}

class InstantLogout {
  private static instance: InstantLogout | null = null;
  
  private constructor() {}
  
  public static getInstance(): InstantLogout {
    if (!InstantLogout.instance) {
      InstantLogout.instance = new InstantLogout();
    }
    return InstantLogout.instance;
  }
  
  /**
   * Performs instant logout with zero blocking operations
   * All operations are fire-and-forget for maximum speed
   */
  public logout(config: InstantLogoutConfig = {}): void {
    const { 
      redirect = true, 
      clearRemembered = false, 
      broadcast = true 
    } = config;
    
    // Step 1: Instant client cleanup (no awaiting, no delays)
    this.instantCleanup(clearRemembered, broadcast);
    
    // Step 2: Fire server logout without waiting (truly non-blocking)
    this.fireServerLogout();
    
    // Step 3: Start logout verification to ensure complete cleanup
    startLogoutVerification(3000);
    
    // Step 4: Instant redirect (if enabled)
    if (redirect) {
      // Use replace to prevent back button issues
      window.location.replace('/logout-success');
    }
  }
  
  /**
   * Instant cleanup of all client-side data
   * Executes all operations synchronously for speed
   */
  private instantCleanup(clearRemembered: boolean, broadcast: boolean): void {
    // Close any active WebSocket connections immediately
    this.closeWebSocketConnections();
    
    // Clear React Query cache instantly
    queryClient.clear();
    
    // Clear all auth-related localStorage items at once
    const keysToRemove = [
      'userData',
      'dedwen_auth_token',
      'user_session',
      'auth_state',
      'last_login',
      'unified_logout_state',
      'unified_logout_timestamp',
      'unified_logout_trigger'
    ];
    
    if (clearRemembered) {
      keysToRemove.push('dedwen_remembered_credentials');
    }
    
    // Batch remove all keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
    
    // Clear session storage
    try {
      sessionStorage.clear();
    } catch {}
    
    // Set logout flag for other tabs (if broadcasting)
    if (broadcast) {
      try {
        localStorage.setItem('instant_logout_broadcast', Date.now().toString());
        // Auto-cleanup broadcast flag after 100ms
        setTimeout(() => {
          try {
            localStorage.removeItem('instant_logout_broadcast');
          } catch {}
        }, 100);
      } catch {}
    }
    
    // Clear cookies client-side (instant, no expiry wait)
    this.clearCookiesInstantly();
  }
  
  /**
   * Close all active WebSocket connections
   */
  private closeWebSocketConnections(): void {
    try {
      // Close any WebSocket connections stored in window object
      if ((window as any).wsConnection) {
        (window as any).wsConnection.close(1000, 'User logout');
        (window as any).wsConnection = null;
      }
      
      // Close any WebSocket connections from messaging hooks
      if ((window as any).messagingWebSocket) {
        (window as any).messagingWebSocket.close(1000, 'User logout');
        (window as any).messagingWebSocket = null;
      }
      
      // Dispatch custom event to notify components to close their WebSockets
      window.dispatchEvent(new CustomEvent('user-logout-websocket-close'));
    } catch (error) {
      console.warn('[INSTANT-LOGOUT] Error closing WebSocket connections:', error);
    }
  }
  
  /**
   * Fire server logout without any waiting
   * Uses beacon API for true fire-and-forget behavior
   */
  private fireServerLogout(): void {
    // Use sendBeacon for truly non-blocking request
    if (navigator.sendBeacon) {
      const data = new Blob(
        [JSON.stringify({ instant: true })],
        { type: 'application/json' }
      );
      navigator.sendBeacon('/api/logout', data);
    } else {
      // Fallback: Fire fetch without waiting for response
      fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-Instant-Logout': 'true'
        },
        body: JSON.stringify({ instant: true }),
        // Keep alive false to not wait for response
        keepalive: false
      }).catch(() => {});
    }
  }
  
  /**
   * Clear cookies instantly without waiting
   */
  private clearCookiesInstantly(): void {
    // Set all auth cookies to empty with past expiry
    const cookiesToClear = [
      'unified_logout',
      'dedwen_logout',
      'user_logged_out',
      'cross_domain_logout',
      'instant_logout_flag'
    ];
    
    const pastDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
    
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=;path=/;expires=${pastDate}`;
      document.cookie = `${name}=;path=/;expires=${pastDate};SameSite=Lax`;
    });
  }
  
  /**
   * Setup cross-tab logout listener
   */
  public setupCrossTabListener(): void {
    window.addEventListener('storage', (e) => {
      if (e.key === 'instant_logout_broadcast' && e.newValue) {
        // Another tab logged out - perform local cleanup only
        this.instantCleanup(false, false);
        window.location.replace('/logout-success');
      }
    });
  }
  
  /**
   * Check if user is logged out (instant check)
   */
  public isLoggedOut(): boolean {
    return !localStorage.getItem('userData') && 
           !localStorage.getItem('dedwen_auth_token');
  }
}

// Create singleton instance
export const instantLogout = InstantLogout.getInstance();

// Setup cross-tab listener on load
if (typeof window !== 'undefined') {
  instantLogout.setupCrossTabListener();
}

// Export convenient function
export const performInstantLogout = (config?: InstantLogoutConfig) => {
  instantLogout.logout(config);
};

export const isInstantlyLoggedOut = () => {
  return instantLogout.isLoggedOut();
};