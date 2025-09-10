"use client";
import { useAuth } from "../../lib/auth/hooks";

interface LoginButtonProps {
  variant?: 'navbar' | 'standalone';
}

export function LoginButton({ variant = 'standalone' }: LoginButtonProps) {
  const { login, inProgress } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  if (variant === 'navbar') {
    // Version for dark navbar background
    return (
      <button
        onClick={handleLogin}
        disabled={inProgress !== "none"}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium text-sm hover:bg-white/30 active:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        {inProgress !== "none" ? "Signing in..." : "Sign in"}
      </button>
    );
  }
  
  // Version for light background (authentication page)
  return (
    <button
      onClick={handleLogin}
      disabled={inProgress !== "none"}
      className="inline-flex items-center gap-3 px-8 py-4 bg-[#00A1FF] text-white font-semibold text-base rounded-xl hover:bg-[#0081CC] active:bg-[#006BB3] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl active:shadow-md transform hover:scale-105 active:scale-95"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      {inProgress !== "none" ? "Signing in..." : "Sign in with Email"}
    </button>
  );
}