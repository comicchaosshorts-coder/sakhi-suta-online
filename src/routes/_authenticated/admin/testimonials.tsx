import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListTestimonials,
  deleteTestimonial,
  setTestimonialApproved,
} from "@/lib/admin.functions";
import { useMarkSeen } from "@/lib/admin-badges";


export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  component: TestimonialsAdmin,
});

type T = {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  created_at: string;
};

function TestimonialsAdmin() {
  useMarkSeen("testimonials");
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery<T[]>({
    queryKey: ["admin-testimonials"],
    queryFn: () => adminListTestimonials(),
  });
  const approve = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) =>
      setTestimonialApproved({ data: { id, approved } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-testimonials"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => deleteTestimonial({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-testimonials"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Testimonials</h1>
        <p className="text-sm text-muted-foreground">
          Approve or hide customer notes shown on the homepage.
        </p>
      </div>
      <div className="grid gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl glass p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-serif text-lg text-primary">{r.name}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} ·{" "}
                  {r.approved ? "Approved" : "Pending"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approve.mutate({ id: r.id, approved: !r.approved })}
                  className={`rounded-full px-4 py-1 text-xs ${
                    r.approved
                      ? "gold-border hover:bg-primary/10"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {r.approved ? "Unapprove" : "Approve"}
                </button>
                <button
                  onClick={() => del.mutate(r.id)}
                  className="rounded-full border border-destructive/60 px-4 py-1 text-xs text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/90">"{r.message}"</p>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-2xl glass p-8 text-center text-sm text-muted-foreground">
            No testimonials yet.
          </p>
        )}
      </div>
    </div>
  );
}
