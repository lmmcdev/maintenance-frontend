"use client";

import React, { useState, useRef, useEffect } from "react";
import { LocationCategory, SubLocation } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";
import { fetchLocations } from "../api/ticketApi";

type LocationSelectorProps = {
  value: { category: LocationCategory; subLocation?: SubLocation } | null | undefined;
  onChange: (location: { category: LocationCategory; subLocation?: SubLocation } | null) => void;
  disabled?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

const LOCATION_CONFIG = {
  "ADULT DAY CARE": {
    label: "Adult Day Care",
    subLocations: [
      "ADC_BIRD_ROAD", "ADC_CUTLER_BAY", "ADC_HIALEAH", "ADC_HIALEAH_EAST", "ADC_HIALEAH_WEST",
      "ADC_HIATUS", "ADC_HOLLYWOOD", "ADC_HOMESTEAD", "ADC_KENDALL", "ADC_MARLINS_PARK", 
      "ADC_MIAMI_27TH", "ADC_MIAMI_37TH", "ADC_MIAMI_GARDENS", "ADC_MIAMI_LAKES", 
      "ADC_NORTH_MIAMI", "ADC_NORTH_MIAMI_BEACH", "ADC_PEMBROKE_PINES", "ADC_PLANTATION", 
      "ADC_TAMARAC", "ADC_WEST_PALM_BEACH", "ADC_WESTCHESTER"
    ] as SubLocation[]
  },
  "MEDICAL CENTER": {
    label: "Medical Center",
    subLocations: [
      "BIRD_ROAD_MC", "BIRD_ROAD_SPECIALIST", "CUTLER_RIDGE_MC", 
      "HIALEAH_EAST_MC", "HIALEAH_GARDENS_SPECIALIST", "HIALEAH_MC", "HIALEAH_WEST_MC", 
      "HIATUS_MC", "HOLLYWOOD_MC", "HOMESTEAD_MC", "KENDALL_MC", 
      "MARLINS_PARK_MC", "MIAMI_27TH_MC", "MIAMI_GARDENS_MC", "NORTH_MIAMI_BEACH_MC",
      "PEMBROKE_PINES_MC", "PLANTATION_MC", "TAMARAC_MC", "WEST_PALM_BEACH_MC", "WESTCHESTER_MC"
    ] as SubLocation[]
  },
  OTHERS: {
    label: "Others",
    subCategories: [
      {
        key: "Corporate",
        label: "Corporate",
        subLocations: [] as SubLocation[]
      },
      {
        key: "OTC", 
        label: "OTC",
        subLocations: [] as SubLocation[]
      },
      {
        key: "Pharmacy",
        label: "Pharmacy",
        subLocations: [] as SubLocation[]
      },
      {
        key: "Research",
        label: "Research",
        subLocations: [] as SubLocation[]
      }
    ]
  }
};

const SUB_LOCATION_LABELS = {
  // ADC locations
  ADC_HIALEAH_WEST: "ADC Hialeah West",
  ADC_HIALEAH_EAST: "ADC Hialeah East",
  ADC_BIRD_ROAD: "ADC Bird Road",
  ADC_CUTLER_BAY: "ADC Cutler Bay",
  ADC_HIALEAH: "ADC Hialeah",
  ADC_HIATUS: "ADC Hiatus",
  ADC_HOLLYWOOD: "ADC Hollywood",
  ADC_HOMESTEAD: "ADC Homestead",
  ADC_KENDALL: "ADC Kendall",
  ADC_MARLINS_PARK: "ADC Marlins Park",
  ADC_MIAMI_27TH: "ADC Miami 27th",
  ADC_MIAMI_37TH: "ADC Miami 37th",
  ADC_MIAMI_GARDENS: "ADC Miami Gardens",
  ADC_MIAMI_LAKES: "ADC Miami Lakes",
  ADC_NORTH_MIAMI: "ADC North Miami",
  ADC_NORTH_MIAMI_BEACH: "ADC North Miami Beach",
  ADC_PEMBROKE_PINES: "ADC Pembroke Pines",
  ADC_PLANTATION: "ADC Plantation",
  ADC_TAMARAC: "ADC Tamarac",
  ADC_WEST_PALM_BEACH: "ADC West Palm Beach",
  ADC_WESTCHESTER: "ADC Westchester",
  
  // Medical Center locations
  HIALEAH_MC: "Hialeah MC",
  HIALEAH_WEST_MC: "Hialeah West MC",
  HIALEAH_EAST_MC: "Hialeah East MC",
  BIRD_ROAD_MC: "Bird Road MC",
  HIATUS_MC: "Hiatus MC",
  PEMBROKE_PINES_MC: "Pembroke Pines MC",
  PLANTATION_MC: "Plantation MC",
  WEST_PALM_BEACH_MC: "West Palm Beach MC",
  HOLLYWOOD_MC: "Hollywood MC",
  KENDALL_MC: "Kendall MC",
  HOMESTEAD_MC: "Homestead MC",
  CUTLER_RIDGE_MC: "Cutler Ridge MC",
  TAMARAC_MC: "Tamarac MC",
  WESTCHESTER_MC: "Westchester MC",
  NORTH_MIAMI_BEACH_MC: "North Miami Beach MC",
  MIAMI_GARDENS_MC: "Miami Gardens MC",
  MARLINS_PARK_MC: "Marlins Park MC",
  MIAMI_27TH_MC: "Miami 27th MC",
  HIALEAH_GARDENS_SPECIALIST: "Hialeah Gardens Specialist Center",
  BIRD_ROAD_SPECIALIST: "Bird Road Specialist Center",
  
};

export function LocationSelector({
  value,
  onChange,
  disabled = false,
  onOpenChange
}: LocationSelectorProps) {
  const { t: translate, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [dropdownPosition, setDropdownPosition] = useState<"down" | "up">("down");
  const [apiLocations, setApiLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch locations from API with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const loadLocations = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const locations = await fetchLocations(undefined, 1, 100, searchTerm);
          setApiLocations(locations);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load locations");
          console.error("Failed to fetch locations:", err);
        } finally {
          setIsLoading(false);
        }
      };

      loadLocations();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getLabel = (key: string, labelConfig: any) => {
    if (!labelConfig[key]) return key;
    const config = labelConfig[key];
    
    // For LOCATION_CONFIG items with .label (now just strings)
    if (typeof config === 'object' && config.label) {
      return config.label;
    }
    
    // For SUB_LOCATION_LABELS (strings)
    if (typeof config === 'string') {
      return config;
    }
    
    return key;
  };

  // Build all options as a flat list with section separators
  const buildOptions = () => {
    const options: Array<{
      value: string;
      label: string;
      category: LocationCategory;
      subLocation?: SubLocation;
      isSeparator?: boolean;
      sectionTitle?: string;
    }> = [];

    // Add API locations first if available
    if (apiLocations.length > 0) {
      options.push({
        value: "title_API_LOCATIONS",
        label: "External Locations",
        category: "API_LOCATIONS" as LocationCategory,
        isSeparator: true,
        sectionTitle: "External Locations"
      });

      apiLocations.forEach((location) => {
        options.push({
          value: `API_LOCATION|${location.id}`,
          label: location.name || location.code || location.id,
          category: "API_LOCATIONS" as LocationCategory,
          subLocation: location.id as SubLocation
        });
      });

      // Add separator between API locations and static locations
      options.push({
        value: "separator_STATIC",
        label: "",
        category: "STATIC" as LocationCategory,
        isSeparator: true
      });
    }

    const sectionOrder = ['ADULT DAY CARE', 'MEDICAL CENTER', 'OTHERS'];

    sectionOrder.forEach((categoryKey, sectionIndex) => {
      const config = LOCATION_CONFIG[categoryKey as keyof typeof LOCATION_CONFIG];
      if (!config) return;
      
      const category = categoryKey as LocationCategory;
      const categoryLabel = getLabel(categoryKey, LOCATION_CONFIG);

      // Add section separator (except for first section)
      if (sectionIndex > 0) {
        options.push({
          value: `separator_${category}`,
          label: "",
          category,
          isSeparator: true
        });
      }

      // Add section title
      options.push({
        value: `title_${category}`,
        label: categoryLabel,
        category,
        isSeparator: true,
        sectionTitle: categoryLabel
      });

      // Handle "Others" section specially
      if (categoryKey === 'OTHERS' && 'subCategories' in config) {
        config.subCategories.forEach((subCat) => {
          const subCatLabel = getLabel(subCat.key, { [subCat.key]: subCat });
          options.push({
            value: `${subCat.key}`,
            label: subCatLabel,
            category: subCat.key as LocationCategory
          });
        });
      } else if ('subLocations' in config) {
        if (config.subLocations.length === 0) {
          // No sub-locations, add category directly
          options.push({
            value: `${category}`,
            label: categoryLabel,
            category
          });
        } else {
          // Has sub-locations, add each combination
          config.subLocations.forEach((subLoc) => {
            const subLabel = getLabel(subLoc, SUB_LOCATION_LABELS);
            options.push({
              value: `${category}|${subLoc}`,
              label: subLabel, // Just the location name, not "Category - Location"
              category,
              subLocation: subLoc
            });
          });
        }
      }
    });

    return options;
  };

  const allOptions = buildOptions();

  // Initialize selected label from value
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }

    const option = allOptions.find(opt => {
      if (value.subLocation) {
        return opt.category === value.category && opt.subLocation === value.subLocation;
      } else {
        return opt.category === value.category && !opt.subLocation;
      }
    });

    setSelectedLabel(option?.label || "");
  }, [value, language]); // Re-run when language changes

  const filteredOptions = searchTerm 
    ? allOptions.filter((option) => 
        !option.isSeparator && option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allOptions;

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

  const handleLocationSelect = (option: any) => {
    if (disabled) return;

    onChange({
      category: option.category,
      subLocation: option.subLocation
    });
    
    setSelectedLabel(option.label);
    setIsOpen(false);
    onOpenChange?.(false);
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">
        {language === "es" ? "Ubicación" : "Location"}:
      </span>
      <div className="flex-1 relative min-w-0" ref={containerRef}>
        {/* Main button - identical to CategorySelector */}
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
              const dropdownHeight = 300;

              if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setDropdownPosition("up");
              } else {
                setDropdownPosition("down");
              }
            }
          }}
          disabled={disabled}
          className="w-full rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium outline-none transition-all duration-300 bg-white hover:border-[#00A1FF]/30 focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 shadow-sm hover:shadow-md focus:shadow-lg text-left flex items-center justify-between disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 border-gray-300 text-gray-700 max-w-full overflow-hidden"
        >
          <span>{selectedLabel || (language === "es" ? "Seleccionar ubicación..." : "Select location...")}</span>
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
            } ${disabled ? "text-gray-300" : "text-gray-500"}`}
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

        {/* Dropdown - identical to CategorySelector */}
        {isOpen && !disabled && (
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
                placeholder={language === "es" ? "Buscar ubicaciones..." : "Search locations..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-[#00A1FF] focus:ring-1 focus:ring-[#00A1FF]/20 outline-none"
                autoFocus
              />
            </div>

            {/* Locations list */}
            <div className="max-h-40 overflow-y-auto">
              {isLoading && (
                <div className="px-2 sm:px-3 py-4 text-xs sm:text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading locations...
                  </div>
                </div>
              )}

              {error && (
                <div className="px-2 sm:px-3 py-4 text-xs sm:text-sm text-red-500 text-center">
                  {error}
                </div>
              )}

              {!isLoading && !error && filteredOptions.map((option) => {
                // Section separator
                if (option.isSeparator && !option.sectionTitle) {
                  return (
                    <div key={option.value} className="border-t border-gray-200 mx-2 my-1" />
                  );
                }
                
                // Section title
                if (option.isSeparator && option.sectionTitle) {
                  return (
                    <div key={option.value} className="px-2 sm:px-3 py-1 bg-gray-100 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {option.sectionTitle}
                      </span>
                    </div>
                  );
                }

                // Regular option
                const displayLabel = option.subLocation ? option.label : option.label;
                const isSelected = value && (
                  (value.subLocation && value.category === option.category && value.subLocation === option.subLocation) ||
                  (!value.subLocation && value.category === option.category && !option.subLocation)
                );

                return (
                  <button
                    key={option.value}
                    onClick={() => handleLocationSelect(option)}
                    className="w-full flex items-center px-2 sm:px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150 text-left"
                  >
                    <span className="text-xs sm:text-sm text-gray-700 flex-1">
                      {displayLabel}
                    </span>
                    {isSelected && (
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
                );
              })}

              {!isLoading && !error && filteredOptions.length === 0 && (
                <div className="px-2 sm:px-3 py-4 text-xs sm:text-sm text-gray-500 text-center">
                  No locations found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}