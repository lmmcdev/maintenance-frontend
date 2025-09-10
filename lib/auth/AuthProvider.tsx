"use client";
import React, { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./config";

// Create MSAL instance outside of the component to prevent recreation on each render
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        console.log('🔧 Initializing MSAL with config:', msalConfig);
        await msalInstance.initialize();
        console.log('✅ MSAL initialized successfully');
        
        // Handle redirect response
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          console.log('✅ Redirect response received:', response);
        } else {
          console.log('📝 No redirect response (normal page load)');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Error initializing MSAL:', error);
        setIsInitialized(true); // Set to true anyway to avoid infinite loading
      }
    };

    initializeMsal();
  }, []);

  if (!isInitialized) {
    return <div>Loading authentication...</div>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}