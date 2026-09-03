import { useEffect } from "react";
import { AlertTriangleIcon, InfoIcon } from "./Icon";

const ConfirmDialog = ({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const danger = variant === "danger";

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-panel max-w-95"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                danger
                  ? "bg-red-50 text-red-600"
                  : "bg-orange-50 text-(--brand)"
              }`}
            >
              {danger ? (
                <AlertTriangleIcon className="w-4.5 h-4.5" />
              ) : (
                <InfoIcon className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="min-w-0">
              <h3
                id="confirm-dialog-title"
                className="text-[14px] font-bold text-(--ink) leading-snug"
              >
                {title}
              </h3>
              <p className="mt-1 text-[12.5px] text-(--ink-muted) leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="drawer-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {busy && (
              <span className="spinner w-3.5 h-3.5 border-2 border-white/40 border-t-white!" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
