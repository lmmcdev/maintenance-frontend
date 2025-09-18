"use client";

import React, { useState, useRef, useEffect } from "react";
import { LocationCategory, SubLocation } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";
import { fetchLocations } from "../api/ticketApi";

type LocationSelectorProps = {
  value: Array<{ category: LocationCategory; subLocation?: SubLocation; locationId?: string; locationTypeId?: string }> | null | undefined;
  onChange: (
    locations: Array<{ category: LocationCategory; subLocation?: SubLocation; locationId?: string; locationTypeId?: string }>
  ) => void;
  disabled?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  token?: string;
  apiBase?: string;
};

export function LocationSelector({
  value,
  onChange,
  disabled = false,
  onOpenChange,
  token,
  apiBase = "http://localhost:7071",
}: LocationSelectorProps) {
  const { t: translate, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [dropdownPosition, setDropdownPosition] = useState<"down" | "up">(
    "down"
  );
  const [apiLocations, setApiLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch locations from API on component mount
  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const locations = await fetchLocations(apiBase, 1, 100, "", token);
        setApiLocations(locations);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load locations"
        );
        console.error("Failed to fetch locations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocations();
  }, [token, apiBase]);


  const getLabel = (key: string, labelConfig: any) => {
    if (!labelConfig[key]) return key;
    const config = labelConfig[key];

    // For LOCATION_CONFIG items with .label (now just strings)
    if (typeof config === "object" && config.label) {
      return config.label;
    }

    // For SUB_LOCATION_LABELS (strings)
    if (typeof config === "string") {
      return config;
    }

    return key;
  };

  // Build options only from API locations
  const buildOptions = () => {
    const options: Array<{
      value: string;
      label: string;
      category: LocationCategory;
      subLocation?: SubLocation;
      isSeparator?: boolean;
      sectionTitle?: string;
    }> = [];

    // Only add API locations
    apiLocations.forEach((location) => {
      options.push({
        value: `API_LOCATION|${location.id}`,
        label: location.name || location.code || location.id,
        category: "API_LOCATIONS" as LocationCategory,
        subLocation: location.id as SubLocation,
      });
    });

    // Sort alphabetically, but keep "Otros" at the end
    options.sort((a, b) => {
      const aIsOthers = a.label.toLowerCase().includes('otros') || a.label.toLowerCase().includes('others');
      const bIsOthers = b.label.toLowerCase().includes('otros') || b.label.toLowerCase().includes('others');

      // If one is "Otros" and the other isn't, put "Otros" at the end
      if (aIsOthers && !bIsOthers) return 1;
      if (!aIsOthers && bIsOthers) return -1;

      // For all other cases, sort alphabetically
      return a.label.localeCompare(b.label, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    });

    return options;
  };

  const allOptions = buildOptions();

  // Initialize selected label from value
  useEffect(() => {
    if (!value || value.length === 0) {
      setSelectedLabel("");
      return;
    }

    // If still loading locations, show loading message
    if (isLoading && apiLocations.length === 0) {
      setSelectedLabel(language === "es" ? "Cargando ubicaciones..." : "Loading locations...");
      return;
    }

    if (value.length === 1) {
      const location = value[0];
      // Try to find in API locations first
      const locationData = apiLocations.find(loc => loc.id === location.locationId);
      if (locationData) {
        const displayName = locationData.name || locationData.code || location.locationId || "";
        setSelectedLabel(displayName);
      } else {
        // If not found and still loading, show loading
        if (isLoading) {
          setSelectedLabel(language === "es" ? "Cargando ubicación..." : "Loading location...");
        } else {
          // If not found and not loading, show ID as fallback
          setSelectedLabel(location.locationId || "");
        }
      }
    } else {
      // Multiple locations
      const locationNames = value.map(location => {
        const locationData = apiLocations.find(loc => loc.id === location.locationId);
        if (locationData) {
          return locationData.name || locationData.code || location.locationId || "";
        } else {
          return isLoading ? "..." : (location.locationId || "");
        }
      });

      // If any locations are still loading (showing "..."), show loading message
      if (locationNames.some(name => name === "...")) {
        setSelectedLabel(language === "es" ? "Cargando ubicaciones..." : "Loading locations...");
      } else {
        const joinedNames = locationNames.join(", ");
        if (joinedNames.length > 50) {
          setSelectedLabel(`${value.length} ${language === "es" ? "ubicaciones seleccionadas" : "locations selected"}`);
        } else {
          setSelectedLabel(joinedNames);
        }
      }
    }
  }, [value, language, apiLocations, isLoading]); // Re-run when language, apiLocations, or loading state change

  const filteredOptions = (() => {
    // First filter by search term
    let options = searchTerm
      ? allOptions.filter(
          (option) =>
            !option.isSeparator &&
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allOptions;

    // Then filter out already selected locations
    const selectedLocationIds = value?.map(loc => loc.locationId) || [];
    options = options.filter(option =>
      option.isSeparator || !selectedLocationIds.includes(option.subLocation)
    );

    return options;
  })();

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

    // Get the full location data
    const locationData = apiLocations.find(loc => loc.id === option.subLocation);

    const newLocation = {
      category: option.category,
      subLocation: option.subLocation,
      locationId: locationData?.id,
      locationTypeId: locationData?.locationTypeId,
    };

    // Check if location is already selected
    const currentLocations = value || [];
    const isSelected = currentLocations.some(loc =>
      loc.locationId === newLocation.locationId
    );

    let updatedLocations;
    if (isSelected) {
      // Remove location if already selected
      updatedLocations = currentLocations.filter(loc =>
        loc.locationId !== newLocation.locationId
      );
    } else {
      // Add location if not selected
      updatedLocations = [...currentLocations, newLocation];
    }

    onChange(updatedLocations);

    // Don't close dropdown for multiple selection
    // setIsOpen(false);
    // onOpenChange?.(false);
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
          <span>
            {selectedLabel ||
              (language === "es"
                ? "Seleccionar ubicación..."
                : "Select location...")}
          </span>
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

        {/* Selected locations display */}
        {value && value.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {value.map((location, index) => {
              const locationData = apiLocations.find(loc => loc.id === location.locationId);
              let displayName;

              if (locationData) {
                displayName = locationData.name || locationData.code || location.locationId;
              } else if (isLoading) {
                displayName = language === "es" ? "Cargando..." : "Loading...";
              } else {
                displayName = location.locationId;
              }

              return (
                <div
                  key={`${location.locationId}-${index}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                >
                  <span>{displayName}</span>
                  <button
                    onClick={() => {
                      const updatedLocations = value.filter((_, i) => i !== index);
                      onChange(updatedLocations);
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    disabled={disabled}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

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
                placeholder={
                  language === "es"
                    ? "Buscar ubicaciones..."
                    : "Search locations..."
                }
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
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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

              {!isLoading &&
                !error &&
                filteredOptions.map((option) => {
                  // Section separator
                  if (option.isSeparator && !option.sectionTitle) {
                    return (
                      <div
                        key={option.value}
                        className="border-t border-gray-200 mx-2 my-1"
                      />
                    );
                  }

                  // Section title
                  if (option.isSeparator && option.sectionTitle) {
                    return (
                      <div
                        key={option.value}
                        className="px-2 sm:px-3 py-1 bg-gray-100 border-b border-gray-200"
                      >
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {option.sectionTitle}
                        </span>
                      </div>
                    );
                  }

                  // Regular option
                  const displayLabel = option.subLocation
                    ? option.label
                    : option.label;
                  const isSelected = value && value.some(loc =>
                    loc.locationId === option.subLocation
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
