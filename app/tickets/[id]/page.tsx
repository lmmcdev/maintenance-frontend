"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ticket } from "@/components/types/ticket";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ticketId = params.id as string;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    if (!ticketId || !apiBase) return;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ticket: ${response.status}`);
        }
        
        const data = await response.json();
        setTicket(data.data || data);
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId, apiBase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A1FF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#00A1FF] text-white rounded-lg hover:bg-[#0091e6] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h1>
          <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/tickets")}
            className="px-4 py-2 bg-[#00A1FF] text-white rounded-lg hover:bg-[#0091e6] transition-colors"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800";
      case "OPEN": return "bg-yellow-100 text-yellow-800";
      case "DONE": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Details</h1>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticket.title}</h2>
              <p className="text-gray-600">ID: {ticket.id}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ticket Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone Number:</span>
                  <p className="text-gray-900">{ticket.phoneNumber}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Category:</span>
                  <p className="text-gray-900">{ticket.category}</p>
                </div>
                {ticket.subcategory && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Subcategory:</span>
                    <p className="text-gray-900">
                      {typeof ticket.subcategory === 'string' 
                        ? ticket.subcategory 
                        : ticket.subcategory.displayName}
                    </p>
                  </div>
                )}
                {ticket.assignee && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned To:</span>
                    <p className="text-gray-900">{ticket.assignee.firstName} {ticket.assignee.lastName}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Created:</span>
                  <p className="text-gray-900">{formatDate(ticket.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                  <p className="text-gray-900">{formatDate(ticket.updatedAt)}</p>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Resolved:</span>
                    <p className="text-gray-900">{formatDate(ticket.resolvedAt)}</p>
                  </div>
                )}
                {ticket.closedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Closed:</span>
                    <p className="text-gray-900">{formatDate(ticket.closedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audio Section */}
          {(ticket.audioUrl || ticket.audio?.url) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Audio Recording</h3>
              {/* TODO: Add CustomAudioPlayer component */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Audio player will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}