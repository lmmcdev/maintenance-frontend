"use client";

import { useState, useEffect } from "react";
import { UICategory } from "../types/ticket";
import { fetchWithAuth } from "../../lib/api/client";

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
    if (!token) {
      // Don't attempt to fetch without a token
      return;
    }

    let abort = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('📂 Fetching categories with retry system...');
        const json = await fetchWithAuth<any>(`${apiBase}/api/v1/categories?limit=200`, {}, token);
        const items = json?.data?.items ?? json?.items ?? [];
        const norm = normalizeCats(items);
        if (!abort) setCats(norm);
        console.log('✅ Categories loaded successfully:', norm.length);
      } catch (e: any) {
        console.error('❌ Categories fetch failed:', e);
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