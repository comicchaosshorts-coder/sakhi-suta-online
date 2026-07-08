
-- =========================================================
-- ENUMS & ROLES
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending','paid','shipped','delivered','cancelled','failed');

-- =========================================================
-- USER ROLES (never store roles on profile)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- SITE SETTINGS (singleton)
-- =========================================================
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name TEXT NOT NULL DEFAULT 'Sakhi Suta',
  tagline TEXT NOT NULL DEFAULT 'Elegance Woven in Every Thread',
  logo_url TEXT,
  map_svg_url TEXT,
  color_primary TEXT NOT NULL DEFAULT '#D4AF37',
  color_bg TEXT NOT NULL DEFAULT '#0B0B0B',
  color_accent TEXT NOT NULL DEFAULT '#5C0A1A',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT UPDATE, INSERT ON public.site_settings TO authenticated;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update site settings" ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert site settings" ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_settings (id) VALUES (1);

-- =========================================================
-- STATES
-- =========================================================
CREATE TABLE public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  saree_types TEXT[] NOT NULL DEFAULT '{}',
  hero_image_url TEXT,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.states TO anon, authenticated;
GRANT ALL ON public.states TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.states TO authenticated;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads states" ON public.states FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage states" ON public.states FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed all 29 states
INSERT INTO public.states (name, slug, saree_types, description, display_order) VALUES
('Andhra Pradesh','andhra-pradesh', ARRAY['Uppada','Venkatagiri','Gadwal','Mangalagiri'], 'Handloom traditions from the Godavari.', 1),
('Arunachal Pradesh','arunachal-pradesh', ARRAY['Apatani Weave','Adi Textiles'], 'Tribal weaves from the eastern Himalayas.', 2),
('Assam','assam', ARRAY['Muga Silk','Pat Silk','Mekhela Chador'], 'Golden Muga silk woven along the Brahmaputra.', 3),
('Bihar','bihar', ARRAY['Bhagalpuri Silk','Tussar'], 'Bhagalpur silks with earthy hues.', 4),
('Chhattisgarh','chhattisgarh', ARRAY['Kosa Silk','Champa Silk'], 'Rustic Kosa silks of central India.', 5),
('Goa','goa', ARRAY['Kunbi Weave'], 'Coastal Kunbi checks and coral tones.', 6),
('Gujarat','gujarat', ARRAY['Bandhani','Patola','Ashavali','Gharchola'], 'Double-ikat Patola and tie-dye Bandhani.', 7),
('Haryana','haryana', ARRAY['Phulkari Inspired','Daabu Print'], 'Bold Phulkari accents and floral prints.', 8),
('Himachal Pradesh','himachal-pradesh', ARRAY['Kullu Weave','Kinnauri'], 'Highland wool-blend drapes.', 9),
('Jharkhand','jharkhand', ARRAY['Tussar','Kuchai Silk'], 'Wild Tussar silks of the forest belt.', 10),
('Karnataka','karnataka', ARRAY['Mysore Silk','Ilkal','Molakalmuru'], 'Regal Mysore silks with pure gold zari.', 11),
('Kerala','kerala', ARRAY['Kasavu','Balaramapuram','Kuthampally'], 'Ivory-and-gold Kasavu of the backwaters.', 12),
('Madhya Pradesh','madhya-pradesh', ARRAY['Chanderi','Maheshwari'], 'Sheer Chanderi and reversible Maheshwari.', 13),
('Maharashtra','maharashtra', ARRAY['Paithani','Nauvari'], 'Peacock-motif Paithani nine-yard drapes.', 14),
('Manipur','manipur', ARRAY['Moirang Phee','Phanek'], 'Temple motifs from the Loktak plains.', 15),
('Meghalaya','meghalaya', ARRAY['Ryndia','Eri Silk'], 'Handspun Eri silks of the Khasi hills.', 16),
('Mizoram','mizoram', ARRAY['Puan Weave'], 'Rhythmic Puan geometry.', 17),
('Nagaland','nagaland', ARRAY['Naga Shawl Inspired'], 'Warrior motifs reimagined as drape.', 18),
('Odisha','odisha', ARRAY['Sambalpuri','Bomkai','Berhampuri','Kotpad'], 'Ikat and temple-tribal weaves.', 19),
('Punjab','punjab', ARRAY['Phulkari','Salwar-Style Drape'], 'Mirror-bright Phulkari.', 20),
('Rajasthan','rajasthan', ARRAY['Kota Doria','Leheriya','Bandhej'], 'Airy Kota Doria and rippling Leheriya.', 21),
('Sikkim','sikkim', ARRAY['Lepcha Weave'], 'Monastery-inspired weaves.', 22),
('Tamil Nadu','tamil-nadu', ARRAY['Kanchipuram','Arani','Chettinad','Kovai Kora'], 'Temple-grade Kanchipuram silk.', 23),
('Telangana','telangana', ARRAY['Pochampally Ikat','Gadwal','Narayanpet'], 'Pochampally geometry and Gadwal borders.', 24),
('Tripura','tripura', ARRAY['Risa Weave','Pachra'], 'Bamboo-loom motifs.', 25),
('Uttar Pradesh','uttar-pradesh', ARRAY['Banarasi','Jamdani','Tanchoi','Jangla'], 'Opulent Banarasi brocades of the Ganga.', 26),
('Uttarakhand','uttarakhand', ARRAY['Pankhi Weave','Panchachuli'], 'Wool-cotton weaves from the hills.', 27),
('West Bengal','west-bengal', ARRAY['Baluchari','Tant','Jamdani','Garad'], 'Storytelling Baluchari and airy Tant.', 28),
('Delhi','delhi', ARRAY['Contemporary Fusion'], 'Modern couture reinterpretations.', 29);

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_inr INT NOT NULL CHECK (price_inr >= 0),
  compare_at_price_inr INT,
  description TEXT NOT NULL DEFAULT '',
  fabric TEXT,
  occasion TEXT,
  origin TEXT,
  work TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  state_id UUID REFERENCES public.states(id) ON DELETE SET NULL,
  saree_type TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads in-stock products" ON public.products FOR SELECT TO anon, authenticated USING (in_stock = true);
CREATE POLICY "Admins read all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- WISHLIST
-- =========================================================
CREATE TABLE public.wishlist (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlist FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users insert own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  subtotal_inr INT NOT NULL,
  shipping_inr INT NOT NULL DEFAULT 0,
  total_inr INT NOT NULL,
  shipping_address JSONB NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pending orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update all orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
