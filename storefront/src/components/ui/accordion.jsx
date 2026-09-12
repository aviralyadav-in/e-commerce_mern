import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

function Accordion({
  ...props
}) {
  return <div data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  defaultOpen = false,
  children,
  ...props
}) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  return (
    <div
      data-slot="accordion-item"
      data-state={open ? "open" : "closed"}
      className={cn("border-b border-line last:border-0", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        if (child.props["data-slot"] === "trigger")
          return React.cloneElement(child, { open, onToggle: () => setOpen(!open) })
        if (child.props["data-slot"] === "content")
          return React.cloneElement(child, { open })
        return child
      })}
    </div>
  )
}

function AccordionTrigger({
  className,
  children,
  open,
  onToggle,
  ...props
}) {
  return (
    <button
      type="button"
      data-slot="trigger"
      data-state={open ? "open" : "closed"}
      aria-expanded={!!open}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between gap-3 py-4 text-left font-serif text-base font-semibold tracking-tight text-foreground transition-colors duration-300 hover:text-gold-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 rounded-lg [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDownIcon
        className={cn("size-4 shrink-0 text-gold-ink transition-transform duration-300 ease-luxury", open && "rotate-180")}
      />
    </button>
  )
}

function AccordionContent({
  className,
  children,
  open,
  ...props
}) {
  return (
    <div
      data-slot="content"
      data-state={open ? "open" : "closed"}
      className={cn(
        "grid transition-all duration-300 ease-luxury",
        open ? "grid-rows-[1fr] opacity-100 pb-4" : "grid-rows-[0fr] opacity-0"
      )}
      {...props}
    >
      <div className={cn("overflow-hidden text-small text-ink-muted", className)}>
        {children}
      </div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
