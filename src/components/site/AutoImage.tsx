import { useState } from "react";

/**
 * Image that adopts the natural aspect ratio of the source, so nothing is cropped.
 * Falls back to a portrait frame until the image loads.
 */
export function AutoImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  fallbackAspect = 9 / 16,
  onLoad,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackAspect?: number;
  onLoad?: () => void;
  loading?: "lazy" | "eager";
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <div
      className={`relative w-full overflow-hidden bg-secondary ${className}`}
      style={{ aspectRatio: ratio ?? fallbackAspect }}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={(e) => {
          const t = e.currentTarget;
          if (t.naturalWidth && t.naturalHeight) {
            setRatio(t.naturalWidth / t.naturalHeight);
          }
          onLoad?.();
        }}
        className={`h-full w-full object-contain ${imgClassName}`}
      />
    </div>
  );
}
