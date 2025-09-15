"use client";

import { useState, useEffect } from "react";
import { UICategory } from "../types/ticket";

function normalizeCats(arr: any[]): UICategory[] {
  const active = (arr || []).filter((c: any) => c?.isActive !== false);
  return active.map((c: any) => {
    const name = c?.id ?? c?.name ?? "";
    const displayName = c?.displayName ?? name;
    const rawSubs: any[] = c?.subcategories ?? [];
    const subcats = rawSubs
      .filter((s: any) => s?.isActive !== false)
      .map((s: any) => ({
        name: s?.name ?? "",
        displayName: s?.displayName ?? s?.name ?? "",
      }));
    return { name, displayName, subcats } as UICategory;
  });
}

export function useCategories(apiBase: string, token?: string) {
  const [cats, setCats] = useState<UICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${apiBase}/api/v1/categories?limit=200`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = json?.data?.items ?? json?.items ?? [];
        const norm = normalizeCats(items);
        if (!abort) setCats(norm);
      } catch (e: any) {
        if (!abort) setError(e?.message || "Categories error");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [apiBase, token]);
  
  return { cats, loading, error };
}