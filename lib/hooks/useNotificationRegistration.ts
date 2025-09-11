"use client";
import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/hooks';
import { azureNotificationHub } from '../notifications/azure-hub';

export function useNotificationRegistration() {
  const { isAuthenticated, account } = useAuth();
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
          await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('✅ Service Worker registered successfully');
        }

        // Extract user ID from MSAL account
        const userId = account.homeAccountId || account.localAccountId || account.username;
        
        if (!userId) {
          console.warn('⚠️ No user ID found in MSAL account');
          return;
        }

        console.log('🔔 Registering for notifications with userId:', userId);

        // Register with Azure Notification Hub
        const result = await azureNotificationHub.registerForNotifications(
          userId,
          ['maintenance']
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