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
        "group relative overflow-hidden rounded-xl bg-[#EAB308] px-8 py-4 font-black text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(234,179,8,0.3)]",
        className
      )}
    >
      {/* O brilho animado que corre o botão */}
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-20deg)]">
        <div className="relative h-full w-16 bg-white/40 blur-2xl animate-shiny-slide" />
      </div>
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
