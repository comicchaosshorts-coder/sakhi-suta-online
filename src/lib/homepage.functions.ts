import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, resolveImage } from "./supabase-public.server";

// ---- HERO SLIDES (public read) ----
export const listHeroSlides = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id,image_url,caption,link_url,display_order")
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  return await Promise.all(
    rows.map(async (r) => ({ ...r, image_url: await resolveImage(supabase, r.image_url) })),
  );
});

// ---- TESTIMONIALS (public read approved) ----
export const listTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("id,name,message,created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
});

export const submitTestimonial = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        message: z.string().trim().min(3).max(1000),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { error } = await supabase
      .from("testimonials")
      .insert({ name: data.name, message: data.message, approved: false });
    if (error) throw error;
    return { ok: true };
  });

// ---- PARTNER INQUIRIES (anyone can submit) ----
export const submitPartnerInquiry = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        address: z.string().trim().min(1).max(500),
        phone: z.string().trim().min(4).max(30),
        experience: z.enum(["beginner", "experienced"]),
        interested: z.boolean(),
        budget: z.string().trim().max(120).optional().nullable(),
        timeline: z.string().trim().max(120).optional().nullable(),
        locality: z.string().trim().max(200).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { error } = await supabase.from("partner_inquiries").insert({
      name: data.name,
      address: data.address,
      phone: data.phone,
      experience: data.experience,
      interested: data.interested,
      budget: data.budget || null,
      timeline: data.timeline || null,
      locality: data.locality || null,
    });
    if (error) throw error;
    return { ok: true };
  });
