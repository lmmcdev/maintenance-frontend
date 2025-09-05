"use client";

import { useState, useEffect, useMemo } from "react";
import { Ticket, TicketStatus, ListResponse } from "../types/ticket";

export function useTickets(apiBase: string, status: TicketStatus) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useMemo(() => {
    return async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${apiBase}/api/v1/tickets?status=${encodeURIComponent(
          status
        )}&limit=20&sortBy=createdAt&sortDir=desc`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ListResponse = await res.json();
        if (!json.success) throw new Error("API returned success=false");
        setItems(json.data.items || []);
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
  }, [apiBase, status]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}