import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Postgres changes on a table and invalidates React Query keys.
 * Database changes are the only source of truth — no timers, no simulation.
 */
export function useRealtimeInvalidate(opts: {
  channel: string;
  table: string;
  filter?: string;
  queryKeys: unknown[][];
  onEvent?: (payload: { eventType: string; new: Record<string, unknown> }) => void;
  enabled?: boolean;
}) {
  const qc = useQueryClient();
  const { channel, table, filter, enabled = true } = opts;
  const keys = JSON.stringify(opts.queryKeys);
  const onEvent = opts.onEvent;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const ch = supabase
      .channel(channel)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        (payload) => {
          for (const key of JSON.parse(keys) as unknown[][]) {
            qc.invalidateQueries({ queryKey: key });
          }
          onEvent?.({
            eventType: payload.eventType,
            new: (payload.new ?? {}) as Record<string, unknown>,
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, table, filter, keys, enabled, qc]);
}
