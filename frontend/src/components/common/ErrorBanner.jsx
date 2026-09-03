import { AlertIcon, RefreshIcon } from "./Icon";

/** Inline page-level error with an optional retry. */
const ErrorBanner = ({ message, onRetry, className = "mb-4" }) => {
  if (!message) return null;
  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-(--radius) bg-red-50 border border-red-200 ${className}`}
      role="alert"
    >
      <AlertIcon className="w-4 h-4 text-red-600 shrink-0 mt-px" />
      <p className="text-[12.5px] text-red-700 flex-1 min-w-0">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-sm btn-secondary shrink-0 -my-0.5"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
