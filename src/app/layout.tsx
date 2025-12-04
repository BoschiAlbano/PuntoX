import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderComponent from "@/components/auth/sessionProvider";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Punto X",
  description: "Ecoomerce platform for local businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Favicon para Modo CLARO (Por defecto, si no hay match) */}
      <link
        rel="icon"
        href="/favicon-light.ico" // ⬅️ Tu icono para modo claro
        media="(prefers-color-scheme: light)"
      />

      {/* Favicon para Modo OSCURO */}
      <link
        rel="icon"
        href="/favicon-dark.ico" // ⬅️ Tu icono para modo oscuro
        media="(prefers-color-scheme: dark)"
      />

      {/* 💡 Opcional: Un favicon por defecto para navegadores que no soporten media queries */}
      <link rel="icon" href="/favicon-light.ico" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeroUIProvider>
          <SessionProviderComponent>
            {children}
          </SessionProviderComponent>
          <Toaster richColors />
        </HeroUIProvider>
      </body>
    </html>
  );
}
