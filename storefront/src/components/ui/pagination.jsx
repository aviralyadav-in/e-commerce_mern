import * as React from "react"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

function Pagination({ className, ...props }) {
  return (
    <nav
      data-slot="pagination"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }) {
  return (
    <div
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-2", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }) {
  return <div data-slot="pagination-item" {...props} />
}

function PaginationButton({ className, isActive, size = "icon", ...props }) {
  return (
    <button
      type="button"
      data-slot="pagination-link"
      data-size={size}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      className={cn(
        "inline-flex size-10 items-center justify-center gap-1 rounded-full border border-line bg-surface text-xs font-semibold text-foreground transition-all duration-300 ease-luxury hover:border-line-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:shadow-soft data-[size=default]:w-auto data-[size=default]:min-w-10 data-[size=default]:px-3.5",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }) {
  return (
    <PaginationButton
      aria-label="Go to previous page"
      size="default"
      className={cn("sm:pr-4", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span className="hidden sm:inline">Prev</span>
    </PaginationButton>
  )
}

function PaginationNext({ className, ...props }) {
  return (
    <PaginationButton
      aria-label="Go to next page"
      size="default"
      className={cn("sm:pl-4", className)}
      {...props}
    >
      <span className="hidden sm:inline">Next</span>
      <ChevronRightIcon className="size-4" />
    </PaginationButton>
  )
}

function PaginationEllipsis({ className, ...props }) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden
      className={cn("flex size-10 items-center justify-center text-ink-soft", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationButton,
  PaginationNext,
  PaginationPrevious,
}
