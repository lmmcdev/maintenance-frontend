"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth/hooks";
import { useMsal } from "@azure/msal-react";

export function UserProfile() {
  const { account, isAuthenticated, logout } = useAuth();
  const { instance } = useMsal();
  const [isOpen, setIsOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (!isAuthenticated || !account) {
    return null;
  }
  
  const displayName = account.name || account.username || "User";
  const email = account.username;
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  // Initialize profile photo on mount
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!account) return;
      
      console.log('🔍 Account data:', account);
      console.log('🔍 idTokenClaims:', account?.idTokenClaims);
      console.log('🔍 localAccountId:', account?.localAccountId);
      
      // First try to get picture from ID token claims
      if (account?.idTokenClaims?.picture) {
        console.log('✅ Found picture in idTokenClaims:', account.idTokenClaims.picture);
        setProfilePhoto(account.idTokenClaims.picture);
        return;
      }
      
      // If no picture in claims, try Microsoft Graph API
      try {
        console.log('🔧 Trying to get access token for Graph API');
        
        // Get access token for Microsoft Graph
        const request = {
          scopes: ["User.Read"],
          account: account,
        };
        
        const response = await instance.acquireTokenSilent(request);
        console.log('✅ Got access token');
        
        // Try to fetch profile photo from Graph API
        const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            'Authorization': `Bearer ${response.accessToken}`,
          },
        });
        
        if (graphResponse.ok) {
          const blob = await graphResponse.blob();
          const photoUrl = URL.createObjectURL(blob);
          console.log('✅ Successfully fetched profile photo from Graph API');
          setProfilePhoto(photoUrl);
        } else {
          console.log('❌ Failed to fetch photo from Graph API:', graphResponse.status);
        }
      } catch (error) {
        console.log('❌ Error fetching profile photo:', error);
      }
    };
    
    fetchProfilePhoto();
    
    // Cleanup function to revoke object URLs
    return () => {
      if (profilePhoto && profilePhoto.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhoto);
      }
    };
  }, [account]);
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white font-medium text-sm hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 overflow-hidden"
      >
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt="Profile"
            className="w-full h-full object-cover rounded-full"
            onError={() => setProfilePhoto(null)}
          />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 py-2 z-[9999]">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-900 to-slate-700 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setProfilePhoto(null)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{email}</p>
              </div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={async () => {
              setIsOpen(false);
              await logout();
              // Force redirect to home page after logout
              window.location.href = "/";
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}