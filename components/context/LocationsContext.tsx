"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { fetchLocations } from "../api/ticketApi";

interface Location {
  id: string;
  name: string;
  code?: string;
  [key: string]: any;
}

interface LocationsContextType {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  loadLocations: (apiBase: string, token?: string) => Promise<void>;
  clearCache: () => void;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export function LocationsProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheKey, setCacheKey] = useState<string | null>(null);

  const loadLocations = useCallback(async (apiBase: string, token?: string) => {
    const newCacheKey = `${apiBase}-${token || 'no-token'}`;

    // Return early if already cached with same parameters
    if (cacheKey === newCacheKey && locations.length > 0) {
      return;
    }

    // Return early if already loading
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load in smaller batches for better performance
      const loadedLocations = await fetchLocations(apiBase, 1, 50, "", token);
      setLocations(loadedLocations);
      setCacheKey(newCacheKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load locations";
      setError(errorMessage);
      console.error("Failed to fetch locations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [locations.length, isLoading, cacheKey]);

  const clearCache = useCallback(() => {
    setLocations([]);
    setCacheKey(null);
    setError(null);
  }, []);

  return (
    <LocationsContext.Provider
      value={{
        locations,
        isLoading,
        error,
        loadLocations,
        clearCache,
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error("useLocations must be used within a LocationsProvider");
  }
  return context;
}