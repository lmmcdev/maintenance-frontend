"use client";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./config";

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  
  const isAuthenticated = accounts.length > 0;
  const account = accounts[0];
  
  const login = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await instance.logoutRedirect();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };
  
  return {
    isAuthenticated,
    account,
    login,
    logout,
    inProgress
  };
}