"use client";

import { useState, useEffect, useMemo } from "react";
import { Ticket, TicketStatus, ListResponse } from "../types/ticket";

export interface TicketFilters {
  status: TicketStatus;
  createdFrom?: Date;
  createdTo?: Date;
  category?: string;
  priority?: string;
  q?: string; // Search query
}

export function useTickets(apiBase: string, filters: TicketFilters, token?: string) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useMemo(() => {
    return async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query parameters
        const params = new URLSearchParams();

        // Always include status, limit, and sorting
        params.append('status', filters.status);
        params.append('limit', '20');
        params.append('sortBy', 'createdAt');
        params.append('sortDir', 'desc');

        // Add optional filters
        if (filters.createdFrom) {
          // Format date as YYYY-MM-DD
          const fromDate = filters.createdFrom.toISOString().split('T')[0];
          params.append('createdFrom', fromDate);
        }
        if (filters.createdTo) {
          // Format date as YYYY-MM-DD
          const toDate = filters.createdTo.toISOString().split('T')[0];
          params.append('createdTo', toDate);
        }
        if (filters.category) {
          params.append('category', filters.category);
        }
        if (filters.priority) {
          params.append('priority', filters.priority);
        }
        if (filters.q) {
          params.append('q', filters.q);
        }

        const url = `${apiBase}/api/v1/tickets?${params.toString()}`;
        console.log('Tickets API URL:', url);

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
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
  }, [apiBase, filters, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}