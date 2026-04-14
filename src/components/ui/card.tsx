import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ── Card variant system ──────────────────────────────────────────── */
const cardVariants = cva(
  "rounded-2xl border transition-all duration-normal",
  {
    variants: {
      variant: {
        // Standard surface card — replaces old rounded-lg shadow-sm
        default: "bg-card text-card-foreground shadow-card border-border/60",

        // Floats higher with subtle lift on hover
        elevated: [
          "bg-card text-card-foreground border-border/40",
          "shadow-lg hover:-translate-y-0.5 hover:shadow-xl",
        ],

        // Compact stats display — number + label
        stat: "bg-card text-card-foreground shadow-md border-border/60",

        // Accent stripe along the top edge
        highlight: [
          "bg-card text-card-foreground shadow-md border-border/40",
          "border-t-2 border-t-primary",
        ],

        // Subtle surface gradient
        gradient: [
          "text-card-foreground shadow-card border-border/40",
          "bg-gradient-to-b from-surface-raised to-card",
        ],

        // Clickable card — scale + shadow upgrade on hover
        interactive: [
          "bg-card text-card-foreground shadow-md border-border/60",
          "cursor-pointer hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  ),
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}
