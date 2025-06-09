import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { useUnifiedRecaptcha } from './UnifiedRecaptchaProvider';

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
      setError('Please solve the math problem');
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
        setError('Incorrect answer. Please try again.');
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
        <div className="text-sm text-muted-foreground">Loading security check...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        Captcha verification
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
            title="Generate new problem"
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
            placeholder="Your answer"
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
            {isValidating ? 'Checking...' : 'Verify'}
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