// UI Translation Hook - Enforces instant priority for UI elements
// This is a wrapper around useMasterBatchTranslation that guarantees
// instant translation for all UI components

import { useMasterBatchTranslation } from './use-master-translation';

/**
 * Hook for translating UI elements with guaranteed instant priority
 * Use this for navigation, buttons, headers, and other critical UI text
 * 
 * @param texts - Array of UI strings to translate
 * @returns Object with translated strings and loading state
 * 
 * @example
 * ```tsx
 * const { translations } = useUITranslation([
 *   'Home',
 *   'Settings',
 *   'Logout'
 * ]);
 * 
 * return <nav>{translations[0]} | {translations[1]}</nav>
 * ```
 */
export function useUITranslation(texts: string[]): {
  translations: string[];
  isLoading: boolean;
} {
  // Force instant priority - cannot be overridden
  return useMasterBatchTranslation(texts, 'instant');
}

/**
 * Hook for translating content with high priority
 * Use this for important content that should load quickly but isn't critical UI
 * 
 * @param texts - Array of content strings to translate
 * @returns Object with translated strings and loading state
 */
export function useContentTranslation(texts: string[]): {
  translations: string[];
  isLoading: boolean;
} {
  // Force high priority for important content
  return useMasterBatchTranslation(texts, 'high');
}

/**
 * Hook for translating background content with normal priority
 * Use this for non-critical content that can load slightly slower
 * 
 * @param texts - Array of background strings to translate
 * @returns Object with translated strings and loading state
 */
export function useBackgroundTranslation(texts: string[]): {
  translations: string[];
  isLoading: boolean;
} {
  // Normal priority for background content
  return useMasterBatchTranslation(texts, 'normal');
}
