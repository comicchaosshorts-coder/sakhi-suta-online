import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { ChevronUp, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site.functions";
import { parseSocialSettings, SOCIAL_PLATFORMS } from "@/lib/social-settings";

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z" /><path d="M8 7.5c-.6 0-1 1-.8 2 .6 3 3.7 5.6 6.5 6 .9.1 2-.6 2-1.2l-2.4-1.4-.9 1c-1.5-.6-2.5-1.6-3.1-3l.9-.8L9 7.5Z" /></svg>;
}
const icons = { whatsapp: WhatsAppIcon, facebook: Facebook, instagram: Instagram };

export function SocialLauncher() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const customerPage = !pathname.startsWith("/admin");
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => getSiteSettings(), staleTime: 300_000, enabled: customerPage });
  const settings = parseSocialSettings(data?.social_widget);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ side: "left", bottom: 16 });
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const links = settings ? SOCIAL_PLATFORMS.filter((platform) => settings[platform].enabled) : [];
  const visible = customerPage && settings?.enabled && links.length > 0;

  useEffect(() => { setOpen(false); }, [pathname, visible]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = open ? 52 + links.length * 64 : 52;
        const width = window.innerWidth;
        const viewHeight = window.visualViewport?.height ?? window.innerHeight;
        const safeBottom = Number.parseFloat(getComputedStyle(root.current ?? document.documentElement).getPropertyValue("--social-safe-bottom")) || 0;
        const obstacles = Array.from(document.querySelectorAll<HTMLElement>("button, input, textarea, select, a, [role='dialog']")).filter((el) => {
          if (root.current?.contains(el) || el.getClientRects().length === 0) return false;
          if (el.tagName !== "A") return true;
          const position = getComputedStyle(el).position;
          return position === "fixed" || position === "sticky" || /checkout|buy now|add to cart|payment|support|whatsapp/i.test(`${el.textContent} ${el.getAttribute("aria-label")}`);
        }).map((el) => el.getBoundingClientRect());
        const preferred = settings?.position ?? "left";
        for (let bottom = 16; bottom < Math.max(32, viewHeight - height - 96); bottom += 64) {
          for (const side of [preferred, preferred === "left" ? "right" : "left"]) {
            const left = side === "left" ? 16 : width - 68;
            const top = viewHeight - bottom - safeBottom - height;
            if (!obstacles.some((r) => r.left < left + 60 && r.right > left - 8 && r.top < top + height + 8 && r.bottom > top - 8)) {
              setPlacement((old) => old.side === side && old.bottom === bottom ? old : { side, bottom });
              return;
            }
          }
        }
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); window.visualViewport?.removeEventListener("resize", measure); };
  }, [visible, open, settings?.position, links.length, pathname]);

  if (!visible || !settings) return null;
  return (
    <div ref={root} className="social-launcher" data-side={placement.side} data-open={open} style={{ bottom: `calc(${placement.bottom}px + env(safe-area-inset-bottom, 0px))` }} aria-label="Sakhi Suta social links">
      <div id="sakhi-social-links" className="social-launcher-links" inert={!open} aria-hidden={!open}>
        {links.map((platform) => {
          const Icon = icons[platform];
          const label = platform === "whatsapp" ? "WhatsApp" : platform === "facebook" ? "Facebook" : "Instagram";
          return <Button key={platform} asChild size="icon" variant="outline" className="social-launcher-icon">
            <a href={settings[platform].url} target="_blank" rel="noopener noreferrer" aria-label={`Sakhi Suta on ${label} (opens in a new tab)`} title={label} onClick={() => { setOpen(false); toggle.current?.focus(); }}><Icon /></a>
          </Button>;
        })}
      </div>
      <Button ref={toggle} size="icon" className="social-launcher-toggle" aria-label={open ? "Close social links" : "Open social links"} aria-expanded={open} aria-controls="sakhi-social-links" title={open ? "Close social links" : "Social links"} onClick={() => setOpen((current) => !current)}><ChevronUp aria-hidden="true" /></Button>
    </div>
  );
}