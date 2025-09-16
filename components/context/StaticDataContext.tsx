"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Person } from "../types/ticket";
import { searchPersons, searchPersonsByDepartment, listCategories } from "@/lib/api/client";


type UICategory = {
  name: string;
  displayName: string;
  subcats: Array<{
    name: string;
    displayName: string;
  }>;
};

type StaticDataContextType = {
  persons: Person[];
  categories: UICategory[];
  peopleList: string[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
};

const StaticDataContext = createContext<StaticDataContextType | undefined>(
  undefined
);

export function StaticDataProvider({
  children,
  apiBase = "/_api",
  token,
}: {
  children: ReactNode;
  apiBase?: string;
  token?: string;
}) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [peopleList, setPeopleList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaticData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch persons and categories in parallel
      const [personsData, categoriesResponse] = await Promise.all([
        searchPersonsByDepartment({ apiBase, token }, "MAINTENANCE", 50).catch(() => []),
        listCategories({ apiBase, token }, 200).catch(() => [])
      ]);

      setPersons(personsData);

      // Process categories - listCategories already returns UICategory[]
      const normalizedCategories = categoriesResponse || [];
      
      // Add "Other" category as fallback option
      const categoriesWithOther = [
        ...normalizedCategories,
        {
          name: "OTRO",
          displayName: "Otro",
          subcats: [
            { name: "OTRO", displayName: "Otro" }
          ]
        }
      ];
      
      setCategories(categoriesWithOther);

      // Generate people list from persons or use fallback
      if (personsData.length > 0) {
        const list = personsData
          .map((p) => `${p.firstName} ${p.lastName}`.trim())
          .filter((name) => name.length > 0)
          .sort((a, b) => a.localeCompare(b));
        setPeopleList(list);
      }
    } catch (err) {
      console.error("Error fetching static data:", err);
      setError("Failed to load static data");

      // Set fallback data even on error
      const fallbackList = [
        "Juan Carlos Gonzalez",
        "Eugenio Suarez",
        "Elpidio Davila",
        "Roger Membreno",
        "Lino Munoz",
        "Ariel Caballero",
        "Ramon Aguilera",
        "Raul Garcia",
        "Carlos Pena",
      ].sort((a, b) => a.localeCompare(b));
      setPeopleList(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaticData();
  }, [apiBase, token]);

  const refreshData = async () => {
    await fetchStaticData();
  };

  return (
    <StaticDataContext.Provider
      value={{
        persons,
        categories,
        peopleList,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </StaticDataContext.Provider>
  );
}

export function useStaticData() {
  const context = useContext(StaticDataContext);
  if (context === undefined) {
    throw new Error("useStaticData must be used within a StaticDataProvider");
  }
  return context;
}
