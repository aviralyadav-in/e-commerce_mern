import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[10px] leading-4 font-bold uppercase tracking-[0.14em] whitespace-nowrap transition-colors duration-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-danger aria-invalid:ring-danger/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary-hover [a]:hover:text-onyx",
        secondary:
          "bg-surface-2 text-foreground [a]:hover:bg-surface-3",
        destructive:
          "bg-danger-soft text-danger focus-visible:ring-danger/20 [a]:hover:bg-danger [a]:hover:text-white",
        outline:
          "border-line bg-surface text-foreground [a]:hover:bg-surface-2",
        ghost:
          "text-ink-muted hover:bg-surface-2 hover:text-foreground",
        link: "text-gold-ink underline-offset-4 hover:underline",
        sale: "bg-onyx text-ivory",
        stock: "bg-champagne text-onyx",
        soldout: "bg-taupe text-ivory",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        gold: "bg-gold-soft text-gold-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
