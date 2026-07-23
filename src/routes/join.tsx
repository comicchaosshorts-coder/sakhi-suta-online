import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitPartnerInquiry } from "@/lib/homepage.functions";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Connect with us — Sakhi Suta" },
      {
        name: "description",
        content:
          "Join the Sakhi Suta family. Tell us about yourself and we will reach out to weave a story together.",
      },
      { property: "og:title", content: "Connect with us — Sakhi Suta" },
      {
        property: "og:description",
        content: "Become a partner, stockist, or weaver-friend of the Sakhi Suta atelier.",
      },
    ],
  }),
  component: JoinPage,
});

type Form = {
  name: string;
  address: string;
  phone: string;
  experience: "beginner" | "experienced";
  interested: boolean;
  budget: string;
  timeline: string;
  locality: string;
};

const empty: Form = {
  name: "",
  address: "",
  phone: "",
  experience: "beginner",
  interested: true,
  budget: "",
  timeline: "",
  locality: "",
};

function JoinPage() {
  const [f, setF] = useState<Form>(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mut = useMutation({
    mutationFn: async () =>
      submitPartnerInquiry({
        data: {
          name: f.name.trim(),
          address: f.address.trim(),
          phone: f.phone.trim(),
          experience: f.experience,
          interested: f.interested,
          budget: f.budget.trim() || null,
          timeline: f.timeline.trim() || null,
          locality: f.locality.trim() || null,
        },
      }),
    onSuccess: () => {
      setDone(true);
      setF(empty);
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Could not submit"),
  });

  const upd = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 md:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">Weave with us</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          <span className="gold-text">Connect</span> with Sakhi Suta
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          Whether you are a beginner curious about the world of sarees or an experienced hand
          ready to grow with us — share a few details and we will reach back.
        </p>
      </div>

      {done ? (
        <div className="rounded-2xl glass p-10 text-center">
          <p className="font-serif text-2xl text-primary">Thank you</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your details are safe with us. Our team will contact you shortly.
          </p>
          <button
            onClick={() => setDone(false)}
            className="mt-6 rounded-full gold-border px-6 py-2 text-sm hover:bg-primary/10"
          >
            Submit another
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            if (!f.name.trim() || !f.address.trim() || !f.phone.trim()) {
              setMsg("Name, address and phone are required.");
              return;
            }
            mut.mutate();
          }}
          className="grid gap-5 rounded-3xl glass p-6 md:p-10"
        >
          <Field label="Full name *">
            <input required maxLength={120} value={f.name} onChange={(e) => upd("name", e.target.value)} className={input} />
          </Field>
          <Field label="Address *">
            <textarea required maxLength={500} rows={3} value={f.address} onChange={(e) => upd("address", e.target.value)} className={input} />
          </Field>
          <Field label="Phone number *">
            <input required maxLength={30} value={f.phone} onChange={(e) => upd("phone", e.target.value)} className={input} inputMode="tel" />
          </Field>

          <Field label="Your experience">
            <div className="flex flex-wrap gap-3">
              {(["beginner", "experienced"] as const).map((opt) => (
                <label
                  key={opt}
                  className={`cursor-pointer rounded-full border px-5 py-2 text-sm capitalize transition ${
                    f.experience === opt
                      ? "border-primary bg-primary/15 text-primary"
                      : "gold-border hover:bg-primary/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="experience"
                    value={opt}
                    checked={f.experience === opt}
                    onChange={() => upd("experience", opt)}
                    className="sr-only"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Are you interested in joining us?">
            <div className="flex gap-3">
              {[
                { v: true, label: "Yes" },
                { v: false, label: "Just exploring" },
              ].map((opt) => (
                <label
                  key={String(opt.v)}
                  className={`cursor-pointer rounded-full border px-5 py-2 text-sm transition ${
                    f.interested === opt.v
                      ? "border-primary bg-primary/15 text-primary"
                      : "gold-border hover:bg-primary/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="interested"
                    checked={f.interested === opt.v}
                    onChange={() => upd("interested", opt.v)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Approximate budget (optional)">
            <input maxLength={120} value={f.budget} onChange={(e) => upd("budget", e.target.value)} placeholder="e.g. ₹50,000 – ₹1,00,000" className={input} />
          </Field>
          <Field label="How soon can you join / start? (optional)">
            <input maxLength={120} value={f.timeline} onChange={(e) => upd("timeline", e.target.value)} placeholder="e.g. within 2 weeks, 1 month…" className={input} />
          </Field>
          <Field label="Your locality / city (optional)">
            <input maxLength={200} value={f.locality} onChange={(e) => upd("locality", e.target.value)} className={input} />
          </Field>

          {msg && <p className="text-sm text-destructive">{msg}</p>}

          <button
            type="submit"
            disabled={mut.isPending}
            className="mt-2 self-start rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] disabled:opacity-60"
          >
            {mut.isPending ? "Sending…" : "Send my details"}
          </button>
        </form>
      )}
    </div>
  );
}

const input =
  "w-full rounded-lg bg-background/60 px-4 py-3 outline-none ring-1 ring-primary/20 focus:ring-primary/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-primary/70">{label}</span>
      {children}
    </label>
  );
}
