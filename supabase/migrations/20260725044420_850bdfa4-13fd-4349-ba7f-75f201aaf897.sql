INSERT INTO public.states (name, slug, saree_types, description, display_order)
VALUES (
  'Ladakh',
  'ladakh',
  ARRAY['Pashmina', 'Kani Shawl', 'Ladakhi Wool'],
  'High-altitude weaves from the cold desert — Pashmina and Kani textiles crafted in the trans-Himalayan region.',
  31
);

UPDATE public.states
SET display_order = display_order + 1
WHERE slug = 'jammu-and-kashmir' AND display_order >= 30;

UPDATE public.states
SET display_order = 30
WHERE slug = 'jammu-and-kashmir';