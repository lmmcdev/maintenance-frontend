import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "./(ui)/nav";
import { AuthProvider } from "../lib/auth/AuthProvider";

export const metadata: Metadata = { title: "Maintenance" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50">
        <AuthProvider>
          <Nav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
