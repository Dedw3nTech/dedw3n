/**
 * Logout Verification System
 * Ensures complete logout and prevents authentication state inconsistencies
 */

interface LogoutState {
  isLoggedOut: boolean;
  sessionCleared: boolean;
  cookiesCleared: boolean;
  webSocketClosed: boolean;
  timestamp: number;
}

class LogoutVerifier {
  private static instance: LogoutVerifier | null = null;
  private verificationInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  public static getInstance(): LogoutVerifier {
    if (!LogoutVerifier.instance) {
      LogoutVerifier.instance = new LogoutVerifier();
    }
    return LogoutVerifier.instance;
  }
  
  /**
   * Verify logout is complete and enforce cleanup
   */
  public verifyLogoutComplete(): LogoutState {
    const state: LogoutState = {
      isLoggedOut: true,
      sessionCleared: true,
      cookiesCleared: true,
      webSocketClosed: true,
      timestamp: Date.now()
    };
    
    // Check localStorage for any auth data
    const authKeys = [
      'userData',
      'dedwen_auth_token',
      'user_session',
      'auth_state'
    ];
    
    for (const key of authKeys) {
      if (localStorage.getItem(key)) {
        state.sessionCleared = false;
        state.isLoggedOut = false;
        // Force remove if found
        localStorage.removeItem(key);
        console.warn(`[LOGOUT-VERIFIER] Found and removed lingering auth data: ${key}`);
      }
    }
    
    // Check for auth cookies
    const cookies = document.cookie.split(';');
    const authCookiePatterns = [
      'connect.sid',
      'sessionId',
      'token',
      'auth',
      'jwt'
    ];
    
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (authCookiePatterns.some(pattern => name.includes(pattern))) {
        state.cookiesCleared = false;
        console.warn(`[LOGOUT-VERIFIER] Found lingering auth cookie: ${name}`);
        // Force clear the cookie
        this.forceClearCookie(name);
      }
    }
    
    // Check WebSocket connections
    if ((window as any).wsConnection || (window as any).messagingWebSocket) {
      state.webSocketClosed = false;
      console.warn('[LOGOUT-VERIFIER] Found active WebSocket connections');
      // Force close WebSockets
      this.forceCloseWebSockets();
    }
    
    return state;
  }
  
  /**
   * Start continuous verification after logout
   */
  public startVerification(duration: number = 5000): void {
    this.stopVerification();
    
    let checks = 0;
    const maxChecks = 5;
    
    this.verificationInterval = setInterval(() => {
      checks++;
      const state = this.verifyLogoutComplete();
      
      if (!state.isLoggedOut) {
        console.log('[LOGOUT-VERIFIER] Enforcing logout state cleanup');
        this.enforceCompleteLogout();
      }
      
      if (checks >= maxChecks) {
        this.stopVerification();
      }
    }, duration / maxChecks);
  }
  
  /**
   * Stop verification
   */
  public stopVerification(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
  }
  
  /**
   * Force complete logout cleanup
   */
  private enforceCompleteLogout(): void {
    // Clear all storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('[LOGOUT-VERIFIER] Error clearing storage:', e);
    }
    
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name) {
        this.forceClearCookie(name);
      }
    });
    
    // Close WebSockets
    this.forceCloseWebSockets();
    
    // Clear any cached data
    if ((window as any).queryClient) {
      (window as any).queryClient.clear();
    }
  }
  
  /**
   * Force clear a cookie with all possible configurations
   */
  private forceClearCookie(name: string): void {
    const paths = ['/', '', window.location.pathname];
    const domains = ['', window.location.hostname, `.${window.location.hostname}`];
    
    paths.forEach(path => {
      domains.forEach(domain => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
      });
    });
  }
  
  /**
   * Force close all WebSocket connections
   */
  private forceCloseWebSockets(): void {
    try {
      // Close any known WebSocket connections
      const wsKeys = ['wsConnection', 'messagingWebSocket', 'ws', 'socket'];
      
      wsKeys.forEach(key => {
        if ((window as any)[key]) {
          try {
            (window as any)[key].close();
            (window as any)[key] = null;
          } catch (e) {
            console.warn(`[LOGOUT-VERIFIER] Error closing ${key}:`, e);
          }
        }
      });
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('force-websocket-close'));
    } catch (e) {
      console.error('[LOGOUT-VERIFIER] Error in WebSocket cleanup:', e);
    }
  }
  
  /**
   * Check if user should be logged out based on server response
   */
  public checkAuthResponse(response: Response): boolean {
    if (response.status === 401 || response.status === 403) {
      const isLoginPage = window.location.pathname === '/login' || 
                         window.location.pathname === '/';
      
      if (!isLoginPage) {
        console.log('[LOGOUT-VERIFIER] Unauthorized response detected, enforcing logout');
        this.enforceCompleteLogout();
        return true;
      }
    }
    return false;
  }
}

// Export singleton instance
export const logoutVerifier = LogoutVerifier.getInstance();

// Export convenience functions
export const verifyLogoutComplete = () => logoutVerifier.verifyLogoutComplete();
export const startLogoutVerification = (duration?: number) => logoutVerifier.startVerification(duration);
export const stopLogoutVerification = () => logoutVerifier.stopVerification();
export const checkAuthResponse = (response: Response) => logoutVerifier.checkAuthResponse(response);