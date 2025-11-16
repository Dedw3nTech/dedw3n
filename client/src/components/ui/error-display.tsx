import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ReportButton } from '@/components/ui/report-button';
import { processError, sanitizeTechnicalDetails } from '@/lib/error-handler';
import { useMasterTranslation } from '@/hooks/use-master-translation';

interface ErrorDisplayProps {
  error: Error | string | unknown;
  title?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  className?: string;
  variant?: "default" | "destructive";
}

export function ErrorDisplay({
  error,
  title = "Error",
  showRefresh = true,
  onRefresh,
  className = "",
  variant = "destructive"
}: ErrorDisplayProps) {
  const { translateText } = useMasterTranslation();
  const errorReport = processError(error);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="error-display">
      <div className="bg-white text-black p-4 rounded-md text-center" data-testid="alert-error">
        <h3 className="font-semibold mb-2" data-testid="text-error-title">{translateText(title)}</h3>
        <div className="space-y-3" data-testid="text-error-description">
          <p className="text-sm">{translateText(errorReport.userMessage)}</p>
          <p className="text-xs text-gray-600">
            {translateText("Please try again or report this issue to our team.")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center" data-testid="error-actions">
        {showRefresh && (
          <Button
            onClick={handleRefresh}
            className="bg-black hover:bg-gray-800 text-white"
            size="default"
            data-testid="button-refresh"
          >
            {translateText("Refresh Page")}
          </Button>
        )}
        
        <ReportButton
          errorType={`${errorReport.category} Error - ${errorReport.code}`}
          errorMessage={sanitizeTechnicalDetails(errorReport.technicalDetails)}
          className="bg-black hover:bg-gray-800 text-white"
          size="default"
        />
      </div>
    </div>
  );
}

interface InlineErrorDisplayProps {
  error: Error | string | unknown;
  className?: string;
}

export function InlineErrorDisplay({ error, className = "" }: InlineErrorDisplayProps) {
  const { translateText } = useMasterTranslation();
  const errorReport = processError(error);
  
  return (
    <div 
      className={`bg-white text-black rounded-md p-3 ${className}`}
      data-testid="inline-error-display"
    >
      <p className="text-sm" data-testid="text-inline-error-message">
        {translateText(errorReport.userMessage)}
      </p>
    </div>
  );
}

interface CompactErrorDisplayProps {
  error: Error | string | unknown;
  onDismiss?: () => void;
  className?: string;
}

export function CompactErrorDisplay({ 
  error, 
  onDismiss,
  className = "" 
}: CompactErrorDisplayProps) {
  const { translateText } = useMasterTranslation();
  const errorReport = processError(error);
  
  return (
    <div 
      className={`flex items-center gap-3 bg-white text-black rounded-md p-3 ${className}`}
      data-testid="compact-error-display"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" data-testid="text-compact-error-message">
          {translateText(errorReport.userMessage)}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ReportButton
          errorType={`${errorReport.category} Error - ${errorReport.code}`}
          errorMessage={sanitizeTechnicalDetails(errorReport.technicalDetails)}
          className="bg-black hover:bg-gray-800 text-white"
          size="sm"
        />
        {onDismiss && (
          <Button
            className="bg-black hover:bg-gray-800 text-white h-8 px-2"
            size="sm"
            onClick={onDismiss}
            data-testid="button-dismiss"
          >
            {translateText("Dismiss")}
          </Button>
        )}
      </div>
    </div>
  );
}
