import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home, Wifi, WifiOff } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useNavigate } from '@/hooks/use-navigate';
import { ReportButton } from '@/components/ui/report-button';

interface Props {
  children: ReactNode;
  queryKey?: unknown[];
  className?: string;
  showHomeButton?: boolean;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
}

/**
 * A specialized error boundary for API errors.
 * Provides functionality to retry API requests and navigate home.
 */
export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOffline: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    if (error.message.includes('offline') || error.message.includes('Failed to fetch')) {
      return {
        hasError: true,
        error,
        isOffline: true
      };
    }
    
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service here
    console.error('Error caught by ApiErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      isOffline: false
    });
  };

  refetchData = (): void => {
    // If a query key is provided, invalidate it to trigger a refetch
    if (this.props.queryKey) {
      queryClient.invalidateQueries({ queryKey: this.props.queryKey });
    }
    
    this.resetError();
  };

  // Custom component with access to hooks that wraps the NavigateToHome functionality
  NavigateToHomeComponent = () => {
    const navigate = useNavigate();
    
    const handleClick = () => {
      this.resetError();
      navigate.navigate('/');
    };
    
    return (
      <Button 
        variant="outline" 
        onClick={handleClick}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Go to Home
      </Button>
    );
  };

  render(): ReactNode {
    const { hasError, error, isOffline } = this.state;
    const { className, showHomeButton = true, fallback } = this.props;
    
    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise, render the default error UI
      return (
        <div className={`p-6 space-y-4 ${className || ''}`}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>
              {isOffline ? 'Network Error' : 'API Error'}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {isOffline 
                ? 'Unable to connect to the server. Please check your internet connection and try again.'
                : error?.message || 'An unexpected API error occurred'}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              onClick={this.refetchData}
              className="flex items-center gap-2"
            >
              {isOffline 
                ? <WifiOff className="h-4 w-4" />
                : <RefreshCcw className="h-4 w-4" />
              }
              {isOffline ? 'Try Again' : 'Retry Request'}
            </Button>
            
            {showHomeButton && <this.NavigateToHomeComponent />}
            
            <ReportButton 
              errorType={isOffline ? "Network Error" : "API Error"}
              errorMessage={error?.message || 'An unexpected API error occurred'}
              variant="outline"
              size="default"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}