CREATE TABLE public.main_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_url text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  opens_saree_categories boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT main_categories_name_length CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT main_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
GRANT SELECT ON public.main_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.main_categories TO authenticated;
GRANT ALL ON public.main_categories TO service_role;
ALTER TABLE public.main_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled main categories" ON public.main_categories FOR SELECT TO anon, authenticated USING (enabled = true OR public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can insert main categories" ON public.main_categories FOR INSERT TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can update main categories" ON public.main_categories FOR UPDATE TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can delete main categories" ON public.main_categories FOR DELETE TO authenticated USING (public.has_role((select auth.uid()), 'admin'));
CREATE TRIGGER main_categories_updated_at BEFORE UPDATE ON public.main_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.saree_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_url text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saree_categories_name_length CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT saree_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
GRANT SELECT ON public.saree_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.saree_categories TO authenticated;
GRANT ALL ON public.saree_categories TO service_role;
ALTER TABLE public.saree_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled saree categories" ON public.saree_categories FOR SELECT TO anon, authenticated USING (enabled = true OR public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can insert saree categories" ON public.saree_categories FOR INSERT TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can update saree categories" ON public.saree_categories FOR UPDATE TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can delete saree categories" ON public.saree_categories FOR DELETE TO authenticated USING (public.has_role((select auth.uid()), 'admin'));
CREATE TRIGGER saree_categories_updated_at BEFORE UPDATE ON public.saree_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.products ADD COLUMN main_category_id uuid REFERENCES public.main_categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN saree_category_id uuid REFERENCES public.saree_categories(id) ON DELETE SET NULL;
CREATE INDEX products_main_category_id_idx ON public.products(main_category_id);
CREATE INDEX products_saree_category_id_idx ON public.products(saree_category_id);

CREATE OR REPLACE FUNCTION public.validate_product_category_mapping()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE is_saree boolean;
BEGIN
  IF NEW.saree_category_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.main_category_id IS NULL THEN RAISE EXCEPTION 'A saree category requires a main category'; END IF;
  SELECT opens_saree_categories INTO is_saree FROM public.main_categories WHERE id = NEW.main_category_id;
  IF COALESCE(is_saree, false) = false THEN RAISE EXCEPTION 'A saree category can only be assigned under Sarees'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_product_category_mapping_before_write BEFORE INSERT OR UPDATE OF main_category_id, saree_category_id ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_product_category_mapping();

CREATE TABLE public.benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  text text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'sparkles',
  image_url text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT benefits_name_length CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT benefits_text_length CHECK (char_length(text) <= 240),
  CONSTRAINT benefits_icon_length CHECK (char_length(icon) BETWEEN 1 AND 40)
);
GRANT SELECT ON public.benefits TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.benefits TO authenticated;
GRANT ALL ON public.benefits TO service_role;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled benefits" ON public.benefits FOR SELECT TO anon, authenticated USING (enabled = true OR public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can insert benefits" ON public.benefits FOR INSERT TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can update benefits" ON public.benefits FOR UPDATE TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can delete benefits" ON public.benefits FOR DELETE TO authenticated USING (public.has_role((select auth.uid()), 'admin'));
CREATE TRIGGER benefits_updated_at BEFORE UPDATE ON public.benefits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();