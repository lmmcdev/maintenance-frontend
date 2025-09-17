// lib/hooks/useApiTokens.ts
// Hook for managing API tokens for different services

"use client";
import { useAuth } from '../auth/hooks';
import { useState, useCallback, useEffect } from 'react';
import { setTokenRefreshCallback } from '../api/client';

// Helper function to check if JWT token is about to expire (within 5 minutes)
function isTokenExpiring(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in ms

    return (exp - now) <= fiveMinutes;
  } catch {
    return true; // If we can't parse it, consider it expired
  }
}

interface ApiTokens {
  maintenanceApi: string | null;
  notificationHub: string | null;
}

interface TokenStatus {
  isLoading: boolean;
  error: string | null;
  tokens: ApiTokens;
}

export function useApiTokens() {
  const { account, tokenService, isAuthenticated } = useAuth();
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    isLoading: false,
    error: null,
    tokens: {
      maintenanceApi: null,
      notificationHub: null
    }
  });

  // Get all tokens
  const getAllTokens = useCallback(async () => {
    if (!account || !tokenService) {
      console.log('⚠️ No account or token service available');
      return;
    }

    setTokenStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔑 Acquiring all API tokens...');
      const tokens = await tokenService.getAllTokens(account);
      
      setTokenStatus({
        isLoading: false,
        error: null,
        tokens
      });

      console.log('✅ All tokens acquired:', {
        maintenanceApi: tokens.maintenanceApi ? 'Available' : 'Not available',
        notificationHub: tokens.notificationHub ? 'Available' : 'Not available'
      });

      return tokens;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acquire tokens';
      console.error('❌ Error acquiring tokens:', errorMessage);
      
      setTokenStatus({
        isLoading: false,
        error: errorMessage,
        tokens: {
          maintenanceApi: null,
          notificationHub: null
        }
      });
    }
  }, [account, tokenService]);

  // Get specific token for maintenance API
  const getMaintenanceToken = useCallback(async () => {
    if (!account || !tokenService) return null;

    // Check if current token is still valid
    const currentToken = tokenStatus.tokens.maintenanceApi;
    if (currentToken && !isTokenExpiring(currentToken)) {
      console.log('🎫 Using cached maintenance token');
      return currentToken;
    }

    try {
      console.log('🔄 Fetching fresh maintenance token...');
      const token = await tokenService.getMaintenanceApiToken(account);
      setTokenStatus(prev => ({
        ...prev,
        tokens: { ...prev.tokens, maintenanceApi: token }
      }));
      return token;
    } catch (error) {
      console.error('❌ Error acquiring maintenance token:', error);
      return null;
    }
  }, [account, tokenService, tokenStatus.tokens.maintenanceApi]);

  // Get specific token for notification hub
  const getNotificationHubToken = useCallback(async () => {
    if (!account || !tokenService) return null;

    // Check if current token is still valid
    const currentToken = tokenStatus.tokens.notificationHub;
    if (currentToken && !isTokenExpiring(currentToken)) {
      console.log('🎫 Using cached notification hub token');
      return currentToken;
    }

    try {
      console.log('🔄 Fetching fresh notification hub token...');
      const token = await tokenService.getNotificationHubToken(account);
      setTokenStatus(prev => ({
        ...prev,
        tokens: { ...prev.tokens, notificationHub: token }
      }));
      return token;
    } catch (error) {
      console.error('❌ Error acquiring notification hub token:', error);
      return null;
    }
  }, [account, tokenService, tokenStatus.tokens.notificationHub]);

  // Clear tokens when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setTokenStatus({
        isLoading: false,
        error: null,
        tokens: {
          maintenanceApi: null,
          notificationHub: null
        }
      });
    }
  }, [isAuthenticated]);

  // Set up token refresh callback for API client
  useEffect(() => {
    if (isAuthenticated && account && tokenService) {
      setTokenRefreshCallback(async () => {
        try {
          console.log('🔄 Refreshing maintenance token...');
          const newToken = await tokenService.getMaintenanceApiToken(account);
          setTokenStatus(prev => ({
            ...prev,
            tokens: { ...prev.tokens, maintenanceApi: newToken }
          }));
          return newToken;
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          return null;
        }
      });
    } else {
      setTokenRefreshCallback(null);
    }
  }, [isAuthenticated, account, tokenService]);

  return {
    ...tokenStatus,
    getAllTokens,
    getMaintenanceToken,
    getNotificationHubToken,
    hasMaintenanceToken: !!tokenStatus.tokens.maintenanceApi,
    hasNotificationHubToken: !!tokenStatus.tokens.notificationHub
  };
}