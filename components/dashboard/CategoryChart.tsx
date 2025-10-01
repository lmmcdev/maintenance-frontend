"use client";

import React from "react";
import BarChartIcon from '@mui/icons-material/BarChart';
import { Ticket } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";

function getRandomColor(index: number) {
  const colors = [
    "#00a1ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
    "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1"
  ];
  return colors[index % colors.length];
}

type CategoryChartProps = {
  tickets: Ticket[];
  onSubcategoryClick?: (subcategoryName: string) => void;
};

export function CategoryChart({ tickets, onSubcategoryClick }: CategoryChartProps) {
  const { t: translate } = useLanguage();

  // Calculate category distribution
  const categoryData = React.useMemo(() => {
    const categoryCount: Record<string, number> = {};

    // Filter out NEW tickets
    const filteredTickets = tickets.filter(ticket => ticket.status !== 'NEW');

    filteredTickets.forEach(ticket => {
      let categoryName = "Uncategorized";
      
      if (ticket.subcategory) {
        if (typeof ticket.subcategory === 'object') {
          categoryName = ticket.subcategory.displayName || ticket.subcategory.name;
        } else {
          categoryName = ticket.subcategory;
        }
      } else if (ticket.category) {
        categoryName = ticket.category;
      }
      
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .map(([name, count], index) => ({
        name,
        count,
        color: getRandomColor(index),
        percentage: filteredTickets.length > 0 ? Math.round((count / filteredTickets.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  const total = categoryData.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <section>
      <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white overflow-hidden" 
           style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
        
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <BarChartIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "#00a1ff" }} />
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">{translate("category.distribution")}</h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{translate("category.breakdown")}</p>
            <span className="text-xs sm:text-sm font-bold text-gray-900">{total} tickets</span>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChartIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
              <p className="text-sm">{translate("no.categories.found")}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Visual bars */}
              <div className="space-y-2 sm:space-y-3">
                {categoryData.map((category) => (
                  <div
                    key={category.name}
                    className={`space-y-1 sm:space-y-2 ${onSubcategoryClick ? 'cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors' : ''}`}
                    onClick={() => onSubcategoryClick?.(category.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="font-bold text-gray-900">{category.count}</span>
                        <span className="text-gray-500">({category.percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          backgroundColor: category.color,
                          width: `${category.percentage}%`,
                          boxShadow: `0 2px 4px ${category.color}40`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary stats */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{categoryData.length}</p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{translate("categories.total")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {categoryData.length > 0 ? Math.round(total / categoryData.length) : 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{translate("avg.per.category")}</p>
                  </div>
                  <div className="text-center col-span-2 sm:col-span-1">
                    <p className="text-lg sm:text-xl font-bold" style={{ color: categoryData[0]?.color || "#00a1ff" }}>
                      {categoryData[0]?.name || "N/A"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{translate("most.common")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}