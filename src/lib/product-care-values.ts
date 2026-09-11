export const CARE_VALUES = {
  washing_care: [
    "not_specified",
    "dry_wash",
    "hand_wash",
    "dry_and_hand_wash",
    "machine_gentle",
    "machine_normal",
  ],
  ironing_care: ["not_specified", "do_not_iron", "low", "medium", "high"],
  bleaching_care: ["not_specified", "do_not_bleach", "non_chlorine_only", "bleach_allowed"],
  drying_care: [
    "not_specified",
    "no_tumble_dry",
    "tumble_low",
    "tumble_medium",
    "air_dry",
    "dry_shade",
    "line_dry",
  ],
  storage_care: [
    "not_specified",
    "cool_dry_place",
    "away_from_sunlight",
    "muslin_cloth",
    "fold_flat",
    "hang_carefully",
  ],
} as const;

export type CareKey = keyof typeof CARE_VALUES;
