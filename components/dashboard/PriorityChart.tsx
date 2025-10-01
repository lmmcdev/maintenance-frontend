"use client";

import React from "react";
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useLanguage } from "../context/LanguageContext";

type PriorityChartProps = {
  priorities: Record<string, number>;
  onPriorityClick?: (priority: string) => void;
};

export function PriorityChart({ priorities, onPriorityClick }: PriorityChartProps) {
  const { t } = useLanguage();
  const total = priorities.LOW + priorities.MEDIUM + priorities.HIGH + priorities.URGENT || 1;

  const priorityData = (["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => ({
    priority: p,
    count: priorities[p] || 0,
    percentage: Math.round(((priorities[p] || 0) / total) * 100),
    color: { URGENT: "#DC2626", HIGH: "#EA580C", MEDIUM: "#F59E0B", LOW: "#10B981" }[p],
  })).filter(item => item.count > 0);

  // Calculate cumulative percentages for pie chart segments
  let cumulativePercentage = 0;
  const pieSegments = priorityData.map((item) => {
    const startAngle = cumulativePercentage * 3.6; // Convert percentage to degrees
    cumulativePercentage += item.percentage;
    const endAngle = cumulativePercentage * 3.6;
    return { ...item, startAngle, endAngle };
  });

  const createPieSlice = (startAngle: number, endAngle: number, color: string) => {
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    
    // Special case for full circle (100%)
    if (endAngle - startAngle >= 360) {
      return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY} Z`;
    }
    
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <section>
      <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white overflow-hidden h-full flex flex-col" 
           style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
        
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <PriorityHighIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "#DC2626" }} />
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">{t("priority.distribution")}</h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{t("priority.breakdown")}</p>
            <span className="text-xs sm:text-sm font-bold text-gray-900">{total} tickets</span>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-3 sm:p-4 md:p-6 flex-1 flex flex-col">
          {priorityData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PriorityHighIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                <p className="text-sm">No priorities found</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col xl:flex-row items-center gap-4 sm:gap-6">
              {/* Pie Chart */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <svg width="200" height="200" viewBox="0 0 200 200" className="w-36 h-36 sm:w-44 sm:h-44 xl:w-48 xl:h-48">
                  {pieSegments.map((segment) => (
                    <g key={segment.priority} onClick={() => onPriorityClick?.(segment.priority)}>
                      <path
                        d={createPieSlice(segment.startAngle, segment.endAngle, segment.color)}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="3"
                        className={`hover:opacity-90 transition-all duration-300 ${onPriorityClick ? 'cursor-pointer' : ''} hover:stroke-4`}
                        style={{
                          filter: `drop-shadow(0 3px 6px ${segment.color}30)`,
                          transformOrigin: '100px 100px'
                        }}
                      />
                    </g>
                  ))}
                  {/* Center circle for donut effect */}
                  <circle
                    cx="100"
                    cy="100"
                    r="40"
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                  {/* Center text */}
                  <text x="100" y="92" textAnchor="middle" className="text-sm font-bold fill-gray-900" style={{ fontSize: '14px' }}>
                    {total}
                  </text>
                  <text x="100" y="110" textAnchor="middle" className="text-xs fill-gray-500" style={{ fontSize: '11px' }}>
                    tickets
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="flex-1 w-full xl:w-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 sm:gap-3">
                  {priorityData.map((item) => (
                    <div
                      key={item.priority}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50/80 transition-all duration-200 border border-transparent hover:border-gray-200/50 ${onPriorityClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onPriorityClick?.(item.priority)}
                    >
                      <div
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: `0 2px 6px ${item.color}40`,
                          border: '2px solid white'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                            {t(`priority.${item.priority.toLowerCase()}`)}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <span className="font-bold text-gray-900">{item.count}</span>
                            <span className="text-gray-500 font-medium">({item.percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}