import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type HeroSlide = {
  id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), 5500);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  const go = (dir: number) => setI((v) => (v + dir + count) % count);
  const current = slides[i];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl glass"
      onTouchStart={(e) => setDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (dragStart === null) return;
        const dx = e.changedTouches[0].clientX - dragStart;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setDragStart(null);
      }}
      onMouseDown={(e) => setDragStart(e.clientX)}
      onMouseUp={(e) => {
        if (dragStart === null) return;
        const dx = e.clientX - dragStart;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        setDragStart(null);
      }}
      style={{ userSelect: "none" }}
    >
      <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img
              src={current.image_url}
              alt={current.caption ?? "Sakhi Suta"}
              className="h-full w-full object-cover"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            {current.caption && (
              <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10">
                <p className="font-serif text-2xl text-primary md:text-4xl">{current.caption}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 px-3 py-2 text-primary backdrop-blur hover:bg-background/80"
          >
            ‹
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 px-3 py-2 text-primary backdrop-blur hover:bg-background/80"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-8 bg-primary" : "w-2 bg-primary/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
