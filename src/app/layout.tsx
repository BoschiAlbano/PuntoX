import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderComponent from "@/components/auth/sessionProvider";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import QueryProvider from "@/components/tanstack/QueryProvider";

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
  icons: {
    icon: [
      { url: "/favicon-light.ico", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.ico", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: ["/favicon-light.ico"],
    apple: ["/favicon-light.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeroUIProvider disableAnimation={false}>
          <QueryProvider>
            <ToastProvider />
            <SessionProviderComponent>{children}</SessionProviderComponent>
          </QueryProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
