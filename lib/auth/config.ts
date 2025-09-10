import { Configuration, RedirectRequest, LogLevel } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "", // Application (client) ID from Azure
    authority: process.env.NEXT_PUBLIC_AZURE_AUTHORITY || "", // Directory (tenant) ID from Azure
    redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000"), // Redirect URI
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