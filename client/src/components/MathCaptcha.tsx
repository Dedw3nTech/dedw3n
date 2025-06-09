import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { useUnifiedRecaptcha } from './UnifiedRecaptchaProvider';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

interface MathCaptchaProps {
  onValidation: (isValid: boolean, token?: string) => void;
  className?: string;
}

export function MathCaptcha({ onValidation, className = "" }: MathCaptchaProps) {
  const { generateChallenge, validateChallenge } = useUnifiedRecaptcha();
  const [challenge, setChallenge] = useState<{ question: string; token: string } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  // Translation strings for MathCaptcha
  const captchaTexts = useMemo(() => [
    "Security Verification",
    "Please solve the math problem to verify you are human",
    "Enter your answer",
    "Verify",
    "New Problem",
    "Please solve the math problem",
    "Incorrect answer. Please try again.",
    "Verifying..."
  ], []);
  const { translations } = useMasterBatchTranslation(captchaTexts);

  // Generate initial challenge
  useEffect(() => {
    refreshChallenge();
  }, []);

  const refreshChallenge = () => {
    const newChallenge = generateChallenge();
    setChallenge({ question: newChallenge.question, token: newChallenge.token });
    setUserAnswer('');
    setError('');
    onValidation(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge || !userAnswer.trim()) {
      setError(translations["Please solve the math problem"] || 'Please solve the math problem');
      return;
    }

    setIsValidating(true);
    setError('');

    setTimeout(() => {
      const isValid = validateChallenge(challenge.token, userAnswer);
      
      if (isValid) {
        onValidation(true, challenge.token);
        setError('');
      } else {
        setError(translations["Incorrect answer. Please try again."] || 'Incorrect answer. Please try again.');
        onValidation(false);
        refreshChallenge();
      }
      
      setIsValidating(false);
    }, 300); // Small delay for UX
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
    setError('');
  };

  if (!challenge) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-sm text-muted-foreground">{translations["Verifying..."] || "Loading security check..."}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {translations["Security Verification"] || "Security Verification"}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-black rounded-lg border border-gray-700">
          <div className="flex-1">
            <Label htmlFor="captcha-answer" className="text-sm font-medium text-white">
              Solve: <span className="font-mono text-lg text-white">{challenge.question}</span>
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={refreshChallenge}
            className="h-8 w-8 p-0 hover:bg-gray-800"
            title={translations["New Problem"] || "Generate new problem"}
          >
            <RefreshCw className="h-4 w-4 text-white" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            id="captcha-answer"
            type="number"
            value={userAnswer}
            onChange={handleInputChange}
            placeholder={translations["Enter your answer"] || "Your answer"}
            className="flex-1"
            disabled={isValidating}
            autoComplete="off"
          />
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || isValidating}
            className="px-6 bg-black hover:bg-gray-800 text-white"
          >
            {isValidating ? (translations["Verifying..."] || 'Checking...') : (translations["Verify"] || 'Verify')}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded border">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}