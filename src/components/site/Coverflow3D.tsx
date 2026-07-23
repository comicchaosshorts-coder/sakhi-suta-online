import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/format";
import type { ProductCardData } from "@/components/site/ProductCard";

type Props = { products: ProductCardData[] };

const AUTOPLAY_MS = 4500;
const RESUME_MS = 2500;

export function Coverflow3D({ products }: Props) {
  const count = products.length;
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = useCallback(
    (dir: number) => setActive((v) => (count === 0 ? 0 : (v + dir + count) % count)),
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setActive((v) => (v + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count]);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_MS);
  };

  const onDown = (x: number) => {
    startX.current = x;
    pause();
  };
  const onMove = (x: number) => {
    if (startX.current === null) return;
    setDrag(x - startX.current);
  };
  const onUp = () => {
    if (startX.current === null) return;
    const dx = drag;
    startX.current = null;
    setDrag(0);
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    scheduleResume();
  };

  if (count === 0) return null;

  const rel = (i: number) => {
    let d = i - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  return (
    <div
      className="relative mx-auto w-full max-w-full box-border"
      style={{ perspective: "1400px", overflowX: "clip", overflowY: "visible" }}
      onMouseDown={(e) => onDown(e.clientX)}
      onMouseMove={(e) => startX.current !== null && onMove(e.clientX)}
      onMouseUp={onUp}
      onMouseLeave={() => {
        if (startX.current !== null) onUp();
        scheduleResume();
      }}
      onMouseEnter={pause}
      onTouchStart={(e) => onDown(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={onUp}
    >
      <div
        className="relative mx-auto h-[380px] w-full max-w-3xl md:h-[440px]"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(4deg)" }}
      >

        {products.map((p, i) => {
          const d = rel(i);
          const absD = Math.abs(d);
          if (absD > 2) return null;
          const dragOffset = drag * 0.4;
          const x = d * 130 + dragOffset;
          const rotY = d * -22;
          const z = -Math.abs(d) * 160;
          const scale = d === 0 ? 1 : 0.78 - absD * 0.05;
          const opacity = absD > 1 ? 0.35 : 1;
          const zi = 10 - absD;
          const img = p.images?.[0];
          return (
            <Link
              key={p.id}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="absolute left-1/2 top-1/2 block h-[340px] w-[190px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] md:h-[420px] md:w-[240px]"
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`,
                transition: startX.current !== null ? "none" : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease",
                opacity,
                zIndex: zi,
                pointerEvents: d === 0 ? "auto" : "none",
              }}
              draggable={false}
              onClick={(e) => {
                if (Math.abs(drag) > 6) e.preventDefault();
              }}
            >
              {img ? (
                <img
                  src={img}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="grid h-full w-full place-items-center font-serif text-4xl text-primary/40">
                  {p.name.charAt(0)}
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-3">
                <p className="truncate font-serif text-sm text-foreground md:text-base">{p.name}</p>
                <p className="text-xs font-semibold text-primary">{formatINR(p.price_inr)}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {products.map((_, i) => (
            <button
              key={i}
              aria-label={`Show product ${i + 1}`}
              onClick={() => {
                pause();
                setActive(i);
                scheduleResume();
              }}
              className={`h-1 rounded-full transition-all ${
                i === active ? "w-6 bg-primary" : "w-2 bg-primary/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
