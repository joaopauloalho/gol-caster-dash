import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: string;
  sub?: string;
  variant?: "default" | "colored" | "dark";
  className?: string;
}

export const StatCard = ({
  value,
  label,
  icon,
  trend,
  sub,
  variant = "default",
  className,
}: StatCardProps) => {
  const isPositive = trend?.startsWith("+")

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border shadow-card transition-all duration-normal",
        variant === "default" && "bg-card border-border/60",
        variant === "colored" && "bg-primary/[0.08] border-primary/20",
        variant === "dark"    && "bg-surface-raised border-border/40",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="font-display text-4xl font-black text-foreground tabular-nums leading-none">
        {value}
      </div>

      {sub && (
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      )}

      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-xs font-semibold",
            isPositive ? "text-green-400" : "text-destructive",
          )}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
  )
}
