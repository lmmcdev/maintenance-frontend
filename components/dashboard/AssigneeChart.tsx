"use client";

import React from "react";
import PeopleIcon from '@mui/icons-material/People';
import { Ticket } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";

function getRandomColor(index: number) {
  const colors = [
    "#00a1ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
    "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1"
  ];
  return colors[index % colors.length];
}

type AssigneeChartProps = {
  tickets: Ticket[];
};

export function AssigneeChart({ tickets }: AssigneeChartProps) {
  const { t: translate } = useLanguage();

  // Calculate assignee distribution
  const assigneeData = React.useMemo(() => {
    const assigneeCount: Record<string, number> = {};
    
    tickets.forEach(ticket => {
      let assigneeName = "Unassigned";
      
      if (ticket.assignee) {
        // Person object with firstName and lastName
        assigneeName = `${ticket.assignee.firstName} ${ticket.assignee.lastName}`.trim();
      } else if (ticket.assigneeId) {
        // Just ID string
        assigneeName = ticket.assigneeId;
      }
      
      assigneeCount[assigneeName] = (assigneeCount[assigneeName] || 0) + 1;
    });

    return Object.entries(assigneeCount)
      .map(([name, count], index) => ({
        name,
        count,
        color: getRandomColor(index),
        percentage: tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  const total = tickets.length;

  return (
    <section>
      <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white overflow-hidden h-full flex flex-col" 
           style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
        
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <PeopleIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "#8b5cf6" }} />
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">{translate("assignee.distribution")}</h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{translate("assignee.breakdown")}</p>
            <span className="text-xs sm:text-sm font-bold text-gray-900">{total} tickets</span>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-3 sm:p-4 md:p-6 flex-1 flex flex-col">
          {assigneeData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PeopleIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                <p className="text-sm">{translate("no.assignees.found")}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
              {/* Visual bars */}
              <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto">
                {assigneeData.map((assignee) => (
                  <div key={assignee.name} className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div 
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: assignee.color,
                            boxShadow: `0 2px 6px ${assignee.color}40`,
                            border: '2px solid white'
                          }}
                        />
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                          {assignee.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm flex-shrink-0 ml-2">
                        <span className="font-bold text-gray-900">{assignee.count}</span>
                        <span className="text-gray-500 font-medium">({assignee.percentage}%)</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          backgroundColor: assignee.color,
                          width: `${assignee.percentage}%`,
                          boxShadow: `0 2px 6px ${assignee.color}40`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary stats */}
              <div className="pt-3 sm:pt-4 border-t border-gray-100 flex-shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{assigneeData.length}</p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{translate("assignees.total")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {assigneeData.length > 0 ? Math.round(total / assigneeData.length) : 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{translate("avg.per.assignee")}</p>
                  </div>
                  <div className="text-center col-span-2 sm:col-span-1">
                    <p className="text-lg sm:text-xl font-bold truncate" style={{ color: assigneeData[0]?.color || "#8b5cf6" }}>
                      {assigneeData[0]?.name || "N/A"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{translate("top.assignee")}</p>
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