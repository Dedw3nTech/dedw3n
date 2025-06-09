/**
 * Cross-Domain Logout Coordination System
 * Handles logout state synchronization across tabs, domains, and browser sessions
 */

import { setLoggedOutFlag } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export class CrossDomainLogoutCoordinator {
  private static instance: CrossDomainLogoutCoordinator | null = null;
  private isInitialized = false;
  private storageEventListener: ((event: StorageEvent) => void) | null = null;
  private messageEventListener: ((event: MessageEvent) => void) | null = null;
  private beforeUnloadListener: ((event: BeforeUnloadEvent) => void) | null = null;
  
  private constructor() {}
  
  public static getInstance(): CrossDomainLogoutCoordinator {
    if (!CrossDomainLogoutCoordinator.instance) {
      CrossDomainLogoutCoordinator.instance = new CrossDomainLogoutCoordinator();
    }
    return CrossDomainLogoutCoordinator.instance;
  }
  
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    console.log('[CROSS-DOMAIN] Initializing logout coordination system');
    
    // Set up storage event listener for cross-tab coordination
    this.storageEventListener = (event: StorageEvent) => {
      if (event.key === 'dedwen_logged_out' && event.newValue === 'true') {
        console.log('[CROSS-DOMAIN] Logout detected from another tab/domain');
        // Don't process if already on logout success page
        if (!window.location.pathname.includes('/logout-success')) {
          this.handleLogoutEvent('storage');
        }
      }
    };
    
    // Set up message event listener for cross-origin communication
    this.messageEventListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'cross_domain_logout') {
        console.log('[CROSS-DOMAIN] Logout message received from:', event.origin);
        this.handleLogoutEvent('message');
      }
    };
    
    // Set up beforeunload listener to cleanup logout flags
    this.beforeUnloadListener = () => {
      this.cleanupLogoutFlags();
    };
    
    // Add event listeners
    window.addEventListener('storage', this.storageEventListener);
    window.addEventListener('message', this.messageEventListener);
    window.addEventListener('beforeunload', this.beforeUnloadListener);
    
    // Check for existing logout state on initialization
    this.checkExistingLogoutState();
    
    // Set up periodic cleanup of expired logout flags
    setInterval(() => {
      this.cleanupExpiredLogoutFlags();
    }, 30000); // Every 30 seconds
    
    this.isInitialized = true;
    console.log('[CROSS-DOMAIN] Logout coordination system initialized');
  }
  
  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }
    
    console.log('[CROSS-DOMAIN] Destroying logout coordination system');
    
    if (this.storageEventListener) {
      window.removeEventListener('storage', this.storageEventListener);
    }
    
    if (this.messageEventListener) {
      window.removeEventListener('message', this.messageEventListener);
    }
    
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
    }
    
    this.isInitialized = false;
  }
  
  private checkExistingLogoutState(): void {
    try {
      // Check localStorage
      const localLogout = localStorage.getItem('dedwen_logged_out');
      
      // Check sessionStorage
      const sessionLogout = sessionStorage.getItem('dedwen_logged_out');
      
      // Check cookies
      const cookieLogout = document.cookie.includes('dedwen_logout=true') || 
                           document.cookie.includes('user_logged_out=true') ||
                           document.cookie.includes('cross_domain_logout=true');
      
      if (localLogout === 'true' || sessionLogout === 'true' || cookieLogout) {
        console.log('[CROSS-DOMAIN] Existing logout state detected');
        this.handleLogoutEvent('initialization');
      }
    } catch (error) {
      console.error('[CROSS-DOMAIN] Error checking existing logout state:', error);
    }
  }
  
  private handleLogoutEvent(source: string): void {
    console.log(`[CROSS-DOMAIN] Processing logout event from: ${source}`);
    
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear user data
      localStorage.removeItem('userData');
      sessionStorage.removeItem('userData');
      localStorage.removeItem('enable_auto_login');
      
      // Set logout flag to ensure consistent state
      setLoggedOutFlag(true);
      
      // Broadcast logout to other windows/tabs
      this.broadcastLogout();
      
      // Navigate to logout success page if not already there
      if (!window.location.pathname.includes('/logout-success')) {
        window.location.href = '/logout-success';
      }
      
    } catch (error) {
      console.error('[CROSS-DOMAIN] Error handling logout event:', error);
    }
  }
  
  private broadcastLogout(): void {
    try {
      // Broadcast to other tabs via localStorage event
      localStorage.setItem('logout_broadcast', Date.now().toString());
      localStorage.removeItem('logout_broadcast');
      
      // Post message to parent window if in iframe
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'cross_domain_logout' }, '*');
      }
      
      // Post message to all frames
      for (let i = 0; i < window.frames.length; i++) {
        try {
          window.frames[i].postMessage({ type: 'cross_domain_logout' }, '*');
        } catch (error) {
          // Ignore cross-origin errors
        }
      }
      
    } catch (error) {
      console.error('[CROSS-DOMAIN] Error broadcasting logout:', error);
    }
  }
  
  private cleanupLogoutFlags(): void {
    try {
      // Remove temporary logout flags but keep persistent ones
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.includes('temp_logout') || name.includes('session_logout')) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });
      
    } catch (error) {
      console.error('[CROSS-DOMAIN] Error cleaning up logout flags:', error);
    }
  }
  
  private cleanupExpiredLogoutFlags(): void {
    try {
      // Check for expired logout cookies and remove them
      const cookies = document.cookie.split(';');
      const now = Date.now();
      
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=').map(s => s.trim());
        
        if ((name.includes('dedwen_logout') || name.includes('user_logged_out')) && value === 'true') {
          // Check if logout timestamp exists
          const timestampKey = `${name}_timestamp`;
          const timestampStr = localStorage.getItem(timestampKey);
          
          if (timestampStr) {
            const timestamp = parseInt(timestampStr);
            const elapsed = now - timestamp;
            
            // If more than 15 seconds have passed, clear the flag
            if (elapsed > 15000) {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
              localStorage.removeItem(timestampKey);
              console.log(`[CROSS-DOMAIN] Cleaned up expired logout flag: ${name}`);
            }
          }
        }
      });
      
    } catch (error) {
      console.error('[CROSS-DOMAIN] Error cleaning up expired logout flags:', error);
    }
  }
  
  public triggerLogout(): void {
    console.log('[CROSS-DOMAIN] Manually triggering logout');
    this.handleLogoutEvent('manual');
  }
  
  public isLoggedOut(): boolean {
    try {
      const localLogout = localStorage.getItem('dedwen_logged_out') === 'true';
      const sessionLogout = sessionStorage.getItem('dedwen_logged_out') === 'true';
      const cookieLogout = document.cookie.includes('dedwen_logout=true');
      
      return localLogout || sessionLogout || cookieLogout;
    } catch (error) {
      console.error('[CROSS-DOMAIN] Error checking logout state:', error);
      return false;
    }
  }
}

// Export singleton instance
export const crossDomainLogoutCoordinator = CrossDomainLogoutCoordinator.getInstance();

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  crossDomainLogoutCoordinator.initialize();
}