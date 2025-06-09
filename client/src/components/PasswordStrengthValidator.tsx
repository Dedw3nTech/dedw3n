import { useState, useEffect } from "react";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthValidatorProps {
  password: string;
  onPasswordChange: (password: string) => void;
  placeholder?: string;
  className?: string;
}

interface ValidationRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
  isValid: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  entropy: number;
}

export function PasswordStrengthValidator({
  password,
  onPasswordChange,
  placeholder = "Enter your password",
  className = ""
}: PasswordStrengthValidatorProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very Weak",
    color: "bg-red-500",
    entropy: 0
  });

  // Calculate password entropy
  const calculateEntropy = (password: string): number => {
    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/\d/.test(password)) charset += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) charset += 32;
    return password.length * Math.log2(charset);
  };

  // Initialize validation rules
  useEffect(() => {
    const validationRules: ValidationRule[] = [
      {
        id: "length",
        label: "8-12 characters long",
        test: (pwd) => pwd.length >= 8 && pwd.length <= 12,
        isValid: false
      },
      {
        id: "lowercase",
        label: "One lowercase letter (a-z)",
        test: (pwd) => /[a-z]/.test(pwd),
        isValid: false
      },
      {
        id: "uppercase",
        label: "One uppercase letter (A-Z)",
        test: (pwd) => /[A-Z]/.test(pwd),
        isValid: false
      },
      {
        id: "number",
        label: "One number (0-9)",
        test: (pwd) => /\d/.test(pwd),
        isValid: false
      },
      {
        id: "special",
        label: "One special character (!@#$%^&*)",
        test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd),
        isValid: false
      },
      {
        id: "no-sequential",
        label: "No sequential characters (123, abc)",
        test: (pwd) => !/123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(pwd),
        isValid: false
      },
      {
        id: "no-repeated",
        label: "No repeated characters (aaa, 111)",
        test: (pwd) => !/(.)\1{2,}/.test(pwd),
        isValid: false
      },
      {
        id: "no-keyboard",
        label: "No keyboard patterns (qwerty, asdf)",
        test: (pwd) => !/qwerty|asdfgh|zxcvbn|qwertz|asdfghjkl|yxcvbn|azerty|qsdfgh|wxcvbn/i.test(pwd),
        isValid: false
      },
      {
        id: "no-common",
        label: "No common weak passwords",
        test: (pwd) => {
          const weakPasswords = [
            'password', '123456', 'qwerty', 'abc123', 'password123', 'admin123',
            '12345678', 'welcome', 'login123', 'secret', 'user123', 'guest123',
            'test123', 'admin', 'root123', 'pass123', 'letmein', 'welcome123'
          ];
          return !weakPasswords.some(weak => pwd.toLowerCase().includes(weak.toLowerCase()));
        },
        isValid: false
      },
      {
        id: "entropy",
        label: "Sufficient complexity (35+ bits entropy)",
        test: (pwd) => calculateEntropy(pwd) >= 35,
        isValid: false
      }
    ];

    setRules(validationRules);
  }, []);

  // Update validation and strength when password changes
  useEffect(() => {
    if (!password) {
      setRules(prev => prev.map(rule => ({ ...rule, isValid: false })));
      setStrength({
        score: 0,
        label: "Very Weak",
        color: "bg-red-500",
        entropy: 0
      });
      return;
    }

    // Update rule validation
    const updatedRules = rules.map(rule => ({
      ...rule,
      isValid: rule.test(password)
    }));
    setRules(updatedRules);

    // Calculate strength score
    const validRules = updatedRules.filter(rule => rule.isValid).length;
    const totalRules = updatedRules.length;
    const scorePercentage = (validRules / totalRules) * 100;
    const entropy = calculateEntropy(password);

    let strengthData: PasswordStrength;

    if (scorePercentage < 30) {
      strengthData = {
        score: scorePercentage,
        label: "Very Weak",
        color: "bg-red-500",
        entropy
      };
    } else if (scorePercentage < 50) {
      strengthData = {
        score: scorePercentage,
        label: "Weak",
        color: "bg-red-400",
        entropy
      };
    } else if (scorePercentage < 70) {
      strengthData = {
        score: scorePercentage,
        label: "Fair",
        color: "bg-yellow-500",
        entropy
      };
    } else if (scorePercentage < 90) {
      strengthData = {
        score: scorePercentage,
        label: "Good",
        color: "bg-blue-500",
        entropy
      };
    } else {
      strengthData = {
        score: scorePercentage,
        label: "Strong",
        color: "bg-green-500",
        entropy
      };
    }

    setStrength(strengthData);
  }, [password, rules]);

  const isPasswordValid = rules.every(rule => rule.isValid);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Password Input */}
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className={`pr-10 ${
            password.length > 0
              ? isPasswordValid
                ? "border-green-500 focus:border-green-500"
                : "border-red-500 focus:border-red-500"
              : ""
          }`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Strength Indicator */}
      {password.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Password Strength:</span>
            <span className={`font-medium ${
              strength.label === "Strong" ? "text-green-600" :
              strength.label === "Good" ? "text-blue-600" :
              strength.label === "Fair" ? "text-yellow-600" :
              "text-red-600"
            }`}>
              {strength.label}
            </span>
          </div>
          <Progress 
            value={strength.score} 
            className="h-2"
          />
          <div className="text-xs text-gray-500">
            Entropy: {strength.entropy.toFixed(1)} bits
          </div>
        </div>
      )}

      {/* Validation Rules */}
      {password.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700">Requirements:</div>
          <div className="grid grid-cols-1 gap-1 text-sm">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center space-x-2 ${
                  rule.isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {rule.isValid ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span className={rule.isValid ? "" : ""}>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tips */}
      {password.length > 0 && !isPasswordValid && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Password Security Tips:</div>
            <ul className="text-xs space-y-1">
              <li>• Use 8-12 characters for optimal security</li>
              <li>• Include all character types (a-z, A-Z, 0-9, symbols)</li>
              <li>• Avoid sequential patterns like "123" or "abc"</li>
              <li>• Don't use common passwords or personal information</li>
              <li>• Mix different character types throughout the password</li>
            </ul>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isPasswordValid && password.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2 text-green-800">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">
              Strong password! Your account will be well protected.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}