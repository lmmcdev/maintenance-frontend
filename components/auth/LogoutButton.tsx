"use client";
import { Button } from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { useAuth } from "../../lib/auth/hooks";

export function LogoutButton() {
  const { logout, inProgress } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  return (
    <Button
      variant="outlined"
      color="secondary"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      disabled={inProgress !== "none"}
    >
      {inProgress !== "none" ? "Signing out..." : "Sign out"}
    </Button>
  );
}