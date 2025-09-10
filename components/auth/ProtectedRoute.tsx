"use client";
import Image from "next/image";
import { useAuth } from "../../lib/auth/hooks";
import { LoginButton } from "./LoginButton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, inProgress } = useAuth();
  
  if (inProgress !== "none") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-[#00A1FF] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating mini logos and enhanced elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating mini logos scattered randomly */}
          <div className="absolute top-14 right-6 w-3 sm:w-5 h-3 sm:h-5 opacity-7 sm:opacity-9 animate-pulse">
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="absolute top-32 right-16 sm:right-32 w-2 sm:w-3 h-2 sm:h-3 opacity-5 sm:opacity-7 animate-bounce" style={{animationDelay: '1s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-28 left-12 sm:left-24 w-5 sm:w-7 h-5 sm:h-7 opacity-4 sm:opacity-6 animate-pulse" style={{animationDelay: '2s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="absolute top-44 left-2 sm:left-6 w-4 sm:w-6 h-4 sm:h-6 opacity-6 sm:opacity-8 animate-bounce" style={{animationDelay: '3s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-36 right-8 sm:right-12 w-3 sm:w-4 h-3 sm:h-4 opacity-8 sm:opacity-10 animate-pulse" style={{animationDelay: '4s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          
          {/* More scattered logos with random positioning */}
          <div className="absolute top-24 left-20 sm:left-40 w-2 h-2 opacity-6 animate-bounce" style={{animationDelay: '0.5s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={8}
              height={8}
              className="object-contain"
            />
          </div>
          <div className="absolute top-52 right-4 sm:right-10 w-4 h-4 opacity-5 animate-pulse" style={{animationDelay: '5s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-44 left-3 sm:left-8 w-5 h-5 opacity-7 animate-bounce" style={{animationDelay: '6s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="absolute top-60 left-32 sm:left-64 w-3 h-3 opacity-4 animate-pulse" style={{animationDelay: '7s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="absolute top-8 right-20 sm:right-48 w-6 h-6 opacity-8 animate-bounce" style={{animationDelay: '2.5s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-16 right-24 sm:right-56 w-2 h-2 opacity-6 animate-pulse" style={{animationDelay: '8s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={8}
              height={8}
              className="object-contain"
            />
          </div>
          <div className="absolute top-36 left-8 sm:left-16 w-4 h-4 opacity-5 animate-bounce" style={{animationDelay: '1.5s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          
          {/* Super scattered logos throughout the screen */}
          <div className="absolute top-4 left-28 sm:left-56 w-3 h-3 opacity-4 animate-pulse" style={{animationDelay: '9s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-8 left-36 sm:left-72 w-5 h-5 opacity-6 animate-bounce" style={{animationDelay: '10s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="absolute top-16 right-36 sm:right-80 w-2 h-2 opacity-8 animate-pulse" style={{animationDelay: '11s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={8}
              height={8}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-52 left-28 sm:left-52 w-4 h-4 opacity-5 animate-bounce" style={{animationDelay: '12s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <div className="absolute top-28 left-4 sm:left-12 w-6 h-6 opacity-7 animate-pulse" style={{animationDelay: '13s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-4 right-28 sm:right-64 w-3 h-3 opacity-6 animate-bounce" style={{animationDelay: '14s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="absolute top-80 left-16 sm:left-44 w-2 h-2 opacity-9 animate-pulse" style={{animationDelay: '15s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={8}
              height={8}
              className="object-contain"
            />
          </div>
          <div className="absolute top-12 right-40 sm:right-96 w-4 h-4 opacity-4 animate-bounce" style={{animationDelay: '3.5s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-24 left-40 sm:left-96 w-5 h-5 opacity-8 animate-pulse" style={{animationDelay: '16s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="absolute top-48 right-2 sm:right-4 w-6 h-6 opacity-5 animate-bounce" style={{animationDelay: '17s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-40 left-44 sm:left-80 w-3 h-3 opacity-7 animate-pulse" style={{animationDelay: '18s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="absolute top-72 right-32 sm:right-68 w-4 h-4 opacity-6 animate-bounce" style={{animationDelay: '4.5s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          
          {/* Extra logos for very large screens - spread across center areas */}
          <div className="hidden xl:block absolute top-20 left-1/2 transform -translate-x-1/2 w-3 h-3 opacity-5 animate-pulse" style={{animationDelay: '19s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="hidden xl:block absolute top-1/3 left-2/3 w-5 h-5 opacity-7 animate-bounce" style={{animationDelay: '20s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="hidden xl:block absolute bottom-1/3 right-1/2 w-4 h-4 opacity-6 animate-pulse" style={{animationDelay: '21s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <div className="hidden xl:block absolute top-2/3 left-1/3 w-2 h-2 opacity-8 animate-bounce" style={{animationDelay: '22s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={8}
              height={8}
              className="object-contain"
            />
          </div>
          <div className="hidden xl:block absolute bottom-20 left-2/3 w-6 h-6 opacity-4 animate-pulse" style={{animationDelay: '23s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="hidden xl:block absolute top-1/4 right-2/3 w-3 h-3 opacity-9 animate-bounce" style={{animationDelay: '24s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="hidden xl:block absolute top-3/4 left-3/4 w-5 h-5 opacity-5 animate-pulse" style={{animationDelay: '25s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="hidden xl:block absolute bottom-1/4 left-1/2 w-4 h-4 opacity-7 animate-bounce" style={{animationDelay: '26s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <div className="hidden 2xl:block absolute top-40 left-1/4 w-2 h-2 opacity-6 animate-pulse" style={{animationDelay: '27s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={8}
              height={8}
              className="object-contain"
            />
          </div>
          <div className="hidden 2xl:block absolute bottom-40 right-1/4 w-3 h-3 opacity-8 animate-bounce" style={{animationDelay: '28s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={12}
              height={12}
              className="object-contain"
            />
          </div>
          <div className="hidden 2xl:block absolute top-1/2 left-5/6 w-6 h-6 opacity-4 animate-pulse" style={{animationDelay: '29s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="hidden 2xl:block absolute bottom-1/2 right-5/6 w-4 h-4 opacity-9 animate-bounce" style={{animationDelay: '30s'}}>
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          
          {/* Enhanced grid pattern */}
          <div className="absolute inset-0 opacity-2 sm:opacity-3">
            <div className="h-full w-full" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.1) 1px, transparent 0)',
              backgroundSize: '80px 80px'
            }}></div>
          </div>
          
          {/* Subtle gradient orbs with better positioning */}
          <div className="absolute top-1/4 -left-16 sm:-left-24 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-r from-blue-200/8 sm:from-blue-200/12 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 -right-12 sm:-right-20 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-l from-slate-200/10 sm:from-slate-200/15 to-transparent rounded-full blur-xl"></div>
          <div className="absolute top-1/2 -right-32 w-56 h-56 bg-gradient-to-l from-blue-100/5 to-transparent rounded-full blur-3xl"></div>
        </div>

        {/* Background Logo - Large with less blur */}
        <div className="absolute -top-16 sm:-top-24 -left-16 sm:-left-24 opacity-15 sm:opacity-20 z-0">
          <div className="w-[80vw] h-[80vh] sm:w-[65vw] sm:h-[65vh]">
            <Image
              src="/mercedes-logo.png"
              alt="Mercedes Logo Background"
              width={1000}
              height={800}
              className="object-contain blur-[6px]"
              priority
            />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] shadow-2xl p-8 sm:p-10 lg:p-14 max-w-sm sm:max-w-md w-full text-center border-2 border-white/40 relative z-10 mx-4 overflow-hidden before:absolute before:inset-0 before:rounded-3xl sm:before:rounded-[2rem] before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-blue-50/20 before:-z-10">
          
          {/* Icon with enhanced styling - mobile responsive */}
          <div className="relative mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl relative overflow-hidden">
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl sm:rounded-3xl"></div>
              <div className="absolute top-2 left-2 w-2 sm:w-3 h-2 sm:h-3 bg-white/20 rounded-full blur-sm"></div>
              
              <svg className="w-7 h-7 sm:w-9 sm:h-9 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          {/* Title with enhanced typography - mobile responsive */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-6 sm:mb-8 leading-tight px-2">
            Authentication Required
          </h1>
          
          {/* Subtitle */}
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 sm:mb-10 font-medium px-2">
            Please sign in with your email to access the maintenance application.
          </p>
          
          {/* Login Button */}
          <LoginButton />
          
          {/* Enhanced footer without borders */}
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Secure Enterprise Access
              </p>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Powered by advanced security protocols
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}