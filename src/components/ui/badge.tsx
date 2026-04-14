import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // ── shadcn originals (kept for compat) ──
        default:     "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:   "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:     "text-foreground border-border",

        // ── Copa design system ──
        // Gold chip — phase, Pro plan, highlight labels
        gold:    "border-primary/30 bg-primary/10 text-primary",

        // Soft green — correct prediction, paid, active
        success: "border-green-500/30 bg-green-500/10 text-green-400",

        // Soft red — wrong prediction, error state
        error:   "border-destructive/30 bg-destructive/10 text-destructive",

        // Amber — pending, live, warning
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",

        // Navy/secondary — phase badge, group label
        navy:    "border-secondary/30 bg-secondary/10 text-secondary-foreground",

        // Muted — neutral, informational
        muted:   "border-border/60 bg-muted/60 text-muted-foreground",

        // Live pulsing red — used for ao vivo indicator
        live:    "border-red-500/30 bg-red-500/15 text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
