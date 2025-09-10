"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth/hooks";
import { LoginButton } from "../../components/auth/LoginButton";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { UserProfile } from "../../components/auth/UserProfile";
import { LanguageToggle } from "../../components/ui/LanguageToggle";


export function Nav() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-[#00A1FF] shadow-blue-500/30 shadow-lg border-b border-blue-600/50 backdrop-blur-md relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - No longer a link */}
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/mercedes-logo.png"
                alt="Mercedes Logo"
                width={24}
                height={24}
                className="sm:w-7 sm:h-7 object-contain"
              />
            </div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">Maintenance</span>
          </div>
          
          {/* Center Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl p-1">
              <Link
                href="/tickets"
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  pathname === '/tickets' || pathname.startsWith('/tickets')
                    ? 'bg-white text-[#00A1FF] shadow-md font-bold'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Tickets
              </Link>
              <Link
                href="/dashboard"
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  pathname === '/dashboard'
                    ? 'bg-white text-[#00A1FF] shadow-md font-bold'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Dashboard
              </Link>
            </div>
          )}
          
          {/* Right side - Language Toggle & Profile */}
          <div className="flex items-center space-x-3">
            <LanguageToggle />
            
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <LoginButton variant="navbar" />
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden pb-3 pt-1">
            <div className="flex space-x-2 bg-white/20 backdrop-blur-sm rounded-xl p-1">
              <Link
                href="/tickets"
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-200 ${
                  pathname === '/tickets' || pathname.startsWith('/tickets')
                    ? 'bg-white text-[#00A1FF] shadow-md font-bold'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Tickets
              </Link>
              <Link
                href="/dashboard"
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-200 ${
                  pathname === '/dashboard'
                    ? 'bg-white text-[#00A1FF] shadow-md font-bold'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
