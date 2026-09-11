ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS washing_care text NOT NULL DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS ironing_care text NOT NULL DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS bleaching_care text NOT NULL DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS drying_care text NOT NULL DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS storage_care text NOT NULL DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS care_note text;

ALTER TABLE public.products
  ADD CONSTRAINT products_washing_care_check CHECK (washing_care IN ('not_specified','dry_wash','hand_wash','dry_and_hand_wash','machine_gentle','machine_normal')),
  ADD CONSTRAINT products_ironing_care_check CHECK (ironing_care IN ('not_specified','do_not_iron','low','medium','high')),
  ADD CONSTRAINT products_bleaching_care_check CHECK (bleaching_care IN ('not_specified','do_not_bleach','non_chlorine_only','bleach_allowed')),
  ADD CONSTRAINT products_drying_care_check CHECK (drying_care IN ('not_specified','no_tumble_dry','tumble_low','tumble_medium','air_dry','dry_shade','line_dry')),
  ADD CONSTRAINT products_storage_care_check CHECK (storage_care IN ('not_specified','cool_dry_place','away_from_sunlight','muslin_cloth','fold_flat','hang_carefully')),
  ADD CONSTRAINT products_care_note_len_check CHECK (care_note IS NULL OR char_length(care_note) <= 300);