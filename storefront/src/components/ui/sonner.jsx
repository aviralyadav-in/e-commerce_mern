"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { cn } from "cn"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Brand defaults. A caller's `style` / `toastOptions.classNames` are merged on
// top (per key, via cn) so Layout can extend without losing the base look.
const DEFAULT_STYLE = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--line)",
  "--border-radius": "1rem",
}

const DEFAULT_CLASSNAMES = {
  toast: "cn-toast rounded-2xl border border-line bg-popover font-sans text-small text-foreground shadow-lift",
  title: "font-semibold text-foreground",
  description: "text-ink-muted",
  closeButton: "border-line bg-popover text-foreground hover:bg-surface-2",
  actionButton: "rounded-lg bg-primary text-primary-foreground",
  cancelButton: "rounded-lg bg-surface-2 text-foreground",
}

function mergeClassNames(callerClassNames) {
  const merged = { ...DEFAULT_CLASSNAMES }
  if (!callerClassNames) return merged
  for (const key of Object.keys(callerClassNames)) {
    merged[key] = cn(DEFAULT_CLASSNAMES[key], callerClassNames[key])
  }
  return merged
}

const Toaster = ({
  theme: themeProp,
  toastOptions,
  style,
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={themeProp || theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-success" />
        ),
        info: (
          <InfoIcon className="size-4 text-gold-ink" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-warning" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-danger" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-ink-muted" />
        ),
      }}
      style={{ ...DEFAULT_STYLE, ...style }}
      toastOptions={{
        ...toastOptions,
        classNames: mergeClassNames(toastOptions && toastOptions.classNames),
      }}
      {...props}
    />
  );
}

export { Toaster }
