import * as React from "react"
import { cn } from "cn"
import { cva } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-ink-muted transition-all duration-300 ease-luxury outline-none hover:bg-surface-2 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-danger/20 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-soft [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-line bg-surface hover:border-line-strong hover:bg-surface-2",
      },
      size: {
        default: "h-9 min-w-9 px-3",
        sm: "h-8 min-w-8 px-2.5",
        lg: "h-10 min-w-10 px-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Toggle({ className, variant, size, ...props }) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
