"use client";
import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./config";

// Create MSAL instance outside of the component to prevent recreation on each render
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}