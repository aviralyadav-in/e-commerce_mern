import * as React from "react"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const CAROUSEL_NAV_CLASSES =
  "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-foreground shadow-soft backdrop-blur transition-all duration-300 ease-luxury hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30 md:inline-flex [&_svg]:size-4"

function Carousel({ className, children, ...props }) {
  const scrollRef = React.useRef(null)
  const [canPrev, setCanPrev] = React.useState(false)
  const [canNext, setCanNext] = React.useState(true)

  const updateArrows = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  React.useEffect(() => {
    updateArrows()
    window.addEventListener("resize", updateArrows)
    return () => window.removeEventListener("resize", updateArrows)
  }, [updateArrows])

  const scrollBy = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }

  return (
    <div data-slot="carousel" className={cn("relative", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        if (child.props["data-slot"] === "carousel-content")
          return React.cloneElement(child, { ref: scrollRef, onScroll: updateArrows })
        if (child.props["data-slot"] === "carousel-prev")
          return React.cloneElement(child, { onClick: () => scrollBy(-1), disabled: !canPrev })
        if (child.props["data-slot"] === "carousel-next")
          return React.cloneElement(child, { onClick: () => scrollBy(1), disabled: !canNext })
        return child
      })}
    </div>
  )
}

const CarouselContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="carousel-content"
    className={cn("no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-1 snap-x", className)}
    {...props}
  />
))
CarouselContent.displayName = "CarouselContent"

function CarouselItem({ className, ...props }) {
  return (
    <div
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 snap-start", className)}
      {...props}
    />
  )
}

function CarouselPrevious({ className, ...props }) {
  return (
    <button
      type="button"
      data-slot="carousel-prev"
      aria-label="Previous"
      className={cn(CAROUSEL_NAV_CLASSES, "-left-3", className)}
      {...props}
    >
      <ChevronLeftIcon aria-hidden="true" />
    </button>
  )
}

function CarouselNext({ className, ...props }) {
  return (
    <button
      type="button"
      data-slot="carousel-next"
      aria-label="Next"
      className={cn(CAROUSEL_NAV_CLASSES, "-right-3", className)}
      {...props}
    >
      <ChevronRightIcon aria-hidden="true" />
    </button>
  )
}

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
