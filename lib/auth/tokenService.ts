// lib/auth/tokenService.ts
// Token acquisition service for different APIs

import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { SCOPE_REQUESTS, API_SCOPES } from "./config";

export class TokenService {
  private msalInstance: PublicClientApplication;

  constructor(msalInstance: PublicClientApplication) {
    this.msalInstance = msalInstance;
  }

  /**
   * Acquire token silently for Maintenance API
   */
  async getMaintenanceApiToken(account: AccountInfo): Promise<string | null> {
    try {
      console.log('🔑 Acquiring token for Maintenance API:', API_SCOPES.MAINTENANCE_API.ACCESS_AS_USER);
      
      const request = {
        ...SCOPE_REQUESTS.MAINTENANCE_API,
        scopes: [...SCOPE_REQUESTS.MAINTENANCE_API.scopes],
        account
      };

      const response = await this.msalInstance.acquireTokenSilent(request);
      console.log('✅ Maintenance API token acquired successfully');
      return response.accessToken;
    } catch (error) {
      console.error('❌ Failed to acquire Maintenance API token silently:', error);
      
      try {
        // Fallback to redirect if silent acquisition fails
        console.log('🔄 Attempting token acquisition via redirect...');
        await this.msalInstance.acquireTokenRedirect({
          ...SCOPE_REQUESTS.MAINTENANCE_API,
          scopes: [...SCOPE_REQUESTS.MAINTENANCE_API.scopes],
          account
        });
        return null; // Token will be available after redirect
      } catch (redirectError) {
        console.error('❌ Failed to acquire Maintenance API token via redirect:', redirectError);
        return null;
      }
    }
  }

  /**
   * Acquire token silently for Notification Hub device registration
   */
  async getNotificationHubToken(account: AccountInfo): Promise<string | null> {
    try {
      console.log('🔑 Acquiring token for Notification Hub API:', API_SCOPES.NOTIFICATION_HUB_API.REGISTER_DEVICE);
      
      const request = {
        ...SCOPE_REQUESTS.NOTIFICATION_HUB,
        scopes: [...SCOPE_REQUESTS.NOTIFICATION_HUB.scopes],
        account
      };

      const response = await this.msalInstance.acquireTokenSilent(request);
      console.log('✅ Notification Hub token acquired successfully');
      return response.accessToken;
    } catch (error) {
      console.error('❌ Failed to acquire Notification Hub token silently:', error);
      
      try {
        // Fallback to redirect if silent acquisition fails
        console.log('🔄 Attempting Notification Hub token acquisition via redirect...');
        await this.msalInstance.acquireTokenRedirect({
          ...SCOPE_REQUESTS.NOTIFICATION_HUB,
          scopes: [...SCOPE_REQUESTS.NOTIFICATION_HUB.scopes],
          account
        });
        return null; // Token will be available after redirect
      } catch (redirectError) {
        console.error('❌ Failed to acquire Notification Hub token via redirect:', redirectError);
        return null;
      }
    }
  }

  /**
   * Get all available tokens for the current account
   */
  async getAllTokens(account: AccountInfo): Promise<{
    maintenanceApi: string | null;
    notificationHub: string | null;
  }> {
    console.log('🔑 Acquiring all API tokens for account:', account.username);
    
    const [maintenanceToken, notificationHubToken] = await Promise.allSettled([
      this.getMaintenanceApiToken(account),
      this.getNotificationHubToken(account)
    ]);

    return {
      maintenanceApi: maintenanceToken.status === 'fulfilled' ? maintenanceToken.value : null,
      notificationHub: notificationHubToken.status === 'fulfilled' ? notificationHubToken.value : null
    };
  }

  /**
   * Check if account has specific scope permissions
   */
  async hasScope(account: AccountInfo, scope: string): Promise<boolean> {
    try {
      const response = await this.msalInstance.acquireTokenSilent({
        scopes: [scope],
        account
      });
      
      return response.scopes.includes(scope);
    } catch (error) {
      console.log(`ℹ️ Account does not have scope: ${scope}`);
      return false;
    }
  }

  /**
   * Log current token cache status
   */
  logTokenCacheStatus(account: AccountInfo): void {
    const cache = this.msalInstance.getTokenCache();
    console.log('🗄️ Token Cache Status for account:', {
      username: account.username,
      cacheKeys: Object.keys(cache),
      // Note: Direct cache access is limited in MSAL browser, this is just for debugging
    });
  }
}

// Export singleton factory
export const createTokenService = (instance: PublicClientApplication): TokenService => {
  return new TokenService(instance);
};