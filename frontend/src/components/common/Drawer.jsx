import React, { useEffect } from "react";
import { XIcon } from "./Icon";

/**
 * Right-hand slide-over used by every create/edit form.
 *
 * Owns the chrome only — Esc to close, backdrop click, scroll lock, and the
 * header/body/footer geometry. Each form supplies its own fields and footer
 * buttons so validation stays with the form that owns it.
 */
const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  children,
  width = "max-w-lg",
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <aside
        className={`drawer-panel ${width}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Panel"}
      >
        <header className="drawer-header">
          <div className="flex items-start gap-2.5 min-w-0">
            {icon && (
              <span className="w-8 h-8 rounded-lg bg-(--brand-soft) text-(--brand) flex items-center justify-center shrink-0 mt-0.5">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="drawer-title truncate">{title}</h2>
              {subtitle && <p className="drawer-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn icon-btn-ghost shrink-0"
            aria-label="Close panel"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </header>

        <div className="drawer-body admin-scroll">{children}</div>

        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </>
  );
};

export default Drawer;
