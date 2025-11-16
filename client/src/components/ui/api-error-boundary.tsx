import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { ErrorDisplay } from '@/components/ui/error-display';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  queryKey?: unknown[];
  className?: string;
  showHomeButton?: boolean;
  fallback?: ReactNode;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const isNetworkError = (error: Error): boolean => {
  return error.message.includes('offline') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('Network request failed');
};

const HomeNavigationButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button 
      variant="outline" 
      onClick={onClick}
      className="flex items-center gap-2"
      data-testid="button-navigate-home"
    >
      <Home className="h-4 w-4" />
      Go to Home
    </Button>
  );
};

export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ApiErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  private resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  private handleRetry = (): void => {
    if (this.props.queryKey) {
      queryClient.invalidateQueries({ queryKey: this.props.queryKey });
    }
    this.resetError();
  };

  private handleNavigateHome = (): void => {
    this.resetError();
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { className, showHomeButton = true, fallback, children } = this.props;
    
    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <div className={`p-6 max-w-2xl mx-auto ${className}`}>
        <ErrorDisplay
          error={error || 'API request failed'}
          title="Error"
          showRefresh={true}
          onRefresh={this.handleRetry}
        />
        {showHomeButton && (
          <div className="flex justify-center mt-4">
            <HomeNavigationButton onClick={this.handleNavigateHome} />
          </div>
        )}
      </div>
    );
  }
}
