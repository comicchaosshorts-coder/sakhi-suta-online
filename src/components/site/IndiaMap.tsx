import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
// Bundled, high-fidelity India states SVG (all 35 states/UTs, path id = state name)
import indiaSvgRaw from "@/assets/india-states.svg?raw";

type StateInfo = {
  slug: string;
  name: string;
  saree_types: string[] | null;
};

type Props = {
  states: StateInfo[];
  compact?: boolean;
};

type Pin = {
  key: string;
  slug: string;
  name: string;
  saree_types: string[] | null;
  cx: number;
  cy: number;
};

// Aliases: SVG uses colonial/legacy names; DB may use modern slugs.
const ALIASES: Record<string, string[]> = {
  odisha: ["orissa"],
  uttarakhand: ["uttaranchal"],
  "jammu-and-kashmir": ["jammu & kashmir", "jk"],
  "dadra-and-nagar-haveli": ["dadra & nagar haveli"],
  "daman-and-diu": ["daman & diu"],
  "andaman-and-nicobar": ["andaman & nicobar", "andaman and nicobar islands"],
  puducherry: ["pondicherry", "pudducherry"],
  delhi: ["nct of delhi", "national capital territory of delhi"],
  telangana: ["andhra pradesh"], // fallback if SVG lacks Telangana split
};

const norm = (s: string) => s.toLowerCase().replace(/[_\s&.]+/g, "-").replace(/-+/g, "-").trim();

export function IndiaMap({ states, compact = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [viewBox, setViewBox] = useState<string>("0 0 800 787");

  const stateByKey = useMemo(() => {
    const m = new Map<string, StateInfo>();
    for (const s of states) {
      const keys = [s.slug, s.name, norm(s.slug), norm(s.name)];
      const aliases = ALIASES[norm(s.slug)] ?? [];
      for (const a of aliases) keys.push(a, norm(a));
      for (const k of keys) m.set(norm(k), s);
    }
    return m;
  }, [states]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.innerHTML = indiaSvgRaw;
    const svgEl = wrap.querySelector("svg");
    if (!svgEl) return;

    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgEl.classList.add("india-outline");
    const vb = svgEl.getAttribute("viewBox");
    if (vb) setViewBox(vb);

    const shapes = svgEl.querySelectorAll<SVGPathElement>("path[id]");
    const cleanup: Array<() => void> = [];
    const nextPins: Pin[] = [];
    const seen = new Set<string>();

    shapes.forEach((el) => {
      const rawId = el.getAttribute("id") ?? "";
      const match = stateByKey.get(norm(rawId));
      if (!match) return;

      // Base styling — luxurious outline
      el.setAttribute("data-slug", match.slug);
      el.style.cursor = "pointer";
      el.style.transition = "fill 250ms ease, filter 250ms ease, stroke 250ms ease";
      el.style.fill = "oklch(0.20 0.01 40 / 0.55)";
      el.style.stroke = "oklch(0.78 0.14 85 / 0.55)";
      el.style.strokeWidth = "0.6";

      // Compute pin position from geometry bbox
      if (!seen.has(match.slug)) {
        try {
          const bb = el.getBBox();
          nextPins.push({
            key: match.slug,
            slug: match.slug,
            name: match.name,
            saree_types: match.saree_types,
            cx: bb.x + bb.width / 2,
            cy: bb.y + bb.height / 2,
          });
          seen.add(match.slug);
        } catch {
          /* ignore */
        }
      }

      const setHoverState = (on: boolean) => {
        if (on) {
          el.style.fill = "oklch(0.78 0.14 85 / 0.85)";
          el.style.stroke = "oklch(0.88 0.15 90)";
          el.style.filter = "drop-shadow(0 0 6px oklch(0.78 0.14 85 / 0.9))";
        } else {
          el.style.fill = "oklch(0.20 0.01 40 / 0.55)";
          el.style.stroke = "oklch(0.78 0.14 85 / 0.55)";
          el.style.filter = "";
        }
      };

      const onEnter = () => { setHoverState(true); setHover(match.slug); };
      const onLeave = () => { setHoverState(false); setHover((h) => (h === match.slug ? null : h)); };
      const onClick = () => navigate({ to: "/state/$slug", params: { slug: match.slug } });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("click", onClick);
      cleanup.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("click", onClick);
      });
    });

    setPins(nextPins);
    return () => cleanup.forEach((f) => f());
  }, [stateByKey, navigate]);

  const [vbX, vbY, vbW, vbH] = viewBox.split(/\s+/).map(Number);
  const pinR = Math.max(vbW, vbH) * 0.006;

  return (
    <div className="relative w-full" style={{ maxHeight: compact ? 320 : "80vh" }}>
      {/* Base outline layer */}
      <div
        ref={wrapRef}
        className="relative w-full [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        style={{ maxHeight: compact ? 320 : "78vh" }}
      />

      {/* Pin & label overlay — same viewBox, non-interactive except pins */}
      {pins.length > 0 && (
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 mx-auto block h-full w-full"
        >
          <defs>
            <radialGradient id="pinGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.95 0.15 90)" />
              <stop offset="60%" stopColor="oklch(0.78 0.14 85)" />
              <stop offset="100%" stopColor="oklch(0.55 0.14 70)" />
            </radialGradient>
            <filter id="pinGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation={pinR * 0.8} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {pins.map((p) => {
            const active = hover === p.slug;
            return (
              <g
                key={p.key}
                transform={`translate(${p.cx} ${p.cy})`}
                className="pointer-events-auto"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover(p.slug)}
                onMouseLeave={() => setHover((h) => (h === p.slug ? null : h))}
                onClick={() => navigate({ to: "/state/$slug", params: { slug: p.slug } })}
              >
                {/* pulse ring */}
                <circle
                  r={pinR * (active ? 3.2 : 2.2)}
                  fill="none"
                  stroke="oklch(0.78 0.14 85)"
                  strokeOpacity={active ? 0.7 : 0.3}
                  strokeWidth={pinR * 0.25}
                />
                <circle
                  r={pinR * (active ? 1.4 : 1)}
                  fill="url(#pinGrad)"
                  filter="url(#pinGlow)"
                />
                {/* label */}
                <g
                  transform={`translate(0 ${-pinR * 2.5})`}
                  style={{
                    opacity: active ? 1 : 0,
                    transition: "opacity 200ms ease",
                  }}
                >
                  <rect
                    x={-p.name.length * pinR * 0.55}
                    y={-pinR * 1.8}
                    width={p.name.length * pinR * 1.1}
                    height={pinR * 2.4}
                    rx={pinR * 0.6}
                    fill="oklch(0.14 0.005 40 / 0.92)"
                    stroke="oklch(0.78 0.14 85 / 0.6)"
                    strokeWidth={pinR * 0.12}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    y={-pinR * 0.55}
                    fill="oklch(0.94 0.05 85)"
                    fontFamily="var(--font-serif)"
                    fontSize={pinR * 1.6}
                  >
                    {p.name}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      )}

      {/* Hover detail panel */}
      {hover && (() => {
        const p = pins.find((x) => x.slug === hover);
        if (!p) return null;
        return (
          <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl glass px-4 py-3 shadow-[var(--shadow-gold)]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary/70">Region</div>
            <div className="font-serif text-xl text-primary">{p.name}</div>
            {p.saree_types && p.saree_types.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                {p.saree_types.slice(0, 4).join(" · ")}
              </div>
            )}
            <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-foreground/60">
              Click to enter collection →
            </div>
          </div>
        );
      })()}

      {/* ambient markers hint */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.35em] text-primary/60">
        <span className="h-px w-8 bg-primary/40" />
        Hover a pin, click to enter
        <span className="h-px w-8 bg-primary/40" />
      </div>
    </div>
  );
}
