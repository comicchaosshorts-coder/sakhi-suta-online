import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitTestimonial } from "@/lib/homepage.functions";

type T = { id: string; name: string; message: string; created_at: string };

export function TestimonialsSection({ items }: { items: T[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async () =>
      submitTestimonial({ data: { name: name.trim(), message: message.trim() } }),
    onSuccess: () => {
      setStatus("Thank you — your note awaits approval.");
      setName("");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (e) => setStatus(e instanceof Error ? e.message : "Could not submit"),
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">Whispers from the drape</p>
        <h2 className="mt-2 font-serif text-4xl md:text-5xl">What our customers say</h2>
      </div>

      {items.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 9).map((t) => (
            <blockquote key={t.id} className="rounded-2xl glass p-6">
              <p className="text-sm leading-relaxed text-foreground/90">"{t.message}"</p>
              <footer className="mt-4 text-xs uppercase tracking-[0.3em] text-primary/80">
                — {t.name}
              </footer>
            </blockquote>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || message.trim().length < 3) {
            setStatus("Please share your name and a short message.");
            return;
          }
          setStatus(null);
          mut.mutate();
        }}
        className="mx-auto mt-12 max-w-2xl rounded-2xl glass p-6"
      >
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-primary/70">
          Leave a note
        </p>
        <div className="grid gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Your name"
            className="rounded-lg bg-background/60 px-4 py-3 outline-none ring-1 ring-primary/20 focus:ring-primary/60"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Share your experience with Sakhi Suta…"
            className="rounded-lg bg-background/60 px-4 py-3 outline-none ring-1 ring-primary/20 focus:ring-primary/60"
          />
          <button
            type="submit"
            disabled={mut.isPending}
            className="self-start rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] disabled:opacity-60"
          >
            {mut.isPending ? "Sending…" : "Submit"}
          </button>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Notes appear after admin approval.
          </p>
        </div>
      </form>
    </section>
  );
}
