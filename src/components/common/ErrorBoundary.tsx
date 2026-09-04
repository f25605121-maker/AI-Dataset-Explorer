"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  expanded: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      expanded: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error(`[ErrorBoundary] Caught error in ${this.props.componentName || "Component"}:`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      expanded: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopyDetails = (): void => {
    const { error, errorInfo } = this.state;
    const text = `Error in ${this.props.componentName || "Component"}:\nMessage: ${
      error?.message || "Unknown error"
    }\nStack: ${error?.stack || ""}\nComponent Stack: ${errorInfo?.componentStack || ""}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      });
    }
  };

  toggleExpanded = (): void => {
    this.setState((prev) => ({ expanded: !prev.expanded }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, copied, expanded } = this.state;
    const { children, componentName, fallback, showDetails = true } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      if (typeof fallback === "function") {
        return fallback(error || new Error("Unknown error"), this.handleReset);
      }
      return fallback as ReactNode;
    }

    const title = componentName ? `${componentName} Encountered an Issue` : "Component Render Failure";

    return (
      <div className="w-full my-4 p-6 rounded-2xl border border-red-500/30 bg-red-950/10 dark:bg-red-950/20 backdrop-blur-md text-primary transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                  Fault Isolation Active
                </span>
              </div>
              <h3 className="text-sm font-semibold text-primary mt-1">{title}</h3>
              <p className="text-xs text-muted mt-0.5">
                The surrounding view remains operational. You can attempt to reload this specific section.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={this.handleReset}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-primary text-primary-inverse text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reload Section
            </button>
            {showDetails && (
              <button
                onClick={this.toggleExpanded}
                className="px-3 py-1.5 rounded-xl border border-subtle bg-card hover:bg-card-hover text-xs text-muted font-medium transition-colors flex items-center gap-1"
              >
                {expanded ? "Hide Details" : "Inspect"}
                <svg
                  className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {showDetails && expanded && (
          <div className="mt-4 pt-4 border-t border-red-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted uppercase">Diagnostic Trace</span>
              <button
                onClick={this.handleCopyDetails}
                className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
              >
                {copied ? "Copied to clipboard!" : "Copy diagnostic trace"}
              </button>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-subtle/50 text-[11px] font-mono text-red-400 overflow-x-auto max-h-48 leading-relaxed">
              <p className="font-semibold text-red-300">{error?.name}: {error?.message}</p>
              {errorInfo?.componentStack && (
                <pre className="mt-2 text-muted text-[10px] whitespace-pre-wrap">{errorInfo.componentStack}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { componentName?: string; showDetails?: boolean } = {}
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary componentName={options.componentName || WrappedComponent.displayName || WrappedComponent.name} showDetails={options.showDetails}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithErrorBoundary;
}

export default ErrorBoundary;
