import * as React from "react"
import { cn } from "cn"
import { Slot } from "radix-ui"

function Breadcrumb({ className, ...props }) {
  return (
    <nav
      data-slot="breadcrumb"
      aria-label="breadcrumb"
      className={cn("flex items-center text-micro text-ink-soft", className)}
      {...props}
    />
  )
}

function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({ className, asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("transition-colors duration-300 hover:text-gold-ink", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-separator"
      aria-hidden="true"
      className={cn("text-ink-soft/60 [&>svg]:size-3", className)}
      {...props}
    >
      {children ?? "/"}
    </span>
  )
}

function BreadcrumbEllipsis({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn("flex size-5 items-center justify-center", className)}
      {...props}
    >
      <span className="tracking-widest">...</span>
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
