import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "wouter";

interface ApiErrorProps {
  error: Error;
  resetError: () => void;
  queryKey?: unknown[];
  className?: string;
  showHomeButton?: boolean;
}

function ApiErrorDisplay({
  error,
  resetError,
  queryKey,
  className = "",
  showHomeButton = true,
}: ApiErrorProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Function to determine if the error is a network error
  const isNetworkError = () => {
    return (
      error.message.includes("Network Error") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("net::ERR")
    );
  };

  // Function to determine if the error is a 401/403 authentication error
  const isAuthError = () => {
    return (
      error.message.includes("401") ||
      error.message.includes("403") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("Forbidden")
    );
  };

  // Function to determine if the error is a 404 not found error
  const isNotFoundError = () => {
    return error.message.includes("404") || error.message.includes("Not Found");
  };

  const getErrorTitle = () => {
    if (isNetworkError()) return "Network Error";
    if (isAuthError()) return "Authentication Error";
    if (isNotFoundError()) return "Resource Not Found";
    return "Error";
  };

  const getErrorDescription = () => {
    if (isNetworkError()) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    if (isAuthError()) {
      return "You don't have permission to access this resource. Please log in or contact support if you believe this is an error.";
    }
    if (isNotFoundError()) {
      return "The requested resource could not be found. It may have been moved or deleted.";
    }
    return error.message || "An unexpected error occurred. Please try again later.";
  };

  const handleRetry = () => {
    if (queryKey) {
      // Invalidate the specific query to force a refetch
      queryClient.invalidateQueries({ queryKey });
    }
    resetError(); // Reset the error state
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className={`p-6 ${className}`}>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>{getErrorTitle()}</AlertTitle>
        <AlertDescription className="mt-2">
          {getErrorDescription()}
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        {showHomeButton && (
          <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
        )}
      </div>
    </div>
  );
}

interface ApiErrorBoundaryProps {
  children: ReactNode;
  queryKey?: unknown[];
  className?: string;
  showHomeButton?: boolean;
  fallback?: ReactNode;
}

export function ApiErrorBoundary({
  children,
  queryKey,
  className,
  showHomeButton = true,
  fallback,
}: ApiErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  // Set up a global error handler for uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error || new Error("An unknown error occurred"));
    };
    
    // Handle unhandled rejections separately
    const handleRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    // Add the event listeners
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Clean up
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  // Function to reset the error state
  const resetError = () => {
    setError(null);
  };

  // If an error was caught, render the error display
  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <ApiErrorDisplay
        error={error}
        resetError={resetError}
        queryKey={queryKey}
        className={className}
        showHomeButton={showHomeButton}
      />
    );
  }

  // If no error, render the children
  return <>{children}</>;
}