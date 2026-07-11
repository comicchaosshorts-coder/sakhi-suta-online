INSERT INTO public.states (name, slug, saree_types, description, display_order)
VALUES ('Jammu and Kashmir','jammu-and-kashmir', ARRAY['Kani','Pashmina','Kashmiri Silk','Aari Embroidery'],'Pashmina softness and Kani finesse from the Valley.',30)
ON CONFLICT (slug) DO NOTHING;