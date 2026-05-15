"use client";

import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { I18nProvider } from "@react-aria/i18n";
import { Suspense } from "react";

import React from "react";
import QueryProvider from "../tanstack/QueryProvider";
import SessionProviderComponent from "../auth/sessionProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastProvider
        placement="bottom-right"
        regionProps={{ className: "!z-[99999]" }}
      />
      <HeroUIProvider disableAnimation={false}>
        <QueryProvider>
          <I18nProvider locale="es-AR">
            <SessionProviderComponent>{children}</SessionProviderComponent>
          </I18nProvider>
        </QueryProvider>
      </HeroUIProvider>
    </>
  );
}
