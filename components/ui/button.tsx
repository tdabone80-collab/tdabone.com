import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        // Big size inspired by Figma: taller, larger text, bigger radius and custom gaps/padding
      // Responsive big size (uses Tailwind defaults, no arbitrary values)
      big: "h-16 md:h-20 rounded-3xl md:py-5 py-4 md:px-5 px-4 md:gap-4 gap-3 text-2xl md:text-3xl md:leading-10 leading-8 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  ariaLabel,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    fullWidth?: boolean
    icon?: React.ReactNode
    iconPosition?: "left" | "right"
    ariaLabel?: string
  }) {
  const Comp = asChild ? Slot : "button"

  const widthClass = fullWidth ? "w-full max-w-xl" : undefined
  const iconSpacingLeft = size === "big" ? "mr-4" : "mr-2"
  const iconSpacingRight = size === "big" ? "ml-4" : "ml-2"

  const ariaProps = !children && icon ? { "aria-label": ariaLabel ?? "button" } : {}

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), widthClass)}
      {...props}
      {...ariaProps}
    >
      {icon && iconPosition === "left" ? (
        <span className={iconSpacingLeft}>{icon}</span>
      ) : null}

      {children}

      {icon && iconPosition === "right" ? (
        <span className={iconSpacingRight}>{icon}</span>
      ) : null}
    </button>
  )
}

export { Button, buttonVariants }
