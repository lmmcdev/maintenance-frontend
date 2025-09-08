// lib/hooks/usePersons.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { searchPersons, type Person } from "@/lib/api/client";

export function usePersonSearch(apiBase: string, q: string, debounceMs = 300) {
  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  const qNorm = q.trim();

  useEffect(() => {
    if (!qNorm) {
      setItems([]);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchPersons({ apiBase }, qNorm);
        setItems(res);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(id);
  }, [apiBase, qNorm, debounceMs]);

  return { items, loading };
}
