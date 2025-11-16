/**
 * Translation Seeds - Centralized String Registry for Eager Preloading
 * 
 * This module exports all user-facing strings that should be preloaded
 * into the translation cache for instant availability without async delays.
 */

// Authentication Error Messages (from error-handler.ts)
export const authenticationErrors = [
  'Your session has expired, or you may need to log in. Please refresh the page. If the technical issue continues, kindly report it.',
  'The username or password you entered is incorrect.',
  'This username is already taken. Please choose a different one.',
  'This email is already registered. Please use a different email or log in.',
  'Authentication failed. Please check your credentials and try again.',
];

// Permission Error Messages
export const permissionErrors = [
  'You don\'t have permission to perform this action.',
];

// Network Error Messages
export const networkErrors = [
  'The request took too long. Please check your internet connection and try again.',
  'Network connection issue. Please check your internet connection.',
];

// Validation Error Messages
export const validationErrors = [
  'Please check the information you entered and try again.',
];

// Server Error Messages
export const serverErrors = [
  'The service is temporarily unavailable. Please try again in a few moments.',
  'Our server encountered an issue. Please try again in a moment.',
];

// Database Error Messages
export const databaseErrors = [
  'A data storage issue occurred. Please try again.',
];

// Component Error Messages
export const componentErrors = [
  'A display error occurred. Please refresh the page.',
];

// Generic Error Messages
export const genericErrors = [
  'Something went wrong.',
];

// Auth Toast Messages (from use-auth.tsx)
export const authToasts = [
  'Login failed',
  'Registration successful',
  'Welcome to Dedw3n! Please verify your email.',
  'Registration failed',
  'Logged out successfully',
  'You have been logged out.',
  'Logout completed',
  'Session cleared. Redirecting to login.',
];

// Password Reset Toast Messages (from reset-password.tsx and reset-password-confirm.tsx)
export const passwordResetMessages = [
  'Error',
  'Failed to send reset email',
  'Please enter your email address',
  'Check your email',
  'We\'ve sent password reset instructions to',
  'Didn\'t receive the email? Check your spam folder or',
  'Password reset successful',
  'Your password has been reset successfully',
  'Please enter a new password',
  'Password is too weak. Please choose a stronger password',
  'Failed to reset password',
  'Password reset complete',
  'Your password has been reset successfully. You can now sign in with your new password.',
];

// 2FA/MFA Toast Messages (from verify-2fa.tsx)
export const twoFactorMessages = [
  'No email provided. Redirecting to login.',
  'Code Sent',
  'A verification code has been sent to your email',
  'A verification code has been sent to your WhatsApp',
  'Failed to send code. Please try again.',
  'Two-Factor Authentication',
  'Choose how to receive your verification code',
  'A 6-digit code has been sent via WhatsApp',
  'A 6-digit code has been sent to your email',
  'Select Verification Method',
];

// Error Display Messages (from error-display.tsx)
export const errorDisplayMessages = [
  'Please try again or report this issue to our team.',
  'Refresh Page',
  'Dismiss',
  'Error',
];

// Combine all error messages
export const allErrorMessages = [
  ...authenticationErrors,
  ...permissionErrors,
  ...networkErrors,
  ...validationErrors,
  ...serverErrors,
  ...databaseErrors,
  ...componentErrors,
  ...genericErrors,
];

// Combine all seeds for global preloading
export const globalTranslationSeeds = [
  ...allErrorMessages,
  ...authToasts,
  ...passwordResetMessages,
  ...twoFactorMessages,
  ...errorDisplayMessages,
];

// Auth page specific strings
export const authPageStrings = [
  // Auth page specific translations
  'Invalid Code',
  'Please enter a 6-digit verification code',
  'Success!',
  'Login successful',
  'Verification Failed',
  'Invalid verification code. Please try again.',
  'Please fill in all required fields',
  'Missing',
  'Please complete all fields before submitting.',
  'Please wait',
  'Validation in progress...',
  'Verification Code Sent',
  'Please check your',
  'email',
  'Username',
  'Password',
  'Full Name',
  'Email',
  'Date of Birth',
  'Language',
  'Signing in...',
  'Creating account...',
  'Sign In',
  'Create Account',
  'By creating an account, you agree to our',
  'Terms of Service',
  'and',
  'Privacy Policy',
];
