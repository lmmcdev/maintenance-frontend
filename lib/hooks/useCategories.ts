// lib/hooks/useCategories.ts
"use client";

import { useEffect, useState } from "react";
import { listCategories, type UICategory } from "@/lib/api/client";

export function useCategories(apiBase: string) {
  const [cats, setCats] = useState<UICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const norm = await listCategories({ apiBase });
        setCats(norm);
      } catch (e: any) {
        setError(e?.message || "Categories error");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [apiBase]);

  return { cats, loading, error };
}
