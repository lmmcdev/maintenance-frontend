import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "./(ui)/nav";

export const metadata: Metadata = { title: "Maintenance" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50">
        <Nav />
        {children}
      </body>
    </html>
  );
}
