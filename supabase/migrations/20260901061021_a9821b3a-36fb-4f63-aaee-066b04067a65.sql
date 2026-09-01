-- 1. New order stages
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'packed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'refunded';

-- 2. Orders: payment status separate from operational status + archive flag
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE public.orders
  SET payment_status = 'paid',
      paid_at = COALESCE(paid_at, updated_at)
  WHERE razorpay_payment_id IS NOT NULL
     OR status::text IN ('paid','shipped','delivered');

CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders (status, created_at);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);

-- 3. Order status history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx
  ON public.order_status_history (order_id, created_at);

GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own order history" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins read all order history" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin notifications (one per order+type)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_name text,
  item_count integer NOT NULL DEFAULT 0,
  amount_inr integer NOT NULL DEFAULT 0,
  payment_status text,
  order_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_notifications_order_type_uidx
  ON public.admin_notifications (order_id, type);
CREATE INDEX IF NOT EXISTS admin_notifications_created_idx
  ON public.admin_notifications (created_at DESC);

GRANT SELECT ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read notifications" ON public.admin_notifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Per-admin read state
CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
  notification_id uuid NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, admin_id)
);
GRANT SELECT, INSERT, DELETE ON public.admin_notification_reads TO authenticated;
GRANT ALL ON public.admin_notification_reads TO service_role;
ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read own read-state" ON public.admin_notification_reads
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins mark own read-state" ON public.admin_notification_reads
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins clear own read-state" ON public.admin_notification_reads
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

-- 6. History + notification triggers (authoritative, server-side)
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status::text, NEW.user_id);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_history_ins ON public.orders;
CREATE TRIGGER trg_orders_status_history_ins
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

DROP TRIGGER IF EXISTS trg_orders_status_history_upd ON public.orders;
CREATE TRIGGER trg_orders_status_history_upd
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

CREATE OR REPLACE FUNCTION public.notify_admins_on_order_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kind text;
  cust text;
  n_items integer;
BEGIN
  IF NEW.payment_status = 'paid' AND COALESCE(OLD.payment_status, 'unpaid') <> 'paid' THEN
    kind := 'NEW_ORDER';
  ELSIF NEW.payment_status = 'refunded' AND COALESCE(OLD.payment_status, 'unpaid') <> 'refunded' THEN
    kind := 'ORDER_REFUNDED';
  ELSIF NEW.status::text = 'cancelled' AND OLD.status::text <> 'cancelled'
        AND COALESCE(OLD.payment_status, 'unpaid') = 'paid' THEN
    kind := 'ORDER_CANCELLED';
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(NEW.shipping_address->>'full_name', p.full_name, 'Customer')
    INTO cust FROM public.profiles p WHERE p.id = NEW.user_id;
  IF cust IS NULL THEN
    cust := COALESCE(NEW.shipping_address->>'full_name', 'Customer');
  END IF;

  SELECT COALESCE(sum((i->>'quantity')::int), 0) INTO n_items
  FROM jsonb_array_elements(NEW.items) i;

  INSERT INTO public.admin_notifications
    (type, order_id, customer_name, item_count, amount_inr, payment_status, order_status)
  VALUES (kind, NEW.id, cust, COALESCE(n_items, 0), NEW.total_inr, NEW.payment_status, NEW.status::text)
  ON CONFLICT (order_id, type) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_admin_notify ON public.orders;
CREATE TRIGGER trg_orders_admin_notify
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_order_event();

-- 7. Realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.order_status_history REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
