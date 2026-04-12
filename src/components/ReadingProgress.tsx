import { useEffect, useState } from "react";

/**
 * Thin progress bar at the top of the viewport showing scroll depth.
 * z-index 60 — above Header (z-50) but below modals/overlays.
 * Only rendered in Landing (route "/"); not imported globally.
 */
export const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      role="progressbar"
      aria-hidden="true"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 z-[60] h-[3px] bg-primary transition-[width] duration-100 pointer-events-none"
      style={{ width: `${progress}%` }}
    />
  );
};
