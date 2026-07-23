import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // 🛠️ Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 🚀 In production, you would stream this telemetry log to Sentry or LogRocket
    console.error("Uncaught application rendering exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-xs">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-xl mx-auto mb-4 font-black">
              ⚠️
            </div>
            <h2 className="text-base font-black text-gray-900 leading-tight mb-1">
              Something went wrong
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              An unexpected layout processing error occurred. We have logged the issue and are looking into it.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full text-xs font-bold bg-gray-950 text-white hover:bg-gray-800 py-2.5 rounded-xl transition shadow-2xs cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}