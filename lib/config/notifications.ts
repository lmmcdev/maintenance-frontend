// lib/config/notifications.ts
// Notification configuration constants

export const NOTIFICATION_CONFIG = {
  // Azure Notification Hub settings
  BACKEND_URL: process.env.NEXT_PUBLIC_AZURE_NH_BACKEND_URL || 'https://cservicesapi.azurewebsites.net/api/registerDevice',
  VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_KEY || 'BPSp8t7UKlJGnDei4H9RV79DfvTkm2isH4gB0GANYuj1t3yqXfbbjftCl2dH8UWnl67DfJclNcpo7Ul6sorFLek',
  
  // Default tags for device registration
  DEFAULT_TAGS: ['dept:Maintenance'] as const,
  
  // Department-specific tags
  DEPARTMENT_TAGS: {
    MAINTENANCE: 'dept:Maintenance',
    IT: 'dept:IT',
    FACILITIES: 'dept:Facilities',
    SECURITY: 'dept:Security'
  } as const,
  
  // Service Worker settings
  SW_SCOPE: '/',
  SW_PATH: '/sw.js'
} as const;

export type DepartmentTag = typeof NOTIFICATION_CONFIG.DEPARTMENT_TAGS[keyof typeof NOTIFICATION_CONFIG.DEPARTMENT_TAGS];