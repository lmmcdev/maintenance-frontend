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

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: RedirectRequest = {
  scopes: ["User.Read", "profile", "openid", "email"],
  prompt: "select_account"
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};