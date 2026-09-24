import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ServiceWorkerRegistrar } from "@/components/layout/service-worker-registrar";

const plusJakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aivé",
    template: "%s · Aivé",
  },
  description: "A little space for your cycle and daily check-ins.",
  applicationName: "Aivé",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Aivé",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  // This is a private app for two people; never let it be indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F4C95D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body>
        <AuthProvider>
          {children}
          <ServiceWorkerRegistrar />
        </AuthProvider>
      </body>
    </html>
  );
}
