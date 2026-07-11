import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  file: File;
  aspect?: number;
  title?: string;
  onCancel: () => void;
  onConfirm: (blob: Blob, filename: string) => void;
};

async function getCroppedBlob(imageSrc: string, area: Area, mime = "image/jpeg"): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  // Cap output size for reasonable upload weight
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop failed"))), mime, 0.9),
  );
}

export function ImageCropper({ file, aspect = 3 / 4, title, onCancel, onConfirm }: Props) {
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function confirm() {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, area);
      const base = file.name.replace(/\.[^.]+$/, "");
      onConfirm(blob, `${base}.jpg`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-background">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="font-serif text-lg">{title ?? "Adjust image"}</div>
          <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="relative h-[60vh] w-full bg-black">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              objectFit={fit === "cover" ? "cover" : "contain"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
              restrictPosition={fit === "cover"}
              minZoom={fit === "contain" ? 0.4 : 1}
            />
          )}
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="w-16 text-xs uppercase tracking-widest text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={fit === "contain" ? 0.4 : 1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-16 uppercase tracking-widest text-muted-foreground">Fit</span>
            <button
              type="button"
              onClick={() => setFit("cover")}
              className={`rounded-full border px-3 py-1 ${fit === "cover" ? "border-primary text-primary" : "border-border/60 text-muted-foreground"}`}
            >
              Fill frame
            </button>
            <button
              type="button"
              onClick={() => {
                setFit("contain");
                setZoom(1);
                setCrop({ x: 0, y: 0 });
              }}
              className={`rounded-full border px-3 py-1 ${fit === "contain" ? "border-primary text-primary" : "border-border/60 text-muted-foreground"}`}
            >
              Show whole image
            </button>
            <span className="ml-auto text-muted-foreground">Drag to reposition · pinch/scroll to zoom</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-border/60 px-4 py-2 text-sm"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy || !area}
            className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary-glow disabled:opacity-60"
          >
            {busy ? "Processing…" : "Use this image"}
          </button>
        </div>
      </div>
    </div>
  );
}
