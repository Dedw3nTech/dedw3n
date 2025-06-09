/**
 * Auto-login helper utilities for development and testing
 */

// Clear all logout flags and enable auto-login
export function enableAutoLogin(): void {
  try {
    // Clear logout flags
    localStorage.removeItem('dedwen_logged_out');
    sessionStorage.removeItem('dedwen_logged_out');
    
    // Enable auto-login
    localStorage.setItem('enable_auto_login', 'true');
    
    console.log('Auto-login enabled - page will refresh');
    
    // Refresh the page to trigger auto-login
    window.location.reload();
  } catch (error) {
    console.error('Error enabling auto-login:', error);
  }
}

// Disable auto-login
export function disableAutoLogin(): void {
  try {
    localStorage.removeItem('enable_auto_login');
    console.log('Auto-login disabled');
  } catch (error) {
    console.error('Error disabling auto-login:', error);
  }
}

// Check if auto-login is enabled
export function isAutoLoginEnabled(): boolean {
  try {
    return localStorage.getItem('enable_auto_login') === 'true' ||
           window.location.search.includes('auto_login=true') ||
           window.location.search.includes('serruti=true');
  } catch (error) {
    console.error('Error checking auto-login status:', error);
    return false;
  }
}

// Add auto-login controls to window for debugging
if (typeof window !== 'undefined') {
  (window as any).autoLogin = {
    enable: enableAutoLogin,
    disable: disableAutoLogin,
    isEnabled: isAutoLoginEnabled,
    clearLogoutFlags: () => {
      localStorage.removeItem('dedwen_logged_out');
      sessionStorage.removeItem('dedwen_logged_out');
      console.log('Logout flags cleared');
    }
  };
  
  console.log('Auto-login controls available via window.autoLogin');
}