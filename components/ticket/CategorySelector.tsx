"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Ticket } from "../types/ticket";
import { patchTicket } from "../api/ticketApi";
import { useLanguage } from "../context/LanguageContext";
import { useStaticData } from "../context/StaticDataContext";

type CategorySelectorProps = {
  t: Ticket;
  apiBase: string;
  onChanged?: () => void;
  busy: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

export function CategorySelector({
  t,
  apiBase,
  onChanged,
  busy,
  onOpenChange,
}: CategorySelectorProps) {
  const { t: translate } = useLanguage();
  const { categories } = useStaticData();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedName, setSelectedName] = useState<string>("");
  const [dropdownPosition, setDropdownPosition] = useState<"down" | "up">(
    "down"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const allSubcategories = useMemo(() => {
    const subcats: string[] = [];
    categories.forEach((category) => {
      category.subcats.forEach((subcat) => {
        subcats.push(subcat.displayName);
      });
    });
    return subcats;
  }, [categories]);

  const filteredCategories = allSubcategories.filter((category) =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize selected category from ticket
  useEffect(() => {
    const currentValue =
      typeof t.subcategory === "object" && t.subcategory?.displayName
        ? t.subcategory.displayName
        : typeof t.subcategory === "string"
        ? t.subcategory
        : t.category || "";

    setSelectedName(currentValue);
  }, [t.subcategory, t.category]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onOpenChange?.(false);
        setSearchTerm("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCategorySelect = async (categoryName: string) => {
    if (busy) return;

    try {
      // Find the subcategory object and its parent category
      let subcategoryToAssign: { name: string; displayName: string } | null = null;
      let parentCategory: string | null = null;

      categories.forEach((category) => {
        const foundSubcat = category.subcats.find(
          (sc) => sc.displayName === categoryName
        );
        if (foundSubcat) {
          subcategoryToAssign = foundSubcat;
          parentCategory = category.name; // Store the parent category
        }
      });

      if (subcategoryToAssign !== null && parentCategory !== null) {
        // Update both category and subcategory
        await patchTicket(apiBase, t.id, {
          category: parentCategory, // Set the parent category
          subcategory: subcategoryToAssign,
        });
        setSelectedName(categoryName);
        onChanged?.();
        setIsOpen(false);
        onOpenChange?.(false);
        setSearchTerm("");
      }
    } catch (err: any) {
      console.error("Error updating category/subcategory:", err);
      alert(err?.message ?? translate("error.updating.subcategory"));
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">
        {translate("category")}
      </span>
      <div className="flex-1 relative min-w-0" ref={containerRef}>
        {/* Main button - identical to AssignmentSelector */}
        <button
          onClick={() => {
            const newIsOpen = !isOpen;
            setIsOpen(newIsOpen);
            onOpenChange?.(newIsOpen);

            // Calculate position when opening
            if (newIsOpen && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const spaceBelow = window.innerHeight - rect.bottom;
              const spaceAbove = rect.top;
              const dropdownHeight = 300; // Approximate height including actions

              if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setDropdownPosition("up");
              } else {
                setDropdownPosition("down");
              }
            }
          }}
          disabled={busy}
          className="w-full rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium outline-none transition-all duration-300 bg-white hover:border-[#00A1FF]/30 focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 shadow-sm hover:shadow-md focus:shadow-lg text-left flex items-center justify-between disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 border-gray-300 text-gray-700 max-w-full overflow-hidden"
        >
          <span>{selectedName || translate("category.select")}</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-transform duration-200 ${
              isOpen && dropdownPosition === "up"
                ? ""
                : isOpen && dropdownPosition === "down"
                ? "rotate-180"
                : ""
            } ${busy ? "text-gray-300" : "text-gray-500"}`}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown - identical to AssignmentSelector */}
        {isOpen && !busy && (
          <div
            className={`absolute z-[60] w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-2xl max-h-60 overflow-hidden ${
              dropdownPosition === "up" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            style={{
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Search box */}
            <div className="p-2 sm:p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder={translate("search.categories")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-[#00A1FF] focus:ring-1 focus:ring-[#00A1FF]/20 outline-none"
                autoFocus
              />
            </div>

            {/* Categories list */}
            <div className="max-h-40 overflow-y-auto">
              {filteredCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="w-full flex items-center px-2 sm:px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150 text-left"
                >
                  <span className="text-xs sm:text-sm text-gray-700 flex-1">
                    {category}
                  </span>
                  {selectedName === category && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[#00A1FF] ml-2"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}

              {filteredCategories.length === 0 && (
                <div className="px-2 sm:px-3 py-4 text-xs sm:text-sm text-gray-500 text-center">
                  {translate("no.categories.found")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
