import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { identity } from "@/lib/identity";
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY } from "@/lib/locale";
import "./globals.css";

/*
 * Runs before the first paint: puts the saved language on <html lang> so the Bengali font and spacing rules apply
 * immediately and the skip link below reads in the right language. The app itself picks the language up from the
 * same cookie / localStorage entry.
 */
const LOCALE_BOOT = `try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=(bn|en)/),l=m?m[1]:localStorage.getItem("${LOCALE_STORAGE_KEY}");if(l==="bn"||l==="en")document.documentElement.lang=l}catch(e){}`;

/*
 * Also before the first paint: decides whether the tea-brew loading screen (components/boot-splash.tsx, rendered by
 * app/page.tsx) plays.  It plays on the app's home page, once per browser tab session, unless the visitor prefers
 * reduced motion; add ?splash=1 to the address to replay it.  Everything else gets <html data-splash="skip"> so it
 * never flashes.
 */
const SPLASH_BOOT = `try{var d=document.documentElement,s=0;try{s=sessionStorage.getItem("bss-splash")}catch(e){}if(location.pathname!=="/"||matchMedia("(prefers-reduced-motion: reduce)").matches||(s&&location.search.indexOf("splash=1")<0)){d.setAttribute("data-splash","skip")}else{try{sessionStorage.setItem("bss-splash","1")}catch(e){}}}catch(e){}`;

export const metadata: Metadata = {
  title: identity.title,
  description: identity.description,
  applicationName: identity.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/images/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: identity.name },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b4332",
  viewportFit: "cover",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOT }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration warning:', err);
                  });
                });
              }
            `,
          }}
        />
        <a href="#main-content" className="skip-link">
          <span className="lang-en">Skip to main content</span>
          <span className="lang-bn">মূল অংশে যান</span>
        </a>
        {children}
      </body>
    </html>
  );
}
