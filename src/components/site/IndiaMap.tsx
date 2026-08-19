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

// Aliases: SVG uses colonial/legacy names; DB may use modern slugs.
const ALIASES: Record<string, string[]> = {
  odisha: ["orissa"],
  uttarakhand: ["uttaranchal"],
  "jammu-and-kashmir": ["jammu & kashmir", "jk"],
  ladakh: ["ladakh"],
  "dadra-and-nagar-haveli": ["dadra & nagar haveli"],
  "daman-and-diu": ["daman & diu"],
  "andaman-and-nicobar": ["andaman & nicobar", "andaman and nicobar islands"],
  lakshadweep: ["lakshadweep"],
  puducherry: ["pondicherry", "pudducherry"],
  delhi: ["nct of delhi", "national capital territory of delhi"],
};

const norm = (s: string) => s.toLowerCase().replace(/[_\s&.]+/g, "-").replace(/-+/g, "-").trim();

// Deterministic distinct colour per state slug
function hashOf(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function colorFor(slug: string, opts?: { hover?: boolean }) {
  const h = hashOf(slug);
  const hue = h % 360;
  const chroma = 0.09 + ((h >> 9) % 5) * 0.012;
  const light = 0.74 + ((h >> 5) % 4) * 0.035;
  return opts?.hover
    ? `oklch(${(light - 0.1).toFixed(3)} ${(chroma + 0.06).toFixed(3)} ${hue})`
    : `oklch(${light.toFixed(3)} ${chroma.toFixed(3)} ${hue})`;
}

export function IndiaMap({ states, compact = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [hover, setHover] = useState<StateInfo | null>(null);

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

    const shapes = svgEl.querySelectorAll<SVGPathElement>("path[id]");
    const cleanup: Array<() => void> = [];

    shapes.forEach((el) => {
      const rawId = el.getAttribute("id") ?? "";
      const match = stateByKey.get(norm(rawId));
      if (!match) return;

      const base = colorFor(match.slug);
      const hot = colorFor(match.slug, { hover: true });

      el.setAttribute("data-slug", match.slug);
      el.style.cursor = "pointer";
      el.style.transition = "fill 250ms ease, filter 250ms ease, stroke 250ms ease";
      el.style.fill = base;
      el.style.stroke = "oklch(0.35 0.02 40 / 0.55)";
      el.style.strokeWidth = "0.6";

      const setHoverState = (on: boolean) => {
        el.style.fill = on ? hot : base;
        el.style.filter = on ? "brightness(1.03) drop-shadow(0 1px 4px oklch(0.35 0.05 30 / 0.35))" : "";
      };

      const onEnter = () => { setHoverState(true); setHover(match); };
      const onLeave = () => { setHoverState(false); setHover((h) => (h?.slug === match.slug ? null : h)); };
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

    return () => cleanup.forEach((f) => f());
  }, [stateByKey, navigate]);

  return (
    <div className="relative w-full" style={{ maxHeight: compact ? 320 : "80vh" }}>
      <div
        ref={wrapRef}
        className="relative w-full [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        style={{ maxHeight: compact ? 320 : "78vh" }}
      />

      {/* Hover detail panel */}
      {hover && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl glass px-4 py-3 shadow-[var(--shadow-gold)]">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary/70">Region</div>
          <div className="font-serif text-xl text-primary">{hover.name}</div>
          {hover.saree_types && hover.saree_types.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {hover.saree_types.slice(0, 4).join(" · ")}
            </div>
          )}
          <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-foreground/60">
            Click to enter collection →
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.35em] text-primary/60">
        <span className="h-px w-8 bg-primary/40" />
        Tap a state to enter
        <span className="h-px w-8 bg-primary/40" />
      </div>
    </div>
  );
}
