import { Configuration, RedirectRequest } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "", // Application (client) ID from Azure
    authority: process.env.NEXT_PUBLIC_AZURE_AUTHORITY || "", // Directory (tenant) ID from Azure
    redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || "/", // Redirect URI
    postLogoutRedirectUri: "/", // Force redirect to home after logout
  },
  cache: {
    cacheLocation: "sessionStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO.
    storeAuthStateInCookie: false, // Set this to "true" if you have issues on IE11 or Edge
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: RedirectRequest = {
  scopes: ["User.Read", "User.ReadBasic.All", "profile"],
  prompt: "select_account"
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};