-- ============ DISCOUNT SETTINGS (singleton) ============
CREATE TABLE public.discount_settings (
  id integer PRIMARY KEY DEFAULT 1,
  auto_enabled boolean NOT NULL DEFAULT true,
  auto_min_subtotal_inr integer NOT NULL DEFAULT 1000,
  auto_percent numeric(5,2) NOT NULL DEFAULT 5.00,
  auto_max_discount_inr integer,
  auto_start_at timestamptz,
  auto_end_at timestamptz,
  auto_product_ids uuid[] NOT NULL DEFAULT '{}',
  auto_saree_types text[] NOT NULL DEFAULT '{}',
  returning_enabled boolean NOT NULL DEFAULT true,
  returning_percent numeric(5,2) NOT NULL DEFAULT 2.50,
  returning_min_subtotal_inr integer NOT NULL DEFAULT 0,
  returning_max_discount_inr integer,
  returning_min_orders integer NOT NULL DEFAULT 1,
  returning_start_at timestamptz,
  returning_end_at timestamptz,
  returning_product_ids uuid[] NOT NULL DEFAULT '{}',
  returning_saree_types text[] NOT NULL DEFAULT '{}',
  stack_auto_with_coupon boolean NOT NULL DEFAULT false,
  stack_returning_with_coupon boolean NOT NULL DEFAULT false,
  stack_returning_with_campaign boolean NOT NULL DEFAULT false,
  stack_campaign_with_coupon boolean NOT NULL DEFAULT false,
  stack_auto_with_returning boolean NOT NULL DEFAULT false,
  stack_auto_with_campaign boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discount_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.discount_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.discount_settings TO authenticated;
GRANT ALL ON public.discount_settings TO service_role;
ALTER TABLE public.discount_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discount settings public read" ON public.discount_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "discount settings admin insert" ON public.discount_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "discount settings admin update" ON public.discount_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_discount_settings_updated BEFORE UPDATE ON public.discount_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.discount_settings (id) VALUES (1);

-- ============ CAMPAIGNS ============
CREATE TABLE public.discount_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  percent numeric(5,2) NOT NULL DEFAULT 0,
  fixed_inr integer NOT NULL DEFAULT 0,
  min_subtotal_inr integer NOT NULL DEFAULT 0,
  max_discount_inr integer,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  saree_types text[] NOT NULL DEFAULT '{}',
  audience text NOT NULL DEFAULT 'all',
  start_at timestamptz,
  end_at timestamptz,
  active boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  stackable boolean NOT NULL DEFAULT false,
  overrides_other_discounts boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_audience_valid CHECK (audience IN ('all','first_order','returning')),
  CONSTRAINT campaign_percent_range CHECK (percent >= 0 AND percent <= 100),
  CONSTRAINT campaign_fixed_nonneg CHECK (fixed_inr >= 0)
);
CREATE INDEX idx_campaigns_active ON public.discount_campaigns (active, start_at, end_at);
GRANT SELECT ON public.discount_campaigns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discount_campaigns TO authenticated;
GRANT ALL ON public.discount_campaigns TO service_role;
ALTER TABLE public.discount_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns public read active" ON public.discount_campaigns FOR SELECT TO anon, authenticated USING (active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "campaigns admin write" ON public.discount_campaigns FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.discount_campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COUPONS ============
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  percent numeric(5,2) NOT NULL DEFAULT 0,
  fixed_inr integer NOT NULL DEFAULT 0,
  max_discount_inr integer,
  min_cart_inr integer NOT NULL DEFAULT 0,
  max_cart_inr integer,
  audience text NOT NULL DEFAULT 'all',
  product_ids uuid[] NOT NULL DEFAULT '{}',
  saree_types text[] NOT NULL DEFAULT '{}',
  usage_limit integer,
  per_customer_limit integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  start_at timestamptz,
  end_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  combine_with_auto boolean NOT NULL DEFAULT false,
  combine_with_campaign boolean NOT NULL DEFAULT false,
  combine_with_returning boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  campaign_id uuid REFERENCES public.discount_campaigns(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_code_unique UNIQUE (code),
  CONSTRAINT coupon_audience_valid CHECK (audience IN ('all','first_order','returning')),
  CONSTRAINT coupon_percent_range CHECK (percent >= 0 AND percent <= 100),
  CONSTRAINT coupon_fixed_nonneg CHECK (fixed_inr >= 0),
  CONSTRAINT coupon_used_nonneg CHECK (used_count >= 0)
);
CREATE INDEX idx_coupons_lookup ON public.coupons (code) WHERE archived = false;
CREATE INDEX idx_coupons_campaign ON public.coupons (campaign_id);
-- Coupons are never read directly by shoppers; validation happens server-side.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons admin only" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REDEMPTIONS ============
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  coupon_code text NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_inr integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT redemption_status_valid CHECK (status IN ('reserved','consumed','released')),
  CONSTRAINT redemption_order_unique UNIQUE (coupon_id, order_id)
);
CREATE INDEX idx_redemptions_coupon ON public.coupon_redemptions (coupon_id, status);
CREATE INDEX idx_redemptions_user ON public.coupon_redemptions (user_id, coupon_id);
CREATE INDEX idx_redemptions_created ON public.coupon_redemptions (created_at);
GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions own read" ON public.coupon_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "redemptions admin read" ON public.coupon_redemptions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ ORDER SNAPSHOT ============
ALTER TABLE public.orders
  ADD COLUMN discount_inr integer NOT NULL DEFAULT 0,
  ADD COLUMN discount_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN coupon_code text;

-- ============ AUDIT LOG ============
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.admin_audit_log (created_at DESC);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.admin_audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ ATOMIC COUPON RESERVATION ============
CREATE OR REPLACE FUNCTION public.reserve_coupon(_coupon_id uuid, _user_id uuid, _order_id uuid, _discount_inr integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons;
  active_uses integer;
  user_uses integer;
  new_id uuid;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE id = _coupon_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'COUPON_NOT_FOUND'; END IF;
  IF c.archived OR NOT c.active THEN RAISE EXCEPTION 'COUPON_INACTIVE'; END IF;
  IF c.start_at IS NOT NULL AND now() < c.start_at THEN RAISE EXCEPTION 'COUPON_NOT_STARTED'; END IF;
  IF c.end_at IS NOT NULL AND now() > c.end_at THEN RAISE EXCEPTION 'COUPON_EXPIRED'; END IF;

  SELECT count(*) INTO active_uses FROM public.coupon_redemptions
    WHERE coupon_id = _coupon_id AND status <> 'released';
  IF c.usage_limit IS NOT NULL AND active_uses >= c.usage_limit THEN
    RAISE EXCEPTION 'COUPON_LIMIT_REACHED';
  END IF;

  SELECT count(*) INTO user_uses FROM public.coupon_redemptions
    WHERE coupon_id = _coupon_id AND user_id = _user_id AND status <> 'released';
  IF c.per_customer_limit IS NOT NULL AND user_uses >= c.per_customer_limit THEN
    RAISE EXCEPTION 'COUPON_USER_LIMIT_REACHED';
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, coupon_code, user_id, order_id, discount_inr, status)
  VALUES (_coupon_id, c.code, _user_id, _order_id, _discount_inr, 'reserved')
  RETURNING id INTO new_id;

  UPDATE public.coupons SET used_count = active_uses + 1 WHERE id = _coupon_id;
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_coupon(uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_coupon(uuid, uuid, uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.settle_coupon_redemption(_order_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF _status NOT IN ('consumed','released') THEN RAISE EXCEPTION 'BAD_STATUS'; END IF;
  FOR r IN SELECT * FROM public.coupon_redemptions WHERE order_id = _order_id AND status = 'reserved' LOOP
    UPDATE public.coupon_redemptions SET status = _status WHERE id = r.id;
    IF _status = 'released' THEN
      UPDATE public.coupons
        SET used_count = greatest(0, (SELECT count(*) FROM public.coupon_redemptions WHERE coupon_id = r.coupon_id AND status <> 'released'))
        WHERE id = r.coupon_id;
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.settle_coupon_redemption(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_coupon_redemption(uuid, text) TO service_role;