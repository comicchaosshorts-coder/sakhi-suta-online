import { useEffect, useRef, useState } from "react";
import { imageSrcSet, imageVariant } from "@/lib/responsive-images";

export type BannerSlide = {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  caption: string | null;
  title: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  banner_type: string;
  link_url: string | null;
  image_dimensions?: { width: number; height: number } | null;
  mobile_image_dimensions?: { width: number; height: number } | null;
};

export function BannerSlider({ slides }: { slides: BannerSlide[] }) {
  const [i, setI] = useState(0);
  const drag = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  const go = (dir: number) => setI((v) => (v + dir + count) % count);

  return (
    <section
      className="relative w-full overflow-hidden select-none"
      onTouchStart={(e) => (drag.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (drag.current === null) return;
        const dx = e.changedTouches[0].clientX - drag.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        drag.current = null;
      }}
      onMouseDown={(e) => (drag.current = e.clientX)}
      onMouseUp={(e) => {
        if (drag.current === null) return;
        const dx = e.clientX - drag.current;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        drag.current = null;
      }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full items-start transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {slides.map((s, idx) => {
            const src = s.image_url || "";
            const showText = s.banner_type !== "image_only";
            const heading = s.title || s.caption;
            return (
              <div key={s.id} className="relative w-full shrink-0 grow-0 basis-full">
                <picture>
                  {s.mobile_image_url && (
                    <source media="(max-width: 767px)"
                      srcSet={imageSrcSet(s.mobile_image_url, [480, 720, 1080]) || s.mobile_image_url}
                      sizes="100vw"
                      width={s.mobile_image_dimensions?.width}
                      height={s.mobile_image_dimensions?.height}
                    />
                  )}
                <img
                  src={imageVariant(src, 1440)}
                  srcSet={imageSrcSet(src, [480, 720, 1080, 1440, 1920])}
                  sizes="100vw"
                  width={s.image_dimensions?.width}
                  height={s.image_dimensions?.height}
                  alt={heading ?? "Sakhi Suta banner"}
                  loading={idx === 0 ? "eager" : "lazy"}
                  fetchPriority={idx === 0 ? "high" : "auto"}
                  decoding="async"
                  draggable={false}
                  className="block h-auto w-full object-contain"
                />
                </picture>
                {showText && (heading || s.description || s.button_text) && (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-center md:p-12 md:text-left">
                      {heading && (
                        <h2 className="font-serif text-2xl text-primary md:text-5xl">{heading}</h2>
                      )}
                      {s.description && (
                        <p className="mx-auto mt-2 max-w-xl text-sm text-foreground/85 md:mx-0 md:text-base">
                          {s.description}
                        </p>
                      )}
                      {s.button_text && (s.button_link || s.link_url) && (
                        <a
                          href={s.button_link || s.link_url || "#"}
                          className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow"
                        >
                          {s.button_text}
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            aria-label="Previous banner"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 px-3 py-2 text-primary backdrop-blur hover:bg-background/80"
          >
            ‹
          </button>
          <button
            aria-label="Next banner"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 px-3 py-2 text-primary backdrop-blur hover:bg-background/80"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to banner ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-primary/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
