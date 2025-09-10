"use client";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useAuth } from "../../lib/auth/hooks";
import { LoginButton } from "./LoginButton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, inProgress } = useAuth();
  
  if (inProgress !== "none") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        p={4}
      >
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Authentication Required
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in with your Azure account to access this application.
            </Typography>
            <LoginButton />
          </CardContent>
        </Card>
      </Box>
    );
  }
  
  return <>{children}</>;
}