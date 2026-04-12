/**
 * SnapContainer — vertical fullscreen scroll-snap via Swiper.js
 *
 * Layout contract (set by AppShell in App.tsx):
 *   - On "/" the outer wrapper is h-[100dvh] flex-col overflow-hidden
 *   - Header takes ~52 px at the top
 *   - This component fills the remaining flex-1 space (no fixed/absolute tricks)
 *
 * z-index layers:
 *   SectionDots    z-[55]  (above Header z-50, below modals)
 *   StickyPrizeBar z-[54]
 *   Header         z-[50]  (App.tsx)
 */

import { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Keyboard } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import AOS from "aos";
import "aos/dist/aos.css";
import { StickyPrizeBar } from "@/components/StickyPrizeBar";
import { SectionDots } from "@/components/SectionDots";

const SECTION_LABELS = [
  "Início",
  "Como funciona",
  "Pontuação",
  "Rankings",
  "Grupos",
  "Recompensas",
  "Garantir vaga",
];

interface Props {
  slides: React.ReactNode[];
  onOpenWizard: () => void;
  onFirstScroll?: () => void;
}

export const SnapContainer = ({ slides, onOpenWizard, onFirstScroll }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const firstScrollFired = useRef(false);

  useEffect(() => {
    AOS.init({
      duration: 550,
      once: true,
      easing: "ease-out-cubic",
      offset: 40,
    });
  }, []);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
    if (!firstScrollFired.current) {
      firstScrollFired.current = true;
      onFirstScroll?.();
    }
    // Let the browser settle the transition before AOS re-scans
    setTimeout(() => AOS.refresh(), 50);
  };

  return (
    // h-full fills the flex-1 container supplied by AppShell
    <div className="relative h-full w-full">
      <Swiper
        direction="vertical"
        slidesPerView={1}
        speed={700}
        mousewheel={{ sensitivity: 1, thresholdDelta: 50, releaseOnEdges: false }}
        keyboard={{ enabled: true }}
        modules={[Mousewheel, Keyboard]}
        onSwiper={(s) => {
          swiperRef.current = s;
        }}
        onSlideChange={handleSlideChange}
        className="h-full w-full"
        style={{ height: "100%" }}
      >
        {slides.map((slide, i) => (
          <SwiperSlide
            key={i}
            // overflow-y-auto: lets tall content scroll without conflicting with
            // the outer Swiper because Swiper intercepts wheel at the container level.
            className="!overflow-y-auto"
          >
            {slide}
          </SwiperSlide>
        ))}
      </Swiper>

      <StickyPrizeBar visible={activeIndex > 0} onCTA={onOpenWizard} />

      <SectionDots
        total={slides.length}
        active={activeIndex}
        labels={SECTION_LABELS}
        onDotClick={(i) => swiperRef.current?.slideTo(i)}
      />
    </div>
  );
};
