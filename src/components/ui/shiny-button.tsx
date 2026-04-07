import React from "react";
import { cn } from "@/lib/utils";

export function ShinyButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-[#EAB308] px-8 py-4 font-black text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg w-full flex items-center justify-center gap-2",
        className
      )}
    >
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-15deg)]">
        <div className="relative h-full w-12 bg-white/40 blur-xl animate-shiny-slide" />
      </div>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
