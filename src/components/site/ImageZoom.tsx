import { useRef, useState } from "react";

export function ImageZoom({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={ref}
      className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary"
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-500"
        style={
          pos
            ? {
                transformOrigin: `${pos.x}% ${pos.y}%`,
                transform: "scale(1.9)",
              }
            : undefined
        }
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/60 to-transparent p-3 text-[10px] uppercase tracking-widest text-primary/70">
        Hover to zoom
      </div>
    </div>
  );
}
