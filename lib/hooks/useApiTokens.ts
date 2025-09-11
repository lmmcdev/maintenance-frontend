// lib/hooks/useApiTokens.ts
// Hook for managing API tokens for different services

"use client";
import { useAuth } from '../auth/hooks';
import { useState, useCallback, useEffect } from 'react';

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

    try {
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
  }, [account, tokenService]);

  // Get specific token for notification hub
  const getNotificationHubToken = useCallback(async () => {
    if (!account || !tokenService) return null;

    try {
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
  }, [account, tokenService]);

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

  return {
    ...tokenStatus,
    getAllTokens,
    getMaintenanceToken,
    getNotificationHubToken,
    hasMaintenanceToken: !!tokenStatus.tokens.maintenanceApi,
    hasNotificationHubToken: !!tokenStatus.tokens.notificationHub
  };
}