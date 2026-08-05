import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListInquiries,
  deleteInquiry,
  updateInquiryStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  component: InquiriesAdmin,
});

type Inquiry = {
  id: string;
  name: string;
  address: string;
  phone: string;
  experience: string;
  interested: boolean;
  budget: string | null;
  timeline: string | null;
  locality: string | null;
  status: string;
  created_at: string;
};

function InquiriesAdmin() {
  useMarkSeen("inquiries");
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery<Inquiry[]>({
    queryKey: ["admin-inquiries"],
    queryFn: () => adminListInquiries(),
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      updateInquiryStatus({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-inquiries"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => deleteInquiry({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-inquiries"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Partner inquiries</h1>
        <p className="text-sm text-muted-foreground">
          Submissions from the "Connect with us" page.
        </p>
      </div>
      <div className="grid gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl glass p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-serif text-xl text-primary">{r.name}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} · Status: {r.status}
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={r.status}
                  onChange={(e) => setStatus.mutate({ id: r.id, status: e.target.value })}
                  className="rounded-full bg-background/60 px-3 py-1 text-xs ring-1 ring-primary/20"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={() => del.mutate(r.id)}
                  className="rounded-full border border-destructive/60 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <Info k="Phone" v={r.phone} />
              <Info k="Experience" v={r.experience} />
              <Info k="Interested" v={r.interested ? "Yes" : "Exploring"} />
              <Info k="Budget" v={r.budget ?? "—"} />
              <Info k="Timeline" v={r.timeline ?? "—"} />
              <Info k="Locality" v={r.locality ?? "—"} />
              <div className="md:col-span-2">
                <Info k="Address" v={r.address} />
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-2xl glass p-8 text-center text-sm text-muted-foreground">
            No inquiries yet.
          </p>
        )}
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <p>
      <span className="text-xs uppercase tracking-widest text-primary/60">{k}: </span>
      <span className="text-foreground/90">{v}</span>
    </p>
  );
}
