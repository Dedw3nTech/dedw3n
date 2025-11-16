import { useState, useEffect } from 'react';
import { useDebounce } from './use-debounce';
import { useTypedTranslation } from './use-master-translation';
import { PASSWORD_TRANSLATIONS } from '@/constants/password-validation-translations';

export interface PasswordStrengthResult {
  score: number; // 0-5 strength score
  feedback: string[];
  suggestions: string[];
  isWeak: boolean;
  isSecure: boolean;
  estimatedCrackTime: string;
  strengthLabel: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  color: string;
}

export function usePasswordStrength(password: string) {
  const [result, setResult] = useState<PasswordStrengthResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debouncedPassword = useDebounce(password, 300);
  const t = useTypedTranslation();

  useEffect(() => {
    if (!password) {
      setResult(null);
      setIsValidating(false);
      return;
    }

    // Always calculate and show result immediately
    setIsValidating(true);
    const strengthResult = analyzePasswordStrength(password, t);
    setResult(strengthResult);
    setIsValidating(false);
  }, [password]); // Only depend on password, not the debounced version for immediate feedback

  return { result, isValidating };
}

function analyzePasswordStrength(password: string, t: any): PasswordStrengthResult {
  const feedback: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  
  // Length analysis - Use the proxy with the actual text strings
  if (password.length < 8) {
    feedback.push(t["Password is too short"]);
    suggestions.push(t["Use at least 8 characters"]);
  } else if (password.length >= 8 && password.length < 12) {
    score += 1;
    suggestions.push(t["Consider using 12+ characters for better security"]);
  } else if (password.length >= 12 && password.length < 16) {
    score += 2;
  } else {
    score += 3;
    feedback.push(t["Great password length"]);
  }

  // Character variety analysis
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  let varietyScore = 0;
  if (hasLowercase) varietyScore++;
  if (hasUppercase) varietyScore++;
  if (hasNumbers) varietyScore++;
  if (hasSymbols) varietyScore++;
  
  if (varietyScore < 3) {
    feedback.push(t["Password needs more character variety"]);
    if (!hasUppercase) suggestions.push(t["Add uppercase letters (A-Z)"]);
    if (!hasLowercase) suggestions.push(t["Add lowercase letters (a-z)"]);
    if (!hasNumbers) suggestions.push(t["Add numbers (0-9)"]);
    if (!hasSymbols) suggestions.push(t["Add symbols (!@#$%^&*)"]);
  } else if (varietyScore === 3) {
    score += 1;
    feedback.push(t["Good character variety"]);
  } else {
    score += 2;
    feedback.push(t["Excellent character variety"]);
  }

  // Common patterns check
  const commonPatterns = [
    /123456789?/i,
    /abcdefg/i,
    /qwerty/i,
    /password/i,
    /admin/i,
    /login/i,
    /welcome/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    feedback.push(t["Contains common patterns"]);
    suggestions.push(t["Avoid common words and sequences"]);
    score = Math.max(0, score - 1);
  }

  // Dictionary words check (basic)
  const commonWords = [
    'password', 'admin', 'user', 'login', 'welcome', 'letmein', 'monkey',
    'dragon', 'sunshine', 'princess', 'football', 'baseball', 'basketball'
  ];
  
  const lowerPassword = password.toLowerCase();
  const containsCommonWord = commonWords.some(word => lowerPassword.includes(word));
  if (containsCommonWord) {
    feedback.push(t["Contains common words"]);
    suggestions.push(t["Avoid dictionary words"]);
    score = Math.max(0, score - 1);
  }

  // Repetition check
  const hasRepetition = /(.)\1{2,}/.test(password); // 3+ same characters in a row
  if (hasRepetition) {
    feedback.push(t["Contains repeated characters"]);
    suggestions.push(t["Avoid repeating characters"]);
    score = Math.max(0, score - 1);
  }

  // Sequential characters
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password);
  if (hasSequential) {
    feedback.push(t["Contains sequential characters"]);
    suggestions.push(t["Avoid sequences like 'abc' or '123'"]);
    score = Math.max(0, score - 1);
  }

  // Personal info patterns (basic check)
  const hasPersonalInfo = /\b(name|user|admin|email|phone|address|birth|date)\b/i.test(password);
  if (hasPersonalInfo) {
    feedback.push(t["May contain personal information"]);
    suggestions.push(t["Don't use personal information"]);
  }

  // Final score adjustment based on entropy
  const entropy = calculateEntropy(password);
  if (entropy > 50) score += 1;

  // Cap score at 5
  score = Math.min(5, Math.max(0, score));

  // Determine strength label and color
  let strengthLabel: PasswordStrengthResult['strengthLabel'] = 'Very Weak';
  let strengthLabelTranslated: string = t["Very Weak"];
  let color: string = 'text-red-600';
  let estimatedCrackTime: string = 'Unknown';

  switch (score) {
    case 0:
      strengthLabel = 'Very Weak';
      strengthLabelTranslated = t["Very Weak"];
      color = 'text-red-600';
      estimatedCrackTime = t["Instantly"];
      break;
    case 1:
      strengthLabel = 'Weak';
      strengthLabelTranslated = t["Weak"];
      color = 'text-red-500';
      estimatedCrackTime = t["Minutes"];
      break;
    case 2:
      strengthLabel = 'Fair';
      strengthLabelTranslated = t["Fair"];
      color = 'text-orange-500';
      estimatedCrackTime = t["Hours to Days"];
      break;
    case 3:
      strengthLabel = 'Good';
      strengthLabelTranslated = t["Good"];
      color = 'text-yellow-600';
      estimatedCrackTime = t["Months"];
      break;
    case 4:
      strengthLabel = 'Strong';
      strengthLabelTranslated = t["Strong"];
      color = 'text-green-600';
      estimatedCrackTime = t["Years"];
      break;
    case 5:
      strengthLabel = 'Very Strong';
      strengthLabelTranslated = t["Very Strong"];
      color = 'text-green-700';
      estimatedCrackTime = t["Centuries"];
      break;
  }

  const isWeak = score <= 2;
  const isSecure = score >= 4;

  // Add final recommendations if password is weak
  if (isWeak) {
    suggestions.push(t["Consider using a passphrase with 4-5 random words"]);
    suggestions.push(t["Use a password manager to generate strong passwords"]);
  }

  return {
    score,
    feedback: feedback.length > 0 ? feedback : isSecure ? 
      [t["Password looks secure!"]] : 
      [t["Password could be stronger"]],
    suggestions,
    isWeak,
    isSecure,
    estimatedCrackTime,
    strengthLabel: strengthLabelTranslated as any, // Use translated version
    color
  };
}

function calculateEntropy(password: string): number {
  const charset = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  let poolSize = 0;
  if (charset.lowercase) poolSize += 26;
  if (charset.uppercase) poolSize += 26;
  if (charset.numbers) poolSize += 10;
  if (charset.symbols) poolSize += 32;

  return password.length * Math.log2(poolSize);
}