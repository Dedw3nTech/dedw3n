import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

export interface ValidationFeedbackProps {
  status: 'validating' | 'valid' | 'invalid' | 'error' | 'idle';
  message: string;
  suggestions?: string[];
  confidence?: number;
  showDetails?: boolean;
  className?: string;
}

export function ValidationFeedback({
  status,
  message,
  suggestions = [],
  confidence = 0,
  showDetails = false,
  className
}: ValidationFeedbackProps) {
  if (status === 'idle' || !message) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'validating':
        return {
          icon: Loader2,
          iconClass: 'text-blue-500 animate-spin',
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-700'
        };
      case 'valid':
        return {
          icon: CheckCircle,
          iconClass: 'text-green-500',
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-700'
        };
      case 'invalid':
        return {
          icon: XCircle,
          iconClass: 'text-red-500',
          bgClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-700'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconClass: 'text-orange-500',
          bgClass: 'bg-orange-50 border-orange-200',
          textClass: 'text-orange-700'
        };
      default:
        return {
          icon: AlertCircle,
          iconClass: 'text-gray-500',
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-700'
        };
    }
  };

  const { icon: Icon, iconClass, bgClass, textClass } = getStatusConfig();

  return (
    <div className={cn(
      "flex items-start gap-2 p-3 rounded-md border text-sm",
      bgClass,
      className
    )}>
      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", iconClass)} />
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", textClass)}>
          {message}
        </p>
        
        {showDetails && confidence > 0 && status !== 'validating' && (
          <p className={cn("text-xs mt-1 opacity-75", textClass)}>
            Confidence: {confidence}%
          </p>
        )}
        
        {suggestions.length > 0 && (
          <div className="mt-2">
            <p className={cn("text-xs font-medium mb-1", textClass)}>
              Did you mean:
            </p>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={cn(
                  "inline-block text-xs px-2 py-1 rounded mr-2 mb-1",
                  "bg-white border hover:bg-gray-50 transition-colors",
                  textClass
                )}
                onClick={() => {
                  // This could trigger a callback to update the field value
                  console.log('Suggestion clicked:', suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline validation indicator for form fields
 */
export interface ValidationIndicatorProps {
  status: 'validating' | 'valid' | 'invalid' | 'error' | 'idle';
  className?: string;
}

export function ValidationIndicator({ status, className }: ValidationIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  const getIcon = () => {
    switch (status) {
      case 'validating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex items-center justify-center w-6 h-6", className)}>
      {getIcon()}
    </div>
  );
}

/**
 * Enhanced input wrapper with validation
 */
export interface ValidatedInputWrapperProps {
  children: React.ReactNode;
  validationStatus: 'validating' | 'valid' | 'invalid' | 'error' | 'idle';
  validationMessage: string;
  suggestions?: string[];
  confidence?: number;
  showInlineFeedback?: boolean;
  className?: string;
}

export function ValidatedInputWrapper({
  children,
  validationStatus,
  validationMessage,
  suggestions = [],
  confidence = 0,
  showInlineFeedback = true,
  className
}: ValidatedInputWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        {children}
        {validationStatus !== 'idle' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ValidationIndicator status={validationStatus} />
          </div>
        )}
      </div>
      
      {showInlineFeedback && (
        <ValidationFeedback
          status={validationStatus}
          message={validationMessage}
          suggestions={suggestions}
          confidence={confidence}
        />
      )}
    </div>
  );
}

/**
 * Multi-field validation summary
 */
export interface ValidationSummaryProps {
  results: {
    email?: { isValid: boolean; message: string; confidence: number };
    phone?: { isValid: boolean; message: string; confidence: number };
    name?: { isValid: boolean; message: string; confidence: number };
  };
  overallScore?: number;
  className?: string;
}

export function ValidationSummary({
  results,
  overallScore = 0,
  className
}: ValidationSummaryProps) {
  const validFields = Object.values(results).filter(result => result?.isValid).length;
  const totalFields = Object.values(results).filter(result => result !== undefined).length;
  
  if (totalFields === 0) {
    return null;
  }

  const getOverallStatus = () => {
    if (validFields === totalFields) return 'valid';
    if (validFields === 0) return 'invalid';
    return 'error'; // Mixed results
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      overallStatus === 'valid' ? "bg-green-50 border-green-200" : 
      overallStatus === 'invalid' ? "bg-red-50 border-red-200" : 
      "bg-yellow-50 border-yellow-200",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <ValidationIndicator status={overallStatus} />
        <h3 className="font-medium text-sm">
          Contact Information Validation
        </h3>
        {overallScore > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-white border">
            {overallScore}% confidence
          </span>
        )}
      </div>

      <div className="space-y-2">
        {results.email && (
          <div className="flex items-center gap-2 text-sm">
            <ValidationIndicator status={results.email.isValid ? 'valid' : 'invalid'} />
            <span>Email: {results.email.message}</span>
          </div>
        )}
        
        {results.phone && (
          <div className="flex items-center gap-2 text-sm">
            <ValidationIndicator status={results.phone.isValid ? 'valid' : 'invalid'} />
            <span>Phone: {results.phone.message}</span>
          </div>
        )}
        
        {results.name && (
          <div className="flex items-center gap-2 text-sm">
            <ValidationIndicator status={results.name.isValid ? 'valid' : 'invalid'} />
            <span>Name: {results.name.message}</span>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-600">
        {validFields} of {totalFields} fields validated successfully
      </div>
    </div>
  );
}