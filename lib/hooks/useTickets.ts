// lib/hooks/useTickets.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listTickets,
  patchTicket,
  patchTicketStatus,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/api/client";

export function useTickets(apiBase: string, status: TicketStatus, token?: string) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await listTickets(
          { apiBase, token },
          { status, limit: 20, sortBy: "createdAt", sortDir: "desc" }
        );
        if (!json.success) throw new Error("API returned success=false");
        setItems(json.data.items || []);
      } catch (e: any) {
        setError(e?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [apiBase, status, token]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}

export function useTicketActions(apiBase: string, token?: string) {
  async function setStatus(
    id: string,
    status: Extract<TicketStatus, "OPEN" | "DONE">
  ) {
    await patchTicketStatus({ apiBase, token }, id, status);
  }

  async function assign(id: string, personId: string) {
    await patchTicket({ apiBase, token }, id, { assigneeId: personId });
    await patchTicketStatus({ apiBase, token }, id, "OPEN");
  }

  async function updatePriority(id: string, priority: TicketPriority) {
    await patchTicket({ apiBase, token }, id, { priority });
  }

  async function updateCategory(
    id: string,
    category: string,
    currentSubcat: string | null | { name?: string; displayName?: string }
  ) {
    const sub =
      typeof currentSubcat === "object" && currentSubcat !== null
        ? {
            name: currentSubcat.name ?? "",
            displayName: currentSubcat.displayName ?? currentSubcat.name ?? "",
          }
        : {
            name: typeof currentSubcat === "string" ? currentSubcat : "",
            displayName: typeof currentSubcat === "string" ? currentSubcat : "",
          };

    await patchTicket({ apiBase, token }, id, { category, subcategory: sub });
  }

  async function updateSubcategory(id: string, subcatName: string) {
    await patchTicket({ apiBase, token }, id, {
      subcategory: { name: subcatName, displayName: subcatName },
    });
  }

  return {
    setStatus,
    assign,
    updatePriority,
    updateCategory,
    updateSubcategory,
  };
}
