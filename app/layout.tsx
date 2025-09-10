import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "./(ui)/nav";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { LanguageProvider } from "../components/context/LanguageContext";

export const metadata: Metadata = { 
  title: "Maintenance",
  icons: {
    icon: '/mercedes-logo.png',
    shortcut: '/mercedes-logo.png',
    apple: '/mercedes-logo.png',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
