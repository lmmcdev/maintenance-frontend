"use client";
import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/hooks';
import { azureNotificationHub } from '../notifications/azure-hub';
import { NOTIFICATION_CONFIG } from '../config/notifications';

export function useNotificationRegistration() {
  const { isAuthenticated, account, tokenService } = useAuth();
  const registrationAttempted = useRef(false);

  useEffect(() => {
    const registerForNotifications = async () => {
      // Only register once per session and when authenticated
      if (registrationAttempted.current || !isAuthenticated || !account) {
        return;
      }

      registrationAttempted.current = true;

      try {
        // Register service worker
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register(NOTIFICATION_CONFIG.SW_PATH, {
            scope: NOTIFICATION_CONFIG.SW_SCOPE
          });
          console.log('✅ Service Worker registered successfully');
        }

        // Extract user ID from MSAL account
        console.log('🔍 MSAL Account for Notifications:', {
          fullAccount: {
            username: account.username,
            name: account.name,
            localAccountId: account.localAccountId,
            homeAccountId: account.homeAccountId,
            tenantId: account.tenantId,
            environment: account.environment
          },
          availableUserIds: {
            homeAccountId: account.homeAccountId || 'not available',
            localAccountId: account.localAccountId || 'not available', 
            username: account.username || 'not available'
          }
        });

        const userId = account.homeAccountId || account.localAccountId || account.username;
        
        if (!userId) {
          console.warn('⚠️ No user ID found in MSAL account');
          console.warn('⚠️ Account object received:', account);
          return;
        }

        console.log('🔔 Selected userId for notification registration:', userId);
        console.log('🔔 Using notification tags:', NOTIFICATION_CONFIG.DEFAULT_TAGS);

        // Acquire token for Notification Hub device registration
        console.log('🔑 Acquiring token for Notification Hub device registration...');
        console.log('🔍 Account info for token acquisition:', {
          username: account.username,
          homeAccountId: account.homeAccountId,
          localAccountId: account.localAccountId
        });
        
        const notificationToken = await tokenService.getNotificationHubToken(account);
        
        if (!notificationToken) {
          console.error('❌ Failed to acquire Notification Hub token, registration aborted');
          console.error('⚠️ This means the app cannot send the Bearer token to the notification hub API');
          return;
        }

        console.log('✅ Notification Hub token acquired successfully');
        console.log('🔍 Token validation:', {
          tokenLength: notificationToken.length,
          tokenType: typeof notificationToken,
          tokenStart: notificationToken.substring(0, 20) + '...',
          hasBearer: notificationToken.includes('bearer') ? 'Token contains bearer (wrong)' : 'Token is clean (correct)'
        });

        // Register with Azure Notification Hub
        const result = await azureNotificationHub.registerForNotifications(
          userId,
          [...NOTIFICATION_CONFIG.DEFAULT_TAGS],
          notificationToken
        );

        if (result.success) {
          console.log('✅ Successfully registered for notifications:', result);
        } else {
          console.error('❌ Failed to register for notifications:', result.message);
        }
      } catch (error) {
        console.error('❌ Error during notification registration:', error);
      }
    };

    // Small delay to ensure MSAL is fully initialized
    const timer = setTimeout(registerForNotifications, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, account]);

  // Reset registration flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      registrationAttempted.current = false;
    }
  }, [isAuthenticated]);
}