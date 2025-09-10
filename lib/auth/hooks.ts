"use client";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./config";
import { InteractionStatus } from "@azure/msal-browser";

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  
  const isAuthenticated = accounts.length > 0;
  const account = accounts[0];
  
  console.log('🔍 Auth hook state:', {
    accountsLength: accounts.length,
    isAuthenticated,
    inProgress,
    account: account?.username || 'no account'
  });
  
  const login = async () => {
    try {
      console.log('🔧 Starting login redirect with request:', loginRequest);
      console.log('🔧 MSAL instance configuration:', {
        clientId: instance.getConfiguration().auth.clientId,
        authority: instance.getConfiguration().auth.authority,
        redirectUri: instance.getConfiguration().auth.redirectUri
      });
      
      if (inProgress !== InteractionStatus.None) {
        console.log('⚠️ Another interaction is in progress:', inProgress);
        return;
      }
      
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await instance.logoutRedirect();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };
  
  return {
    isAuthenticated,
    account,
    login,
    logout,
    inProgress
  };
}