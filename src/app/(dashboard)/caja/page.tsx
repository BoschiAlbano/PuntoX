"use client";

import CajaActual from "@/components/caja/CajaActual";
import Cajas from "@/components/caja/Cajas";
import { Tab, Tabs } from "@heroui/react";
import { CrudHeader } from "@/components/shared/CrudHeader";
import { useState } from "react";

export default function CajaPage() {
  const [selected, setSelected] = useState<"caja-actual" | "cajas">(
    "caja-actual",
  );

  const headerConfig: Record<
    "caja-actual" | "cajas",
    { title: string; description: string; eyebrowLabel: string; iconSrc?: string }
  > = {
    "caja-actual": {
      title: "Caja Actual",
      description:
        "Controlá los movimientos y saldos de la caja que está abierta en este momento.",
      eyebrowLabel: "Caja",
      iconSrc: "/caja-actual-placeholder.svg",
    },
    cajas: {
      title: "Historial de Cajas",
      description:
        "Revisa el historial de cajas, arqueos y cierres para tener trazabilidad de tu dinero.",
      eyebrowLabel: "Caja",
      iconSrc: "/caja-historial-placeholder.svg",
    },
  };

  const currentHeader = headerConfig[selected];

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-8 px-2 sm:px-6 flex flex-col items-stretch h-full">
      <CrudHeader
        title={currentHeader.title}
        description={currentHeader.description}
        eyebrowLabel={currentHeader.eyebrowLabel}
        iconSrc={currentHeader.iconSrc}
      />
      <Tabs
        aria-label="Options"
        selectedKey={selected}
        onSelectionChange={(key) =>
          setSelected(key as "caja-actual" | "cajas")
        }
        className="relative"
        classNames={{
          tabList:
            "bg-white backdrop-blur-sm rounded-lg shadow-none border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
          tab: "m-[5px] p-[20px] data-[selected=true]:bg-[#67afc3]/90 data-[selected=true]:text-white data-[selected=true]:shadow-none transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2 text-[16px] cursor-pointer transform hover:scale-105 active:scale-95",
          tabContent:
            "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
          cursor: "bg-[#67afc3]/90",
          panel: "h-full",
        }}
      >
        <Tab
          key="caja-actual"
          title={
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
              </svg>
              <span>Caja Actual</span>
            </div>
          }
        >
          <CajaActual />
        </Tab>

        <Tab
          key="cajas"
          title={
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
              </svg>

              <span>Cajas</span>
            </div>
          }
        >
          <Cajas />
        </Tab>
      </Tabs>
    </div>
  );
}
