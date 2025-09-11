import { Configuration, RedirectRequest, LogLevel } from "@azure/msal-browser";

// Debug environment variables
const envVars = {
  clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID,
  authority: process.env.NEXT_PUBLIC_AZURE_AUTHORITY,
  redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI,
  nodeEnv: process.env.NODE_ENV,
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server-side'
};

console.log('🔍 Environment variables:', envVars);

if (!envVars.clientId) {
  console.error('❌ NEXT_PUBLIC_AZURE_CLIENT_ID is missing');
}
if (!envVars.authority) {
  console.error('❌ NEXT_PUBLIC_AZURE_AUTHORITY is missing');
}
if (!envVars.redirectUri) {
  console.error('❌ NEXT_PUBLIC_AZURE_REDIRECT_URI is missing');
}

// Additional browser-specific validation
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser context');
  console.log('🔍 Browser env check - CLIENT_ID:', process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('🔍 Browser env check - AUTHORITY:', process.env.NEXT_PUBLIC_AZURE_AUTHORITY ? 'SET' : 'NOT SET');
}

// Helper function to get valid environment variable or fallback
const getValidEnvVar = (envVar: string | undefined, fallback: string): string => {
  if (!envVar || envVar === 'undefined' || envVar.trim() === '') {
    return fallback;
  }
  return envVar;
};

// Validate required environment variables
const clientId = getValidEnvVar(process.env.NEXT_PUBLIC_AZURE_CLIENT_ID, "");
if (!clientId) {
  throw new Error('NEXT_PUBLIC_AZURE_CLIENT_ID is required but not provided');
}

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId, // Application (client) ID from Azure
    authority: getValidEnvVar(process.env.NEXT_PUBLIC_AZURE_AUTHORITY, "https://login.microsoftonline.com/common"), // Directory (tenant) ID from Azure
    redirectUri: getValidEnvVar(process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI, typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000"), // Redirect URI
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000", // Force redirect to home after logout
    navigateToLoginRequestUrl: false, // Set to false to prevent navigation to the original request url after login
  },
  cache: {
    cacheLocation: "sessionStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO.
    storeAuthStateInCookie: false, // Set this to "true" if you have issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
      logLevel: LogLevel.Verbose
    }
  }
};

// API Scope Configurations
export const API_SCOPES = {
  // Microsoft Graph scopes
  MICROSOFT_GRAPH: {
    USER_READ: "User.Read",
    PROFILE: "profile", 
    OPENID: "openid",
    EMAIL: "email"
  },
  
  // Custom API scopes
  MAINTENANCE_API: {
    ACCESS_AS_USER: "api://1c2fd2b9-6e0c-4f13-a3e9-40e53d7f4131/access_as_user"
  },
  
  NOTIFICATION_HUB_API: {
    REGISTER_DEVICE: "api://aeec4f18-85f7-4c67-8498-39d4af1440c1/register_device"
  }
} as const;

// Scope request configurations for different purposes
export const SCOPE_REQUESTS = {
  // Basic login scopes (for initial authentication)
  LOGIN: {
    scopes: [
      API_SCOPES.MICROSOFT_GRAPH.USER_READ,
      API_SCOPES.MICROSOFT_GRAPH.PROFILE,
      API_SCOPES.MICROSOFT_GRAPH.OPENID,
      API_SCOPES.MICROSOFT_GRAPH.EMAIL,
      API_SCOPES.MAINTENANCE_API.ACCESS_AS_USER
    ],
    prompt: "select_account"
  },
  
  // Maintenance API access
  MAINTENANCE_API: {
    scopes: [API_SCOPES.MAINTENANCE_API.ACCESS_AS_USER],
    account: null // Will be set dynamically
  },
  
  // Notification Hub device registration
  NOTIFICATION_HUB: {
    scopes: [API_SCOPES.NOTIFICATION_HUB_API.REGISTER_DEVICE],
    account: null // Will be set dynamically
  }
} as const;

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
// Convert readonly scopes to mutable array for RedirectRequest compatibility
export const loginRequest: RedirectRequest = {
  ...SCOPE_REQUESTS.LOGIN,
  scopes: [...SCOPE_REQUESTS.LOGIN.scopes]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};