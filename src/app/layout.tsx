import type { Metadata } from "next";
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
    icon: "/icon.ico",
    shortcut: "/icon.ico",
    apple: "/icon.ico",
  },

  // App Links
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Punto X",
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
