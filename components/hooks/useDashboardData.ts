"use client";

import { useState, useEffect, useMemo } from "react";
import { Ticket, TicketStatus, ListResponse } from "../types/ticket";

export interface DashboardFilters {
  createdFrom?: Date;
  createdTo?: Date;
  assigneeId?: string;
  subcategoryDisplayName?: string;
  priority?: string;
}

export function useDashboardData(apiBase: string, token?: string, filters?: DashboardFilters) {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serialize filter values for dependency tracking
  const createdFromStr = filters?.createdFrom?.toISOString();
  const createdToStr = filters?.createdTo?.toISOString();
  const assigneeId = filters?.assigneeId;
  const subcategoryDisplayName = filters?.subcategoryDisplayName;
  const priority = filters?.priority;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all tickets with a higher limit for dashboard
        const params = new URLSearchParams();
        params.append('limit', '100'); // Get more tickets for dashboard
        params.append('sortBy', 'createdAt');
        params.append('sortDir', 'desc');

        // Add date filters if provided
        if (createdFromStr) {
          const fromDate = createdFromStr.split('T')[0];
          params.append('createdFrom', fromDate);
        }
        if (createdToStr) {
          const toDate = createdToStr.split('T')[0];
          params.append('createdTo', toDate);
        }

        // Add assignee filter
        if (assigneeId) {
          params.append('assigneeId', assigneeId);
        }

        // Add subcategory filter
        if (subcategoryDisplayName) {
          params.append('subcategoryDisplayName', subcategoryDisplayName);
        }

        // Add priority filter
        if (priority) {
          params.append('priority', priority);
        }

        const url = `${apiBase}/api/v1/tickets?${params.toString()}`;
        console.log('Dashboard API URL:', url);

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ListResponse = await res.json();
        if (!json.success) throw new Error("API returned success=false");

        // Filter out CANCELLED tickets client-side as well (in case backend doesn't support excludeStatus)
        const filteredTickets = (json.data.items || []).filter(
          ticket => ticket.status !== 'CANCELLED'
        );
        setAllTickets(filteredTickets);
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiBase, token, createdFromStr, createdToStr, assigneeId, subcategoryDisplayName, priority]);

  // Filter tickets by status locally
  const ticketsByStatus = useMemo(() => {
    const byStatus: Record<TicketStatus, Ticket[]> = {
      NEW: [],
      OPEN: [],
      DONE: [],
      CANCELLED: []
    };

    allTickets.forEach(ticket => {
      if (byStatus[ticket.status]) {
        byStatus[ticket.status].push(ticket);
      }
    });

    return byStatus;
  }, [allTickets]);

  // Calculate counts
  const counts = useMemo(() => ({
    NEW: ticketsByStatus.NEW.length,
    OPEN: ticketsByStatus.OPEN.length,
    DONE: ticketsByStatus.DONE.length,
    CANCELLED: ticketsByStatus.CANCELLED.length
  }), [ticketsByStatus]);

  // Calculate priorities
  const priorities = useMemo(() => {
    const acc = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 } as Record<string, number>;
    allTickets.forEach((t) => (acc[t.priority] = (acc[t.priority] || 0) + 1));
    return acc;
  }, [allTickets]);

  return {
    allTickets,
    ticketsByStatus,
    counts,
    priorities,
    loading,
    error
  };
}