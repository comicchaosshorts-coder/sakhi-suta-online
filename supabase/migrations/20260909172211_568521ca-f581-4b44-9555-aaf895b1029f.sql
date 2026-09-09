CREATE TABLE public.category_tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.category_tiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_tiles TO authenticated;
GRANT ALL ON public.category_tiles TO service_role;
ALTER TABLE public.category_tiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active category tiles" ON public.category_tiles FOR SELECT USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage category tiles" ON public.category_tiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER category_tiles_updated_at BEFORE UPDATE ON public.category_tiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.homepage_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('new_arrivals','best_sellers')),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section, product_id)
);
GRANT SELECT ON public.homepage_picks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_picks TO authenticated;
GRANT ALL ON public.homepage_picks TO service_role;
ALTER TABLE public.homepage_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view homepage picks" ON public.homepage_picks FOR SELECT USING (true);
CREATE POLICY "Admins manage homepage picks" ON public.homepage_picks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER homepage_picks_updated_at BEFORE UPDATE ON public.homepage_picks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();