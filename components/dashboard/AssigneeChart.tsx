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
  onAssigneeClick?: (assigneeId: string) => void;
};

export function AssigneeChart({ tickets, onAssigneeClick }: AssigneeChartProps) {
  const { t: translate } = useLanguage();

  // Debug logging to see ticket data structure
  React.useEffect(() => {
    console.log('AssigneeChart received tickets:', tickets.map(t => ({
      id: t.id,
      title: t.title,
      assignee: t.assignee,
      assigneeId: t.assigneeId,
      assignees: (t as any).assignees,
      assigneeIds: (t as any).assigneeIds
    })));
  }, [tickets]);

  // Calculate assignee distribution
  const assigneeData = React.useMemo(() => {
    const assigneeMap: Record<string, { name: string; count: number; id: string; profilePhoto?: string }> = {};

    // Filter out NEW tickets
    const filteredTickets = tickets.filter(ticket => ticket.status !== 'NEW');

    filteredTickets.forEach(ticket => {
      const ticketAssignees: Array<{ name: string; id: string; profilePhoto?: string }> = [];

      // Handle different assignee data structures
      if (ticket.assignee) {
        // Single Person object with firstName and lastName
        ticketAssignees.push({
          name: `${ticket.assignee.firstName} ${ticket.assignee.lastName}`.trim(),
          id: ticket.assignee.id,
          profilePhoto: ticket.assignee.profilePhoto?.url
        });
      } else if (ticket.assigneeId) {
        // Single ID string
        ticketAssignees.push({
          name: ticket.assigneeId,
          id: ticket.assigneeId
        });
      } else if ((ticket as any).assignees && Array.isArray((ticket as any).assignees)) {
        // Array of Person objects
        (ticket as any).assignees.forEach((assignee: any) => {
          if (assignee.firstName && assignee.lastName) {
            ticketAssignees.push({
              name: `${assignee.firstName} ${assignee.lastName}`.trim(),
              id: assignee.id || assignee.firstName,
              profilePhoto: assignee.profilePhoto?.url
            });
          } else if (assignee.id) {
            ticketAssignees.push({
              name: assignee.id,
              id: assignee.id,
              profilePhoto: assignee.profilePhoto?.url
            });
          }
        });
      } else if ((ticket as any).assigneeIds && Array.isArray((ticket as any).assigneeIds)) {
        // Array of ID strings
        (ticket as any).assigneeIds.forEach((id: string) => {
          ticketAssignees.push({ name: id, id });
        });
      }

      // If no assignees found, mark as unassigned
      if (ticketAssignees.length === 0) {
        ticketAssignees.push({ name: "Unassigned", id: "unassigned" });
      }

      // Count each assignee for this ticket
      ticketAssignees.forEach(assignee => {
        if (!assigneeMap[assignee.id]) {
          assigneeMap[assignee.id] = {
            name: assignee.name,
            count: 0,
            id: assignee.id,
            profilePhoto: assignee.profilePhoto
          };
        }
        assigneeMap[assignee.id].count++;
      });
    });

    return Object.values(assigneeMap)
      .map((assignee, index) => ({
        name: assignee.name,
        id: assignee.id,
        count: assignee.count,
        color: getRandomColor(index),
        percentage: filteredTickets.length > 0 ? Math.round((assignee.count / filteredTickets.length) * 100) : 0,
        profilePhoto: assignee.profilePhoto
      }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  const total = assigneeData.reduce((sum, assignee) => sum + assignee.count, 0);

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
                  <div
                    key={assignee.id}
                    className={`space-y-1 sm:space-y-2 ${onAssigneeClick ? 'cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors' : ''}`}
                    onClick={() => onAssigneeClick?.(assignee.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Profile Photo or Color Indicator */}
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 relative">
                          {assignee.profilePhoto ? (
                            <img
                              src={assignee.profilePhoto}
                              alt={assignee.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const placeholder = e.currentTarget.nextElementSibling as HTMLDivElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`absolute inset-0 ${assignee.profilePhoto ? 'hidden' : 'flex'} items-center justify-center`}
                            style={{
                              backgroundColor: assignee.color,
                              boxShadow: `0 2px 6px ${assignee.color}40`
                            }}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
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
                    {(() => {
                      // Get all assignees with the maximum count (handle ties)
                      const maxCount = assigneeData[0]?.count || 0;
                      const topAssignees = assigneeData.filter(a => a.count === maxCount);

                      if (topAssignees.length === 0) {
                        return <p className="text-lg sm:text-xl font-bold text-gray-500">N/A</p>;
                      }

                      if (topAssignees.length === 1) {
                        const assignee = topAssignees[0];
                        return (
                          <div className="flex flex-col items-center gap-2">
                            {/* Profile Photo */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 relative">
                              {assignee.profilePhoto ? (
                                <img
                                  src={assignee.profilePhoto}
                                  alt={assignee.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const placeholder = e.currentTarget.nextElementSibling as HTMLDivElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`absolute inset-0 ${assignee.profilePhoto ? 'hidden' : 'flex'} items-center justify-center`}
                                style={{
                                  backgroundColor: assignee.color,
                                  boxShadow: `0 2px 8px ${assignee.color}40`
                                }}
                              >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-lg sm:text-xl font-bold truncate" style={{ color: assignee.color }}>
                              {assignee.name}
                            </p>
                          </div>
                        );
                      }

                      // Multiple top assignees (tie)
                      return (
                        <div className="flex flex-col gap-2">
                          {topAssignees.map((assignee) => (
                            <div key={assignee.id} className="flex items-center justify-center gap-2">
                              {/* Profile Photo */}
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
                                {assignee.profilePhoto ? (
                                  <img
                                    src={assignee.profilePhoto}
                                    alt={assignee.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const placeholder = e.currentTarget.nextElementSibling as HTMLDivElement;
                                      if (placeholder) placeholder.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`absolute inset-0 ${assignee.profilePhoto ? 'hidden' : 'flex'} items-center justify-center`}
                                  style={{
                                    backgroundColor: assignee.color,
                                    boxShadow: `0 2px 6px ${assignee.color}40`
                                  }}
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              </div>
                              <p className="text-sm sm:text-base font-bold truncate" style={{ color: assignee.color }}>
                                {assignee.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <p className="text-xs sm:text-sm text-gray-500 font-medium mt-2">{translate("top.assignee")}</p>
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