// Translation System Initializer
// Sets up instant translation with preloading for optimal performance

import { preloadLanguageStrings, preloadAllLanguages } from './translation-preload';

let isInitialized = false;
let currentLanguage: string | null = null;

/**
 * Initialize the translation system on app load
 * Call this once in your main App component
 */
export async function initializeTranslationSystem(
  masterTranslationManager: any,
  userLanguage?: string
): Promise<void> {
  if (isInitialized) {
    console.log('[Translation Init] Already initialized');
    return;
  }

  console.log('[Translation Init] Starting initialization...');
  const startTime = performance.now();
  performance.mark('translation-init-start');

  try {
    // Get user's language preference or detect from browser
    const targetLanguage = userLanguage || 
      localStorage.getItem('userLanguage')?.toUpperCase() || 
      navigator.language.split('-')[0].toUpperCase() || 
      'EN';

    currentLanguage = targetLanguage;

    // If not English, preload the user's language immediately for instant UI
    if (targetLanguage !== 'EN') {
      console.log(`[Translation Init] Preloading user language: ${targetLanguage}`);
      await preloadLanguageStrings(targetLanguage, masterTranslationManager, 'instant');
    }

    // NOTE: Background preloading removed to prevent excessive API usage
    // If you need to preload additional languages, do it explicitly:
    // Example: await preloadLanguageStrings('ES', masterTranslationManager, 'high');

    isInitialized = true;
    const duration = performance.now() - startTime;
    performance.mark('translation-init-end');
    performance.measure('translation-init-duration', 'translation-init-start', 'translation-init-end');

    console.log(`[Translation Init] Completed in ${duration.toFixed(2)}ms`);
  } catch (error) {
    console.error('[Translation Init] Failed:', error);
  }
}

/**
 * Switch language and preload new strings
 */
export async function switchLanguage(
  newLanguage: string,
  masterTranslationManager: any
): Promise<void> {
  if (currentLanguage === newLanguage) {
    console.log(`[Translation Switch] Already using ${newLanguage}`);
    return;
  }

  console.log(`[Translation Switch] Switching from ${currentLanguage} to ${newLanguage}`);
  performance.mark(`translation-switch-${newLanguage}-start`);

  currentLanguage = newLanguage;
  localStorage.setItem('userLanguage', newLanguage);

  // Preload new language strings instantly
  if (newLanguage !== 'EN') {
    await preloadLanguageStrings(newLanguage, masterTranslationManager, 'instant');
  }

  performance.mark(`translation-switch-${newLanguage}-end`);
  console.log(`[Translation Switch] Completed switch to ${newLanguage}`);
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string | null {
  return currentLanguage;
}

/**
 * Check if translation system is ready
 */
export function isTranslationSystemReady(): boolean {
  return isInitialized;
}
