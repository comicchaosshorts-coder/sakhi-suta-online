// Only the existing, allow-listed media endpoint supports these variants.
export function imageVariant(src: string, width: number) {
  if (!src.startsWith("/api/public/media?")) return src;
  return `${src}&width=${width}`;
}

export function imageSrcSet(src: string, widths: number[]) {
  if (!src.startsWith("/api/public/media?")) return undefined;
  return widths.map((width) => `${imageVariant(src, width)} ${width}w`).join(", ");
}