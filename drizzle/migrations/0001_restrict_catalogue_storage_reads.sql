DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read brand-assets" ON storage.objects;

CREATE POLICY "Owners and admins read product-images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-images'
  AND (owner_id = (select auth.uid()::text) OR public.has_role((select auth.uid()), 'admin'))
);

CREATE POLICY "Owners and admins read brand-assets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (owner_id = (select auth.uid()::text) OR public.has_role((select auth.uid()), 'admin'))
);