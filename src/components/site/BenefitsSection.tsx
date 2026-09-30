import { useQuery } from "@tanstack/react-query";
import { Clock3, RefreshCcw, Sparkles, Truck, WalletCards } from "lucide-react";
import { listBenefits } from "@/lib/benefits.functions";
import logoAsset from "@/assets/sakhi-suta-logo.png.asset.json";

const icons = {
  clock: Clock3,
  truck: Truck,
  wallet: WalletCards,
  refresh: RefreshCcw,
  sparkles: Sparkles,
};

export function BenefitsSection() {
  const { data: benefits = [] } = useQuery({
    queryKey: ["benefits"],
    queryFn: () => listBenefits(),
    staleTime: 5 * 60 * 1000,
  });
  if (benefits.length === 0) return null;

  return (
    <section className="border-y border-border bg-cream text-foreground">
      <div className="relative mx-auto max-w-6xl px-3 py-14 min-[380px]:px-4 md:px-8 md:py-20">
        <div className="grid grid-cols-2">
          {benefits.map((benefit, index) => {
            const Icon = icons[benefit.icon as keyof typeof icons] ?? Sparkles;
            return (
              <div
                key={benefit.id}
                className={`flex min-h-40 min-w-0 flex-col items-center justify-center py-7 text-center md:min-h-52 md:px-10 ${
                  index % 2 === 0 ? "pl-1 pr-9 min-[380px]:pl-3 min-[380px]:pr-11" : "pl-9 pr-1 min-[380px]:pl-11 min-[380px]:pr-3"
                } ${
                  index % 2 === 1 ? "border-l border-foreground/15" : ""
                } ${benefits.length >= 4 && index >= 2 ? "border-t border-foreground/15" : ""}`}
              >
                {benefit.image_url ? (
                  <img src={benefit.image_url} alt="" className="h-8 w-8 shrink-0 object-contain min-[380px]:h-9 min-[380px]:w-9 md:h-11 md:w-11" />
                ) : (
                  <Icon className="h-7 w-7 shrink-0 stroke-[1.25] text-primary min-[380px]:h-8 min-[380px]:w-8 md:h-10 md:w-10" aria-hidden="true" />
                )}
                <h2 className="mt-3 max-w-full break-words font-serif text-base font-semibold leading-tight min-[380px]:mt-4 min-[380px]:text-lg md:text-2xl">
                  {benefit.name}
                </h2>
                {benefit.text && (
                  <p className="mt-2 max-w-full break-words text-[11px] leading-relaxed text-foreground/65 min-[380px]:text-xs md:max-w-xs md:text-sm">
                    {benefit.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream p-1.5 min-[380px]:p-2 md:p-3">
          <img
            src={logoAsset.url}
            alt="Sakhi Suta — Weaving Bonds, Celebrating Women"
            className="h-14 w-14 object-contain min-[380px]:h-16 min-[380px]:w-16 md:h-24 md:w-24"
          />
        </div>
      </div>
    </section>
  );
}