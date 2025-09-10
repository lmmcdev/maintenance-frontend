"use client";
import { useAuth } from "../lib/auth/hooks";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/tickets");
    }
  }, [isAuthenticated, router]);

  return (
    <ProtectedRoute>
      <div>Redirecting...</div>
    </ProtectedRoute>
  );
}
