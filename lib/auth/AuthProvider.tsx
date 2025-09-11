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
        console.log('🔍 Client ID in browser:', msalConfig.auth.clientId);
        console.log('🔍 Authority in browser:', msalConfig.auth.authority);
        
        // Validate client_id is not empty
        if (!msalConfig.auth.clientId || msalConfig.auth.clientId.trim() === '') {
          throw new Error('Client ID is empty or undefined in browser context');
        }
        
        await msalInstance.initialize();
        console.log('✅ MSAL initialized successfully');
        
        // Handle redirect response
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          console.log('✅ Redirect response received:', response);
          console.log('🔍 Azure Login Success - Account Info:', {
            account: response.account ? {
              username: response.account.username,
              name: response.account.name,
              localAccountId: response.account.localAccountId,
              homeAccountId: response.account.homeAccountId,
              environment: response.account.environment,
              tenantId: response.account.tenantId,
              idTokenClaims: response.account.idTokenClaims
            } : 'No account in response',
            accessToken: response.accessToken ? 'Present' : 'Not present',
            idToken: response.idToken ? 'Present' : 'Not present',
            scopes: response.scopes,
            state: response.state,
            correlationId: response.correlationId
          });
          
          // Log all current accounts in MSAL after successful auth
          const allAccounts = msalInstance.getAllAccounts();
          console.log('all accounts', allAccounts)
          console.log('📋 All MSAL Accounts after login:', allAccounts.map(acc => ({
            username: acc.username,
            localAccountId: acc.localAccountId,
            homeAccountId: acc.homeAccountId,
            tenantId: acc.tenantId,
            environment: acc.environment
          })));
        } else {
          console.log('📝 No redirect response (normal page load)');
          
          // Log existing accounts on normal page load
          const existingAccounts = msalInstance.getAllAccounts();
          if (existingAccounts.length > 0) {
            console.log('🔍 Existing MSAL Accounts found on page load:', existingAccounts.map(acc => ({
              username: acc.username,
              localAccountId: acc.localAccountId,
              homeAccountId: acc.homeAccountId,
              tenantId: acc.tenantId,
              environment: acc.environment,
              idTokenClaims: acc.idTokenClaims ? {
                oid: acc.idTokenClaims.oid,
                preferred_username: acc.idTokenClaims.preferred_username,
                email: acc.idTokenClaims.email,
                roles: acc.idTokenClaims.roles
              } : 'No claims'
            })));
          } else {
            console.log('📝 No existing accounts found on page load');
          }
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