CREATE TABLE public.promo_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('announcement','marquee','usp')),
  text text NOT NULL,
  subtext text,
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_content TO authenticated;
GRANT ALL ON public.promo_content TO service_role;

ALTER TABLE public.promo_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo public read active" ON public.promo_content
  FOR SELECT TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "promo admin all" ON public.promo_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER promo_content_updated_at
  BEFORE UPDATE ON public.promo_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS promo_banner_url text;

INSERT INTO public.promo_content (kind, text, subtext, display_order) VALUES
  ('announcement', 'Handloom Elegance, Woven by Master Artisans', NULL, 1),
  ('announcement', 'Free shipping across India', NULL, 2),
  ('announcement', 'Secure prepaid checkout — UPI, Cards & Netbanking', NULL, 3),
  ('marquee', 'FESTIVE EDIT IS LIVE', NULL, 1),
  ('marquee', 'FREE SHIPPING ON ALL PREPAID ORDERS', NULL, 2),
  ('marquee', 'HANDLOOM SAREES FROM EVERY STATE OF INDIA', NULL, 3),
  ('usp', 'Handloom Ethnic Wear', 'Woven by master artisans', 1),
  ('usp', 'Assured Quality', 'Loved by happy buyers', 2),
  ('usp', 'Free Shipping in India', 'Dispatched with care', 3),
  ('usp', 'Secure Checkout', '100% purchase protection', 4);