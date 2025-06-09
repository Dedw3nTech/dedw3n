import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface CaptchaContextType {
  executeRecaptcha: ((action: string) => Promise<string>) | undefined;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  generateChallenge: () => { question: string; answer: string; token: string };
  validateChallenge: (token: string, userAnswer: string) => boolean;
}

const CaptchaContext = createContext<CaptchaContextType>({
  executeRecaptcha: undefined,
  isReady: true,
  isLoading: false,
  error: null,
  generateChallenge: () => ({ question: '', answer: '', token: '' }),
  validateChallenge: () => false
});

export const useUnifiedRecaptcha = () => {
  const context = useContext(CaptchaContext);
  if (!context) {
    throw new Error('useUnifiedRecaptcha must be used within a CaptchaProvider');
  }
  return context;
};

interface CaptchaProviderProps {
  children: ReactNode;
}

export function UnifiedRecaptchaProvider({ children }: CaptchaProviderProps) {
  const [isReady] = useState(true);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [challenges] = useState(new Map<string, { answer: string; timestamp: number }>());

  // Generate a simple math challenge
  const generateChallenge = useCallback(() => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer, question;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;
      default:
        num1 = 5;
        num2 = 3;
        answer = 8;
        question = '5 + 3 = ?';
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    
    // Store challenge with 5 minute expiry
    challenges.set(token, { answer: answer.toString(), timestamp });
    
    // Clean up expired challenges
    Array.from(challenges.entries()).forEach(([key, value]) => {
      if (timestamp - value.timestamp > 300000) { // 5 minutes
        challenges.delete(key);
      }
    });
    
    return { question, answer: answer.toString(), token };
  }, [challenges]);

  // Validate challenge response
  const validateChallenge = useCallback((token: string, userAnswer: string) => {
    const challenge = challenges.get(token);
    if (!challenge) {
      return false;
    }
    
    const now = Date.now();
    if (now - challenge.timestamp > 300000) { // 5 minutes expired
      challenges.delete(token);
      return false;
    }
    
    const isValid = challenge.answer === userAnswer.trim();
    if (isValid) {
      challenges.delete(token); // Remove after successful validation
    }
    
    return isValid;
  }, [challenges]);

  // Execute CAPTCHA challenge
  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    console.log(`[MATH-CAPTCHA] Executing for action: ${action}`);
    
    return new Promise((resolve) => {
      // For programmatic calls, generate a simple validation token
      const token = `math_captcha_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      resolve(token);
    });
  }, []);

  const contextValue = {
    executeRecaptcha,
    isReady: true,
    isLoading: false,
    error: null,
    generateChallenge,
    validateChallenge
  };

  return (
    <CaptchaContext.Provider value={contextValue}>
      {children}
    </CaptchaContext.Provider>
  );
}

// Legacy compatibility exports
export const useRecaptcha = useUnifiedRecaptcha;
export const RecaptchaProvider = UnifiedRecaptchaProvider;