"use client";
import { Box, Typography, Avatar } from "@mui/material";
import { useAuth } from "../../lib/auth/hooks";

export function UserProfile() {
  const { account, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !account) {
    return null;
  }
  
  const displayName = account.name || account.username || "User";
  const email = account.username;
  
  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Avatar sx={{ width: 32, height: 32 }}>
        {displayName.charAt(0).toUpperCase()}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {displayName}
        </Typography>
        {email && (
          <Typography variant="caption" color="text.secondary">
            {email}
          </Typography>
        )}
      </Box>
    </Box>
  );
}