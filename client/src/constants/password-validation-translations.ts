// Password Validation Translation Keys
// Centralized location for all password-related translation keys
// This ensures consistency and maintainability across components

export const PASSWORD_TRANSLATIONS = {
  // Main Labels
  PASSWORD_STRENGTH_LABEL: "Password Strength:",
  ESTIMATED_CRACK_TIME_LABEL: "Estimated crack time:",
  SUGGESTIONS_LABEL: "Suggestions:",
  
  // Strength Levels
  VERY_WEAK: "Very Weak",
  WEAK: "Weak", 
  FAIR: "Fair",
  GOOD: "Good",
  STRONG: "Strong",
  VERY_STRONG: "Very Strong",
  
  // Feedback Messages - Negative
  PASSWORD_TOO_SHORT: "Password is too short",
  NEEDS_CHARACTER_VARIETY: "Password needs more character variety",
  CONTAINS_COMMON_PATTERNS: "Contains common patterns",
  CONTAINS_COMMON_WORDS: "Contains common words",
  CONTAINS_REPEATED_CHARS: "Contains repeated characters",
  CONTAINS_SEQUENTIAL_CHARS: "Contains sequential characters",
  MAY_CONTAIN_PERSONAL_INFO: "May contain personal information",
  
  // Feedback Messages - Positive
  GREAT_PASSWORD_LENGTH: "Great password length",
  GOOD_CHARACTER_VARIETY: "Good character variety",
  EXCELLENT_CHARACTER_VARIETY: "Excellent character variety",
  PASSWORD_LOOKS_SECURE: "Password looks secure!",
  PASSWORD_COULD_BE_STRONGER: "Password could be stronger",
  
  // Suggestions
  USE_AT_LEAST_8_CHARS: "Use at least 8 characters",
  USE_12_PLUS_CHARS: "Consider using 12+ characters for better security",
  ADD_UPPERCASE: "Add uppercase letters (A-Z)",
  ADD_LOWERCASE: "Add lowercase letters (a-z)",
  ADD_NUMBERS: "Add numbers (0-9)",
  ADD_SYMBOLS: "Add symbols (!@#$%^&*)",
  AVOID_COMMON_WORDS_SEQUENCES: "Avoid common words and sequences",
  AVOID_DICTIONARY_WORDS: "Avoid dictionary words",
  AVOID_REPEATING_CHARS: "Avoid repeating characters",
  AVOID_SEQUENCES: "Avoid sequences like 'abc' or '123'",
  DONT_USE_PERSONAL_INFO: "Don't use personal information",
  USE_PASSPHRASE: "Consider using a passphrase with 4-5 random words",
  USE_PASSWORD_MANAGER: "Use a password manager to generate strong passwords",
  
  // Time Estimates
  TIME_INSTANTLY: "Instantly",
  TIME_MINUTES: "Minutes",
  TIME_HOURS_TO_DAYS: "Hours to Days",
  TIME_MONTHS: "Months",
  TIME_YEARS: "Years",
  TIME_CENTURIES: "Centuries",
  TIME_UNKNOWN: "Unknown",
  
  // Validation Messages
  USERNAME_AVAILABLE: "Username is available",
  NAME_IS_VALID: "Name is valid",
  
  // Additional UI Messages
  PLEASE_ENTER_VALID_NAME: "Please enter a valid name",
  USERNAME_MUST_BE_AT_LEAST: "Username must be at least 3 characters long"
};

// Helper function to get translation key from message
export function getTranslationKey(message: string): string | undefined {
  // Find matching key for the message
  for (const [key, value] of Object.entries(PASSWORD_TRANSLATIONS)) {
    if (value === message) {
      return key;
    }
  }
  return undefined;
}