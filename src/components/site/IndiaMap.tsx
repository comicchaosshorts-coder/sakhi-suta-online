import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import DOMPurify from "isomorphic-dompurify";

type StateInfo = {
  slug: string;
  name: string;
  saree_types: string[] | null;
};

type Props = {
  svg: string | null;
  states: StateInfo[];
  compact?: boolean;
};

/**
 * Renders an uploaded India SVG and wires each <path>/<g> to a state
 * by matching id / data-name / class / title to the state slug or name.
 */
export function IndiaMap({ svg, states, compact = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; state: StateInfo } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !svg) return;

    // Sanitize but keep IDs and classes intact
    const clean = DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_ATTR: ["id", "data-name", "class", "title"],
    });
    wrap.innerHTML = clean;

    const svgEl = wrap.querySelector("svg");
    if (!svgEl) return;
    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgEl.style.maxHeight = compact ? "260px" : "80vh";

    const byKey = new Map<string, StateInfo>();
    for (const s of states) {
      byKey.set(s.slug.toLowerCase(), s);
      byKey.set(s.name.toLowerCase(), s);
      byKey.set(s.name.toLowerCase().replace(/\s+/g, "-"), s);
      byKey.set(s.name.toLowerCase().replace(/\s+/g, "_"), s);
      byKey.set(s.name.toLowerCase().replace(/\s+/g, ""), s);
    }

    const shapes = svgEl.querySelectorAll<SVGGraphicsElement>("path, g, polygon");
    const cleanup: Array<() => void> = [];

    shapes.forEach((el) => {
      const candidates = [
        el.getAttribute("id"),
        el.getAttribute("data-name"),
        el.getAttribute("data-state"),
        el.getAttribute("name"),
        el.getAttribute("title"),
        el.querySelector("title")?.textContent,
        ...el.getAttribute("class")?.split(/\s+/) ?? [],
      ].filter(Boolean) as string[];

      let match: StateInfo | undefined;
      for (const c of candidates) {
        const key = c.toLowerCase().replace(/[_\s]+/g, "-");
        match = byKey.get(key) ?? byKey.get(c.toLowerCase());
        if (match) break;
      }
      if (!match) return;

      el.style.cursor = "pointer";
      el.style.fill = "oklch(0.24 0.02 40)";
      el.style.stroke = "oklch(0.78 0.14 85 / 0.5)";
      el.style.strokeWidth = "0.7";
      el.style.transition = "fill 200ms, filter 200ms";

      const onEnter = (e: MouseEvent) => {
        el.style.fill = "oklch(0.78 0.14 85)";
        el.style.filter = "drop-shadow(0 0 10px oklch(0.78 0.14 85 / 0.7))";
        setTooltip({ x: e.clientX, y: e.clientY, state: match! });
      };
      const onMove = (e: MouseEvent) => setTooltip({ x: e.clientX, y: e.clientY, state: match! });
      const onLeave = () => {
        el.style.fill = "oklch(0.24 0.02 40)";
        el.style.filter = "";
        setTooltip(null);
      };
      const onClick = () => navigate({ to: "/state/$slug", params: { slug: match!.slug } });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("click", onClick);
      cleanup.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("click", onClick);
      });
    });

    return () => cleanup.forEach((f) => f());
  }, [svg, states, compact, navigate]);

  if (!svg) {
    return (
      <div className="rounded-2xl glass p-10 text-center">
        <p className="font-serif text-2xl">The India map awaits its upload</p>
        <p className="mt-2 text-sm text-muted-foreground">
          An admin can upload a clean India SVG in the admin panel — each state becomes a
          clickable, glowing region.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={wrapRef} className="w-full [&_svg]:mx-auto" />
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg glass px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="font-serif text-sm text-primary">{tooltip.state.name}</div>
          {tooltip.state.saree_types && tooltip.state.saree_types.length > 0 && (
            <div className="mt-1 text-muted-foreground">
              {tooltip.state.saree_types.slice(0, 3).join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
