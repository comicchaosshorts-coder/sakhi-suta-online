import { Droplets, Flame, Ban, Wind, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CareKey } from "@/lib/product-care-values";
export { CARE_VALUES } from "@/lib/product-care-values";
export type { CareKey };

export const CARE_CATEGORIES = [
  {
    key: "washing_care" as const,
    label: "Washing",
    icon: Droplets as LucideIcon,
    options: [
      { value: "not_specified", label: "Not Specified" },
      { value: "dry_wash", label: "Dry Wash Only" },
      { value: "hand_wash", label: "Hand Wash Only" },
      { value: "dry_and_hand_wash", label: "Dry Wash & Hand Wash" },
      { value: "machine_gentle", label: "Machine Wash — Gentle Cycle" },
      { value: "machine_normal", label: "Machine Wash — Normal Cycle" },
    ],
  },
  {
    key: "ironing_care" as const,
    label: "Ironing",
    icon: Flame as LucideIcon,
    options: [
      { value: "not_specified", label: "Not Specified" },
      { value: "do_not_iron", label: "Do Not Iron" },
      { value: "low", label: "Low Temperature" },
      { value: "medium", label: "Medium Temperature" },
      { value: "high", label: "High Temperature" },
    ],
  },
  {
    key: "bleaching_care" as const,
    label: "Bleaching",
    icon: Ban as LucideIcon,
    options: [
      { value: "not_specified", label: "Not Specified" },
      { value: "do_not_bleach", label: "Do Not Bleach" },
      { value: "non_chlorine_only", label: "Non-Chlorine Bleach Only" },
      { value: "bleach_allowed", label: "Bleach Allowed" },
    ],
  },
  {
    key: "drying_care" as const,
    label: "Drying",
    icon: Wind as LucideIcon,
    options: [
      { value: "not_specified", label: "Not Specified" },
      { value: "no_tumble_dry", label: "Do Not Tumble Dry" },
      { value: "tumble_low", label: "Tumble Dry — Low Heat" },
      { value: "tumble_medium", label: "Tumble Dry — Medium Heat" },
      { value: "air_dry", label: "Air Dry" },
      { value: "dry_shade", label: "Dry in Shade" },
      { value: "line_dry", label: "Line Dry" },
    ],
  },
  {
    key: "storage_care" as const,
    label: "Storage",
    icon: Package as LucideIcon,
    options: [
      { value: "not_specified", label: "Not Specified" },
      { value: "cool_dry_place", label: "Store in a Cool, Dry Place" },
      { value: "away_from_sunlight", label: "Store Away from Direct Sunlight" },
      { value: "muslin_cloth", label: "Store in a Muslin/Cotton Cloth" },
      { value: "fold_flat", label: "Fold and Store Flat" },
      { value: "hang_carefully", label: "Hang Carefully" },
    ],
  },
];

export function careLabel(key: CareKey, value: string | null | undefined) {
  const cat = CARE_CATEGORIES.find((c) => c.key === key);
  return cat?.options.find((o) => o.value === value)?.label ?? null;
}

export type CareSource = Partial<Record<CareKey, string | null>> & {
  care_note?: string | null;
};

export function configuredCare(p: CareSource) {
  return CARE_CATEGORIES.filter(
    (c) => p[c.key] && p[c.key] !== "not_specified" && careLabel(c.key, p[c.key]),
  ).map((c) => ({
    key: c.key,
    label: c.label,
    icon: c.icon,
    value: careLabel(c.key, p[c.key])!,
  }));
}
