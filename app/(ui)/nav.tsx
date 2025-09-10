"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useAuth } from "../../lib/auth/hooks";
import { LoginButton } from "../../components/auth/LoginButton";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { UserProfile } from "../../components/auth/UserProfile";


export function Nav() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/tickets" style={{ textDecoration: 'none', color: 'inherit' }}>
            Maintenance
          </Link>
        </Typography>
        
        {isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
            <Button
              component={Link}
              href="/tickets"
              color={pathname === '/tickets' ? 'primary' : 'inherit'}
            >
              Tickets
            </Button>
            <Button
              component={Link}
              href="/dashboard"
              color={pathname === '/dashboard' ? 'primary' : 'inherit'}
            >
              Dashboard
            </Button>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <>
              <UserProfile />
              <LogoutButton />
            </>
          ) : (
            <LoginButton />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
