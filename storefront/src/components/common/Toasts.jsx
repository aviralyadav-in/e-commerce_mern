import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissToast } from "../../features/ui/uiSlice";
import { CheckIcon, CloseIcon } from "./Icons";

function Toast({ toast }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 3200);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      {toast.type === "success" && (
        <CheckIcon
          size={16}
          style={{ color: "var(--success)", flexShrink: 0 }}
        />
      )}
      <span className="flex-1">{toast.message}</span>
      <button
        aria-label="Dismiss"
        className="opacity-60 hover:opacity-100"
        onClick={() => dispatch(dismissToast(toast.id))}
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}

export default function Toasts() {
  const toasts = useSelector((state) => state.ui.toasts);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-90 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
