// lib/hooks/usePersons.ts
"use client";

import { useEffect, useState } from "react";
import { searchPersons, searchPersonsByDepartment, type Person } from "@/lib/api/client";

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

export function usePersonsByDepartment(apiBase: string, department: string, limit = 50) {
  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!department) {
      setItems([]);
      return;
    }
    
    setLoading(true);
    searchPersonsByDepartment({ apiBase }, department, limit)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [apiBase, department, limit]);

  return { items, loading };
}
