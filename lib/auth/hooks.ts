"use client";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./config";
import { InteractionStatus } from "@azure/msal-browser";
import { createTokenService, TokenService } from "./tokenService";
import { useMemo } from "react";

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  
  const isAuthenticated = accounts.length > 0;
  const account = accounts[0];
  
  // Create token service instance
  const tokenService = useMemo(() => createTokenService(instance as unknown as import("@azure/msal-browser").PublicClientApplication), [instance]);
  
  console.log('🔍 Auth hook state:', {
    accountsLength: accounts.length,
    isAuthenticated,
    inProgress,
    account: account?.username || 'no account'
  });

  // Detailed account tracking from Azure
  if (account) {
    console.log('account', account)
    
    /*console.log('📋 MSAL Account Details from Azure:', {
      username: account.username,
      name: account.name,
      localAccountId: account.localAccountId,
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      tenantId: account.tenantId,
      idTokenClaims: account.idTokenClaims ? {
        oid: account.idTokenClaims.oid,
        sub: account.idTokenClaims.sub,
        preferred_username: account.idTokenClaims.preferred_username,
        given_name: account.idTokenClaims.given_name,
        family_name: account.idTokenClaims.family_name,
        email: account.idTokenClaims.email,
        roles: account.idTokenClaims.roles,
        groups: account.idTokenClaims.groups,
        tid: account.idTokenClaims.tid,
        ver: account.idTokenClaims.ver,
        iat: account.idTokenClaims.iat,
        exp: account.idTokenClaims.exp
      } : 'No idTokenClaims available'
    });*/
  } else {
    console.log('⚠️ No account found in MSAL accounts array');
  }

  // Log all accounts if multiple exist
  if (accounts.length > 1) {
    console.log('📋 Multiple MSAL Accounts Found:', accounts.map((acc, index) => ({
      index,
      username: acc.username,
      localAccountId: acc.localAccountId,
      homeAccountId: acc.homeAccountId,
      tenantId: acc.tenantId
    })));
  }
  
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
    inProgress,
    tokenService
  };
}