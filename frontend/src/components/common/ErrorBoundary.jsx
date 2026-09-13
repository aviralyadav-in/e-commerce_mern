import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-(--surface-base) p-6">
          <div className="max-w-md w-full rounded-2xl border border-(--border) bg-(--surface-card) p-6 text-center shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center text-xl font-bold">
              ⚠
            </div>
            <div>
              <h2 className="text-lg font-bold text-(--ink)">Something went wrong</h2>
              <p className="text-xs text-(--ink-muted) mt-1">
                An unexpected interface error occurred. You can retry or refresh the page.
              </p>
            </div>
            {this.state.error?.message && (
              <pre className="text-[11px] font-mono text-rose-500 bg-rose-500/5 p-2.5 rounded-lg text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-secondary text-xs"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary text-xs"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
