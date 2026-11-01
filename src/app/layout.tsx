import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { identity } from "@/lib/identity";
import "./globals.css";

export const metadata: Metadata = {
  title: identity.title,
  description: identity.description,
  applicationName: identity.name,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/images/app-icon-192.png", apple: "/images/app-icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: identity.name },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f9f6",
  viewportFit: "cover",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to main content</a>{children}</body></html>;
}
