import * as React from "react"
import { cn } from "@/lib/utils"

interface BentoGridProps {
  cols?: 2 | 3;
  className?: string;
  children: React.ReactNode;
}

export const BentoGrid = ({ cols = 2, className, children }: BentoGridProps) => (
  <div
    className={cn(
      "grid gap-4",
      cols === 2 && "grid-cols-1 sm:grid-cols-2",
      cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      className,
    )}
  >
    {children}
  </div>
)

interface BentoItemProps {
  span?: 1 | 2 | "auto";
  className?: string;
  children: React.ReactNode;
}

export const BentoItem = ({ span = 1, className, children }: BentoItemProps) => (
  <div
    className={cn(
      span === 2 && "sm:col-span-2",
      className,
    )}
  >
    {children}
  </div>
)
