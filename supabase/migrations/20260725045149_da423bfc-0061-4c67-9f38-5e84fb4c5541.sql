
-- Fix orders update policy: add WITH CHECK to prevent privilege/state escalation
DROP POLICY IF EXISTS "Users update own pending orders" ON public.orders;
CREATE POLICY "Users update own pending orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Fix reviews: hide user_id column from anonymous readers via column-level privileges
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, product_id, rating, body, created_at) ON public.reviews TO anon;

-- Fix always-true INSERT policy on partner_inquiries: require non-empty core fields
DROP POLICY IF EXISTS "inquiries anyone submit" ON public.partner_inquiries;
CREATE POLICY "inquiries anyone submit"
  ON public.partner_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) > 0
    AND length(btrim(phone)) > 0
    AND length(btrim(address)) > 0
    AND length(btrim(experience)) > 0
  );
