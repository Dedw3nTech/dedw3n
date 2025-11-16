// Translation Preload System
// Pre-caches common UI strings for instant zero-delay translation

export const COMMON_UI_STRINGS = {
  // Navigation & Headers
  navigation: [
    'Home',
    'Marketplace',
    'Community',
    'Dating',
    'Profile',
    'Settings',
    'Notifications',
    'Messages',
    'Cart',
    'Search',
    'Menu',
    'Back',
    'Close',
    'Next',
    'Previous',
    'Submit',
    'Cancel',
    'Confirm',
    'Delete',
    'Edit',
    'Save',
    'Upload',
    'Download',
    'Share',
    'Like',
    'Comment',
    'Follow',
    'Unfollow'
  ],

  // Auth & Account
  auth: [
    'Sign In',
    'Sign Up',
    'Sign Out',
    'Login',
    'Register',
    'Forgot Password',
    'Reset Password',
    'Email',
    'Password',
    'Username',
    'Remember Me',
    'Create Account',
    'Already have an account?',
    'Don\'t have an account?',
    'Verify Email',
    'Two-Factor Authentication',
    'Security',
    'Privacy'
  ],

  // Common Actions & Buttons
  actions: [
    'Add to Cart',
    'Buy Now',
    'Checkout',
    'View Details',
    'Read More',
    'Show More',
    'Show Less',
    'Load More',
    'Filter',
    'Sort',
    'Apply',
    'Clear',
    'Reset',
    'Refresh',
    'Update',
    'Continue',
    'Skip',
    'Finish',
    'Get Started',
    'Learn More',
    'Contact Us',
    'Help',
    'Support'
  ],

  // Forms & Validation
  forms: [
    'Required field',
    'Invalid email',
    'Password too short',
    'Passwords do not match',
    'Please enter a valid',
    'This field is required',
    'Invalid format',
    'Must be at least',
    'Must be no more than',
    'characters',
    'Name',
    'First Name',
    'Last Name',
    'Phone',
    'Address',
    'City',
    'Country',
    'Postal Code',
    'Date of Birth',
    'Gender'
  ],

  // Messages & Toasts
  messages: [
    'Success!',
    'Error',
    'Warning',
    'Info',
    'Loading...',
    'Thinking',
    'Please wait',
    'Processing',
    'Saved successfully',
    'Updated successfully',
    'Deleted successfully',
    'Added successfully',
    'Failed to save',
    'Failed to update',
    'Failed to delete',
    'Failed to load',
    'Something went wrong',
    'Try again',
    'Are you sure?',
    'This action cannot be undone',
    'No results found',
    'No data available'
  ],

  // Commerce & Shopping
  commerce: [
    'Price',
    'Total',
    'Subtotal',
    'Shipping',
    'Tax',
    'Discount',
    'Coupon',
    'Free Shipping',
    'In Stock',
    'Out of Stock',
    'Limited Stock',
    'New',
    'Sale',
    'Featured',
    'Popular',
    'Trending',
    'Best Seller',
    'Product',
    'Category',
    'Brand',
    'Size',
    'Color',
    'Quantity',
    'Add to Wishlist',
    'Reviews',
    'Rating'
  ],

  // Time & Date
  time: [
    'Today',
    'Yesterday',
    'Tomorrow',
    'Now',
    'Just now',
    'ago',
    'minute',
    'minutes',
    'hour',
    'hours',
    'day',
    'days',
    'week',
    'weeks',
    'month',
    'months',
    'year',
    'years',
    'second',
    'seconds'
  ],

  // Status & States
  status: [
    'Active',
    'Inactive',
    'Pending',
    'Approved',
    'Rejected',
    'Completed',
    'In Progress',
    'Draft',
    'Publish Now',
    'Archived',
    'Enabled',
    'Disabled',
    'Online',
    'Offline',
    'Available',
    'Unavailable'
  ]
};

// Flatten all strings into a single array for preloading
export const ALL_COMMON_UI_STRINGS = Object.values(COMMON_UI_STRINGS).flat();

// Get priority strings (most frequently used UI elements)
export const PRIORITY_UI_STRINGS = [
  ...COMMON_UI_STRINGS.navigation,
  ...COMMON_UI_STRINGS.actions.slice(0, 10),
  ...COMMON_UI_STRINGS.messages.slice(0, 10)
];

// Supported languages for preloading
export const PRELOAD_LANGUAGES = ['ES', 'FR', 'AR', 'ZH', 'PT', 'HI'];

/**
 * Preload common UI strings for a specific language
 * Call this on app initialization or language change
 */
export async function preloadLanguageStrings(
  language: string,
  masterTranslationManager: any,
  priority: 'instant' | 'high' = 'instant'
): Promise<void> {
  if (!language || language === 'EN') {
    console.log('[Translation Preload] Skipping English - no translation needed');
    return;
  }

  console.log(`[Translation Preload] Starting preload for ${language} (${ALL_COMMON_UI_STRINGS.length} strings)`);
  const startTime = performance.now();

  try {
    // Preload priority strings first for instant UI response
    await masterTranslationManager.preloadCommonTranslations(
      PRIORITY_UI_STRINGS,
      language
    );

    // Then preload remaining strings in background
    const remainingStrings = ALL_COMMON_UI_STRINGS.filter(
      str => !PRIORITY_UI_STRINGS.includes(str)
    );

    // Use lower priority for non-critical strings
    await masterTranslationManager.preloadCommonTranslations(
      remainingStrings,
      language
    );

    const duration = performance.now() - startTime;
    console.log(`[Translation Preload] Completed ${language} in ${duration.toFixed(2)}ms`);

    // Performance mark for monitoring
    performance.mark(`translation-preload-${language}-complete`);
  } catch (error) {
    console.error(`[Translation Preload] Failed for ${language}:`, error);
  }
}

/**
 * Preload all supported languages in the background (OPTIONAL - USE WITH CAUTION)
 * ⚠️ WARNING: This will make API calls for 6 languages × 200 strings = ~1200 translations
 * Only use this if you have a Pro DeepL account and need all languages immediately
 * 
 * For most applications, it's better to preload languages on-demand when users switch
 * 
 * @param masterTranslationManager - The translation manager instance
 * @param excludeLanguages - Languages to skip (e.g., already loaded languages)
 */
export async function preloadAllLanguages(
  masterTranslationManager: any,
  excludeLanguages: string[] = []
): Promise<void> {
  const languagesToPreload = PRELOAD_LANGUAGES.filter(
    lang => !excludeLanguages.includes(lang)
  );

  console.warn(
    `[Translation Preload] ⚠️ Preloading ${languagesToPreload.length} languages will make ~${languagesToPreload.length * ALL_COMMON_UI_STRINGS.length} translation API calls`
  );

  // Use requestIdleCallback for background preloading
  if ('requestIdleCallback' in window) {
    for (const lang of languagesToPreload) {
      requestIdleCallback(() => {
        preloadLanguageStrings(lang, masterTranslationManager, 'high');
      }, { timeout: 10000 }); // 10 second timeout
    }
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      Promise.all(
        languagesToPreload.map(lang =>
          preloadLanguageStrings(lang, masterTranslationManager, 'high')
        )
      );
    }, 2000); // 2 second delay
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getPreloadStats(masterTranslationManager: any): {
  totalStrings: number;
  priorityStrings: number;
  cacheStats: any;
} {
  return {
    totalStrings: ALL_COMMON_UI_STRINGS.length,
    priorityStrings: PRIORITY_UI_STRINGS.length,
    cacheStats: masterTranslationManager.getCacheStats()
  };
}
