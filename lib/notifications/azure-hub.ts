// lib/notifications/azure-hub.ts
// Azure Notification Hub registration utility

import { NOTIFICATION_CONFIG } from '../config/notifications';

export type DeviceRegistrationRequest = {
  deviceToken: string;
  platform: 'web' | 'ios' | 'android';
  userId?: string;
  tags?: string[];
};

export type DeviceRegistrationResponse = {
  success: boolean;
  registrationId?: string;
  message?: string;
};

export type NotificationHubOptions = {
  backendUrl?: string;
  vapidPublicKey?: string;
};

class AzureNotificationHubService {
  private backendUrl: string;
  private vapidPublicKey: string;

  constructor(options: NotificationHubOptions = {}) {
    this.backendUrl = options.backendUrl || NOTIFICATION_CONFIG.BACKEND_URL;
    this.vapidPublicKey = options.vapidPublicKey || NOTIFICATION_CONFIG.VAPID_PUBLIC_KEY;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return Notification.permission;
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission is denied');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push messaging is not supported in this browser');
    }

    const registration = await navigator.serviceWorker.ready;
    
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
    });

    return subscription;
  }

  async registerDevice(
    subscription: PushSubscription, 
    userId?: string, 
    tags?: string[],
    accessToken?: string
  ): Promise<DeviceRegistrationResponse> {
    // Generate unique installation ID based on user
    const installationId = userId ? `usermaintenance-${userId.substring(0, 8)}` : `anon-${Date.now()}`;
    
    // Transform subscription to pushChannel format
    const subscriptionJson = subscription.toJSON();
    const pushChannel = {
      endpoint: subscriptionJson.endpoint!,
      p256dh: subscriptionJson.keys!.p256dh,
      auth: subscriptionJson.keys!.auth
    };
    
    const registrationData = {
      installationId,
      platform: 'browser',
      pushChannel,
      tags: tags || ['dept:Maintenance']
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if access token is provided
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔑 Using access token for Notification Hub registration');
        console.log('🔍 Bearer token details:', {
          tokenLength: accessToken.length,
          tokenStart: accessToken.substring(0, 10) + '...',
          authorizationHeader: `Bearer ${accessToken.substring(0, 10)}...`
        });
      } else {
        console.log('⚠️ No access token provided for Notification Hub registration');
      }

      console.log('📤 Notification Hub registration request:', {
        url: this.backendUrl,
        method: 'POST',
        headers: {
          ...headers,
          'Authorization': headers['Authorization'] ? `Bearer ${headers['Authorization'].substring(7, 17)}...` : 'Not provided'
        },
        bodyData: {
          installationId: registrationData.installationId,
          platform: registrationData.platform,
          tags: registrationData.tags,
          pushChannel: {
            endpoint: registrationData.pushChannel.endpoint.substring(0, 50) + '...',
            p256dh: registrationData.pushChannel.p256dh.substring(0, 20) + '...',
            auth: registrationData.pushChannel.auth.substring(0, 10) + '...'
          }
        }
      });

      const response = await fetch(this.backendUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers,
        body: JSON.stringify(registrationData)
      });

      console.log('📥 Notification Hub registration response:', {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': response.headers.get('content-type'),
          'authorization': response.headers.get('www-authenticate') || 'Not present'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Notification Hub registration failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          wasTokenProvided: !!accessToken
        });
        throw new Error(`Registration failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Notification Hub registration successful:', {
        registrationId: result.registrationId,
        message: result.message,
        tokenUsed: !!accessToken
      });
      
      return {
        success: true,
        registrationId: result.registrationId,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async deleteInstallation(installationId: string, accessToken?: string): Promise<DeviceRegistrationResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      console.log('🗑️ Deleting previous installation:', installationId);

      const response = await fetch(`${this.backendUrl}/${installationId}`, {
        method: 'DELETE',
        mode: 'cors',
        credentials: 'omit',
        headers
      });

      if (!response.ok && response.status !== 404) {
        console.warn('⚠️ Failed to delete previous installation:', response.status);
      } else {
        console.log('✅ Previous installation deleted or didn\'t exist');
      }

      return {
        success: true,
        message: 'Installation deleted'
      };
    } catch (error) {
      console.warn('⚠️ Error deleting installation:', error);
      return {
        success: true,
        message: 'Delete attempt completed'
      };
    }
  }

  async registerForNotifications(userId?: string, tags?: string[], accessToken?: string): Promise<DeviceRegistrationResponse> {
    try {
      const permission = await this.requestNotificationPermission();
      
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Notification permission not granted'
        };
      }

      const subscription = await this.subscribeToPushNotifications();
      
      // Generate installation ID first to delete any previous registration
      const installationId = userId ? `user-${userId.substring(0, 8)}` : `anon-${Date.now()}`;
      
      // Delete previous installation to avoid duplicates
      await this.deleteInstallation(installationId, accessToken);
      
      const result = await this.registerDevice(subscription, userId, tags, accessToken);
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Export singleton instance
export const azureNotificationHub = new AzureNotificationHubService();

// Export class for custom configurations
export { AzureNotificationHubService };