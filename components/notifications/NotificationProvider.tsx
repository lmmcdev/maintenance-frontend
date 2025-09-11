"use client";
import { useNotificationRegistration } from '../../lib/hooks/useNotificationRegistration';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNotificationRegistration();
  
  return <>{children}</>;
}