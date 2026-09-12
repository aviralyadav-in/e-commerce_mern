import React, { useId } from "react";
import { cn } from "../../lib/utils";

/**
 * Wraps a single form control with label, hint and error, wiring aria attributes.
 * Usage:
 *   <FormField label="Email" required error={errors.email} hint="We never share it">
 *     <input type="email" className="input-luxury" … />
 *   </FormField>
 * The child receives id, aria-invalid, aria-describedby and aria-required automatically.
 */
export default function FormField({
  label,
  hint,
  error,
  required = false,
  optionalLabel = "Optional",
  id: idProp,
  className,
  labelClassName,
  children,
}) {
  const autoId = useId();
  const id = idProp || `field-${autoId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || id,
        "aria-invalid": error ? "true" : children.props["aria-invalid"],
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })
    : children;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className={cn("label-luxury flex items-center justify-between gap-2", labelClassName)}>
          <span>
            {label}
            {required && (
              <span className="ml-0.5 text-gold-ink" aria-hidden="true">
                *
              </span>
            )}
          </span>
          {!required && optionalLabel && (
            <span className="text-[11px] font-medium normal-case tracking-normal text-ink-soft">{optionalLabel}</span>
          )}
        </label>
      )}
      {control}
      {error ? (
        <p id={errorId} role="alert" className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
