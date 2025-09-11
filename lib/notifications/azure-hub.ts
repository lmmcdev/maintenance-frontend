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
    tags?: string[]
  ): Promise<DeviceRegistrationResponse> {
    const deviceToken = JSON.stringify(subscription);
    
    const registrationData: DeviceRegistrationRequest = {
      deviceToken,
      platform: 'web',
      userId,
      tags
    };

    try {
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Registration failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
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

  async registerForNotifications(userId?: string, tags?: string[]): Promise<DeviceRegistrationResponse> {
    try {
      const permission = await this.requestNotificationPermission();
      
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Notification permission not granted'
        };
      }

      const subscription = await this.subscribeToPushNotifications();
      const result = await this.registerDevice(subscription, userId, tags);
      
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
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

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