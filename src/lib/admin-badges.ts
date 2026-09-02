import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  adminListInquiries,
  adminListTestimonials,
  adminListNotifications,
} from "@/lib/admin.functions";

type Row = { created_at: string };

const KEYS = {
  inquiries: "admin_seen_inquiries_at",
  testimonials: "admin_seen_testimonials_at",
} as const;

export type BadgeSection = keyof typeof KEYS;

function getSeen(section: BadgeSection): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(KEYS[section]);
  return v ? Number(v) || 0 : 0;
}

export function markSectionSeen(section: BadgeSection) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS[section], String(Date.now()));
}

function latest(rows: Row[]): number {
  return rows.reduce((max, r) => Math.max(max, new Date(r.created_at).getTime()), 0);
}

/** Marks a section as seen when the page mounts and refreshes the badge state. */
export function useMarkSeen(section: BadgeSection) {
  const qc = useQueryClient();
  useEffect(() => {
    markSectionSeen(section);
    qc.invalidateQueries({ queryKey: ["admin-badges"] });
  }, [section, qc]);
}

/** Returns whether each admin section has unseen items. */
export function useAdminBadges() {
  const { data } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const [inq, tes, notifs] = await Promise.all([
        adminListInquiries() as Promise<Row[]>,
        adminListTestimonials() as Promise<Row[]>,
        adminListNotifications() as Promise<{ read: boolean }[]>,
      ]);
      return {
        inquiries: latest(inq) > getSeen("inquiries"),
        testimonials: latest(tes) > getSeen("testimonials"),
        notifications: notifs.filter((n) => !n.read).length,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  return data ?? { inquiries: false, testimonials: false, notifications: 0 };
}
