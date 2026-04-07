import React from "react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function ShinyButton({ children, className, ...props }: ShinyButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-primary px-8 py-4 font-black text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {/* O brilho animado (CSS Puro) */}
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-15deg)]">
        <div className="relative h-full w-12 bg-white/30 blur-xl animate-shiny-slide" />
      </div>
      
      <span className="relative z-10">{children}</span>
    </button>
  );
}
