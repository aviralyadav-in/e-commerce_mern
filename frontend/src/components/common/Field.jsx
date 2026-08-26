import React from "react";
import { AlertIcon } from "./Icon";

/**
 * Label + control + error/hint wrapper for drawer forms.
 * Add `is-invalid` to the control yourself via the `invalid` flag you already
 * track, so the red ring and this message stay in sync.
 */
export const Field = ({
  label,
  required = false,
  optional = false,
  hint,
  error,
  htmlFor,
  className = "",
  children,
}) => (
  <div className={className}>
    {label && (
      <label className="form-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="form-required"> *</span>}
        {optional && <span className="form-optional"> (optional)</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="form-error">
        <AlertIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p className="form-hint">{hint}</p>
    ) : null}
  </div>
);

/** Non-field-specific error (e.g. a rejected API call) shown inside a form. */
export const FormAlert = ({ children }) =>
  children ? (
    <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-(--radius) bg-red-50 border border-red-200 text-[12.5px] text-red-700">
      <AlertIcon className="w-4 h-4 shrink-0 mt-px" />
      <span className="min-w-0">{children}</span>
    </div>
  ) : null;

export default Field;
