/**
 * StickyPrizeBar
 *
 * Fixed bar that fades in once the user leaves the Hero slide (activeIndex > 0).
 * Desktop: top of viewport (below header z-50) → z-[54]
 * Mobile: bottom of viewport (above safe-area) → uses CSS class `sm:top-0 bottom-0`
 *
 * Spec: backdrop-blur(8px) + #0a2e1a at 90% opacity
 */

import { ChevronRight } from "lucide-react";

interface Props {
  visible: boolean;
  onCTA: () => void;
}

export const StickyPrizeBar = ({ visible, onCTA }: Props) => {
  return (
    <div
      role="complementary"
      aria-label="Barra de prêmio"
      className={[
        // positioning: top on ≥sm, bottom on mobile
        "fixed left-0 right-0 z-[54]",
        "top-auto bottom-0 sm:top-[52px] sm:bottom-auto",
        // height
        "h-14 px-4",
        // layout
        "flex items-center justify-between max-w-screen-lg mx-auto",
        // glass bg
        "border-border/40",
        "sm:border-b sm:border-t-0 border-t",
        // transition
        "transition-all duration-500 ease-out",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none sm:-translate-y-2",
      ].join(" ")}
      style={{
        background: "rgba(10,46,26,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Prize amount */}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          Prêmio total
        </span>
        <span className="text-base font-black" style={{ color: "#f0c600" }}>
          R$ 5.000.000
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={onCTA}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all duration-150 active:scale-95 hover:brightness-110"
        style={{ background: "#f0c600", color: "#0a2e1a" }}
      >
        QUERO MEU LUGAR <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
