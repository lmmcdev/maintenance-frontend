"use client";
import { Button } from "@mui/material";
import { Login as LoginIcon } from "@mui/icons-material";
import { useAuth } from "../../lib/auth/hooks";

export function LoginButton() {
  const { login, inProgress } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<LoginIcon />}
      onClick={handleLogin}
      disabled={inProgress !== "none"}
    >
      {inProgress !== "none" ? "Signing in..." : "Sign in with Azure"}
    </Button>
  );
}