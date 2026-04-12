/**
 * SectionDots — vertical navigation pills on the right edge.
 * Hidden on mobile (sm: visible). z-[55] (above StickyPrizeBar).
 * Active dot = #f0c600. Tooltip shows section label on hover.
 */

interface Props {
  total: number;
  active: number;
  labels: string[];
  onDotClick: (index: number) => void;
}

export const SectionDots = ({ total, active, labels, onDotClick }: Props) => {
  return (
    <nav
      aria-label="Navegação por seção"
      className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-[55] flex-col gap-3"
    >
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          aria-label={`Ir para seção: ${labels[i] ?? i + 1}`}
          aria-current={i === active ? "true" : undefined}
          onClick={() => onDotClick(i)}
          title={labels[i] ?? `Seção ${i + 1}`}
          className="group relative flex items-center justify-end"
        >
          {/* Label tooltip — appears on hover to the left of the dot */}
          <span
            className="
              absolute right-6 whitespace-nowrap px-2 py-1 rounded-md text-[11px] font-bold
              bg-black/70 text-white opacity-0 group-hover:opacity-100
              transition-opacity duration-200 pointer-events-none
            "
          >
            {labels[i]}
          </span>

          {/* Dot */}
          <span
            className="block rounded-full transition-all duration-300"
            style={{
              width:  i === active ? "10px" : "7px",
              height: i === active ? "10px" : "7px",
              background: i === active ? "#f0c600" : "rgba(255,255,255,0.35)",
              boxShadow: i === active ? "0 0 8px rgba(240,198,0,0.7)" : "none",
            }}
          />
        </button>
      ))}
    </nav>
  );
};
