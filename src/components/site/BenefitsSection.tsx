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
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className={benefits.length >= 4 ? "grid grid-cols-2" : "grid grid-cols-2"}>
          {benefits.map((benefit, index) => {
            const Icon = icons[benefit.icon as keyof typeof icons] ?? Sparkles;
            return (
              <div
                key={benefit.id}
                className={`flex min-h-40 flex-col items-center justify-center px-4 py-7 text-center md:min-h-52 md:px-10 ${
                  index % 2 === 1 ? "border-l border-foreground/15" : ""
                } ${benefits.length >= 4 && index >= 2 ? "border-t border-foreground/15" : ""}`}
              >
                {benefit.image_url ? (
                  <img src={benefit.image_url} alt="" className="h-9 w-9 object-contain md:h-11 md:w-11" />
                ) : (
                  <Icon className="h-8 w-8 stroke-[1.25] text-primary md:h-10 md:w-10" aria-hidden="true" />
                )}
                <h2 className="mt-4 font-serif text-lg font-semibold md:text-2xl">{benefit.name}</h2>
                {benefit.text && <p className="mt-2 max-w-xs text-xs leading-relaxed text-foreground/65 md:text-sm">{benefit.text}</p>}
              </div>
            );
          })}
        </div>
        <div className="relative mx-auto -mt-2 grid w-fit place-items-center rounded-full bg-cream p-3 md:-mt-4">
          <img
            src={logoAsset.url}
            alt="Sakhi Suta — Weaving Bonds, Celebrating Women"
            className="h-20 w-20 object-contain md:h-28 md:w-28"
          />
        </div>
      </div>
    </section>
  );
}