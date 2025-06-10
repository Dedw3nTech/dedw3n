/**
 * Auto-login helper utilities - DISABLED for security compliance
 */

// Auto-login disabled for security - no longer functional
export function enableAutoLogin(): void {
  console.warn('[SECURITY] Auto-login functionality has been permanently disabled for security compliance');
}

// Auto-login disabled for security - no longer functional
export function disableAutoLogin(): void {
  console.warn('[SECURITY] Auto-login functionality has been permanently disabled for security compliance');
}

// Auto-login disabled for security - always returns false
export function isAutoLoginEnabled(): boolean {
  console.warn('[SECURITY] Auto-login functionality has been permanently disabled for security compliance');
  return false;
}

// Auto-login controls disabled for security
if (typeof window !== 'undefined') {
  (window as any).autoLogin = {
    enable: () => console.warn('[SECURITY] Auto-login permanently disabled'),
    disable: () => console.warn('[SECURITY] Auto-login permanently disabled'),
    isEnabled: () => false,
    status: () => 'DISABLED_FOR_SECURITY'
  };
  
  console.log('[SECURITY] Auto-login controls disabled for security compliance');
}