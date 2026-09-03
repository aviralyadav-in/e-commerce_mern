import toast from "react-hot-toast";

/**
 * Thin wrappers around react-hot-toast for the admin panel.
 *
 * react-hot-toast is self-contained — calling toast.* anywhere queues the
 * notification, and the <Toaster /> mounted in Layout controls position &
 * styling. These helpers preserve the old title + message pair so pages
 * don't have to compose JSX at every call-site.
 */
export function renderToastBody(title, message = "") {
  return (
    <div className="min-w-0">
      <p className="font-semibold leading-snug">{title}</p>
      {message && (
        <p className="mt-0.5 wrap-break-word text-xs opacity-80">{message}</p>
      )}
    </div>
  );
}

/* Convenience creators (mirroring the old uiSlice helpers) */
export function notifySuccess(title, message = "") {
  return toast.success(renderToastBody(title, message));
}

export function notifyError(title, message = "") {
  return toast.error(renderToastBody(title, message), { duration: 5000 });
}

export function notifyInfo(title, message = "") {
  return toast(renderToastBody(title, message), { icon: "ℹ️" });
}
