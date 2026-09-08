ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS mobile_image_url text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS button_text text,
  ADD COLUMN IF NOT EXISTS button_link text,
  ADD COLUMN IF NOT EXISTS banner_type text NOT NULL DEFAULT 'image_only';