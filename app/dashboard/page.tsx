"use client";
import { TicketsDashboard } from "@/components/TicketsMobile";
import { useApiTokens } from "@/lib/hooks/useApiTokens";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { getMaintenanceToken, isLoading } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        console.log('🚀 Initializing Dashboard token...');
        const newToken = await getMaintenanceToken();
        setToken(newToken);
        setIsInitialized(true);
        console.log('✅ Dashboard token initialized:', newToken ? 'Available' : 'Not available');
      } catch (error) {
        console.error('❌ Failed to initialize dashboard token:', error);
        setIsInitialized(true); // Still allow the app to load
      }
    };

    initializeToken();
  }, [getMaintenanceToken]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00A1FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Inicializando dashboard...</p>
        </div>
      </div>
    );
  }

  return <TicketsDashboard apiBase={process.env.NEXT_PUBLIC_API_BASE} token={token || undefined} />;
}
