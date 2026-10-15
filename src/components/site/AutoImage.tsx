import { useState } from "react";
import { imageSrcSet } from "@/lib/responsive-images";

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
        srcSet={imageSrcSet(src, [320, 480, 640, 960])}
        sizes="(min-width: 1280px) 296px, (min-width: 768px) 25vw, 50vw"
        alt={alt}
        loading={loading}
        decoding="async"
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
