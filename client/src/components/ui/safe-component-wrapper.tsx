import React, { Component, ReactNode } from 'react';

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
      return this.props.fallback || (
        <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded border">
          {this.props.componentName || 'Component'} temporarily unavailable
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeComponentWrapper;