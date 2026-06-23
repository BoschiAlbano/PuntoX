import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0F2233",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://puntox.com.ar"),
  title: {
    default: "Punto X - Sistema de Gestión Empresarial",
    template: "%s | Punto X",
  },
  description:
    "Software de gestión completo para negocios. Control de inventario, ventas, facturación y CRM en una plataforma integral.",
  applicationName: "Punto X",

  // Manifest para PWA
  manifest: "/manifest.json",

  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.svg",
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },

  // App Links iOS/Android
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Punto X",
    startupImage: [
      // iPhone 14 Pro Max
      {
        url: "/splash-1170x2532.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 / 13 / 12
      {
        url: "/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone SE / 8
      {
        url: "/splash-1170x2532.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // Fallback general
      { url: "/splash-1170x2532.png" },
    ],
  },

  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0F2233",
    "msapplication-TileImage": "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
