
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "Admins write product-images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read brand-assets" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'brand-assets');
CREATE POLICY "Admins write brand-assets" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));
