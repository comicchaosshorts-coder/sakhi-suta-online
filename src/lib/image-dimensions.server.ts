const dimensions = new Map<string, { width: number; height: number; expires: number }>();

// Read only the header, not the whole original. No decoding/native runtime needed.
export async function getImageDimensions(src: string) {
  if (!src.startsWith("/api/public/media?")) return null;
  const cached = dimensions.get(src);
  if (cached && cached.expires > Date.now()) return { width: cached.width, height: cached.height };
  const params = new URLSearchParams(src.split("?")[1]);
  const bucket = params.get("bucket");
  const key = params.get("key");
  if (!bucket || !key || !["product-images", "brand-assets"].includes(bucket)) return null;
  const base = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !secret) return null;
  try {
    const response = await fetch(`${base}/storage/v1/object/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`, {
      headers: { apikey: secret, Authorization: `Bearer ${secret}`, Range: "bytes=0-65535" },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok || response.status !== 206) { await response.body?.cancel(); return null; }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const view = new DataView(bytes.buffer);
    let width = 0, height = 0;
    if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47) {
      width = view.getUint32(16); height = view.getUint32(20);
    } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      for (let offset = 2; offset + 9 < bytes.length;) {
        if (bytes[offset] !== 0xff) break;
        const marker = bytes[offset + 1];
        if (marker === 0xda || marker === 0xd9) break;
        const length = view.getUint16(offset + 2);
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
          height = view.getUint16(offset + 5); width = view.getUint16(offset + 7); break;
        }
        if (length < 2) break;
        offset += length + 2;
      }
    }
    if (!width || !height) return null;
    if (dimensions.size > 256) dimensions.clear();
    dimensions.set(src, { width, height, expires: Date.now() + 300000 });
    return { width, height };
  } catch { return null; }
}