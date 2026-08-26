import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissToast } from "../../features/ui/uiSlice";
import {
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
  XIcon,
} from "./Icon";

const ICONS = {
  success: { Cmp: CheckCircleIcon, color: "text-emerald-600" },
  error: { Cmp: XCircleIcon, color: "text-red-600" },
  info: { Cmp: InfoIcon, color: "text-blue-600" },
  warning: { Cmp: AlertTriangleIcon, color: "text-amber-600" },
};

const Toast = ({ toast }) => {
  const dispatch = useDispatch();
  const { Cmp, color } = ICONS[toast.type] || ICONS.info;

  useEffect(() => {
    const t = setTimeout(
      () => dispatch(dismissToast(toast.id)),
      toast.duration || 3500,
    );
    return () => clearTimeout(t);
  }, [dispatch, toast.id, toast.duration]);

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <Cmp className={`w-4 h-4 mt-px shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="toast-title">{toast.title}</p>
        {toast.message && <p className="toast-msg">{toast.message}</p>}
      </div>
      <button
        onClick={() => dispatch(dismissToast(toast.id))}
        className="icon-btn icon-btn-ghost w-5 h-5 shrink-0"
        aria-label="Dismiss notification"
      >
        <XIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

const Toaster = () => {
  const toasts = useSelector((state) => state.ui.toasts);
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
};

export default Toaster;
