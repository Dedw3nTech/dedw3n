import React, { Component, ReactNode } from 'react';
import { ReportButton } from '@/components/ui/report-button';

interface SafeComponentWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface SafeComponentWrapperState {
  hasError: boolean;
  error?: Error;
}

export class SafeComponentWrapper extends Component<SafeComponentWrapperProps, SafeComponentWrapperState> {
  constructor(props: SafeComponentWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeComponentWrapperState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(`[SafeWrapper] Component error in ${this.props.componentName || 'Unknown'}:`, error);
    console.warn('[SafeWrapper] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const componentName = this.props.componentName || 'Component';
      const errorMessage = this.state.error?.message || 'Unknown error';
      
      return this.props.fallback || (
        <div className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 p-4">
          <div className="container mx-auto px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-black">● {componentName} temporarily unavailable</span>
            </div>
            <ReportButton 
              errorType={`${componentName} Component Error`}
              errorMessage={`Component: ${componentName}, Error: ${errorMessage}`}
              variant="outline"
              size="sm"
              className="text-black hover:text-black hover:bg-gray-100 border-black flex-shrink-0"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeComponentWrapper;