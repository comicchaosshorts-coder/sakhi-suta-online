
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_slides public read active" ON public.hero_slides FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "hero_slides admin all" ON public.hero_slides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.partner_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT NOT NULL,
  interested BOOLEAN NOT NULL DEFAULT true,
  budget TEXT,
  timeline TEXT,
  locality TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.partner_inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.partner_inquiries TO authenticated;
GRANT ALL ON public.partner_inquiries TO service_role;
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inquiries anyone submit" ON public.partner_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "inquiries admin read" ON public.partner_inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "inquiries admin update" ON public.partner_inquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "inquiries admin delete" ON public.partner_inquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials public read approved" ON public.testimonials FOR SELECT TO anon, authenticated USING (approved = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "testimonials anyone submit" ON public.testimonials FOR INSERT TO anon, authenticated WITH CHECK (approved = false);
CREATE POLICY "testimonials admin update" ON public.testimonials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "testimonials admin delete" ON public.testimonials FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_hero_slides_updated BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_inquiries_updated BEFORE UPDATE ON public.partner_inquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
