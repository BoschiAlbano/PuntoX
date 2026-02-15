"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { ReactNode } from "react";

export interface CrudTabItem {
  key: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  /** Encabezado específico de esta tab (cambia al seleccionarla) */
  headerTitle?: string;
  headerDescription?: string;
  headerIcon?: ReactNode;
}

interface CrudPageTabsProps {
  tabs: CrudTabItem[];
  defaultKey?: string;
  ariaLabel?: string;
  selectedKey?: string;
  onSelectionChange?: (key: string) => void;
}

/** Título de tab con icono, usado de forma consistente en las páginas CRUD. */
export function TabTitleWithIcon({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

const TABS_CLASS_NAMES = {
  tabList:
    "bg-white backdrop-blur-sm rounded-lg shadow-none border-gray-200/50 p-1 overflow-x-auto scrollbar-hide",
  tab: "m-[5px] p-[20px] data-[selected=true]:bg-[#67afc3]/90 data-[selected=true]:text-white data-[selected=true]:shadow-none transition-all duration-300 data-[hover=true]:bg-gray-100/50 data-[hover=true]:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67afc3] focus-visible:ring-offset-2 text-[16px] cursor-pointer transform hover:scale-105 active:scale-95",
  tabContent:
    "group-data-[selected=true]:text-white font-medium transition-colors duration-200",
  cursor: "bg-[#67afc3]/90",
  panel: "h-full",
};

/** Layout y estilos compartidos para páginas con tabs CRUD (Productos, Clientes, Empleados). */
export default function CrudPageTabs({
  tabs,
  defaultKey,
  ariaLabel = "Opciones",
  selectedKey,
  onSelectionChange,
}: CrudPageTabsProps) {
  const initialKey = defaultKey ?? tabs[0]?.key ?? "";
  const [internalKey, setInternalKey] = useState(initialKey);
  const isControlled = selectedKey !== undefined && onSelectionChange !== undefined;
  const activeKey = isControlled ? selectedKey : internalKey;

  const activeTab = tabs.find((t) => t.key === activeKey);
  const headerTitle = activeTab?.headerTitle ?? activeTab?.title;
  const headerDescription = activeTab?.headerDescription;
  const headerIcon = activeTab?.headerIcon ?? activeTab?.icon;

  const handleSelectionChange = (key: string) => {
    if (!isControlled) setInternalKey(key);
    onSelectionChange?.(key);
  };

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch h-full gap-4">
      {/* Encabezado dinámico según la tab seleccionada */}
      {(headerTitle || headerIcon) && (
        <header className="flex items-start gap-3 px-1 sm:px-0 pb-4 mb-1 border-b border-gray-200/80">
          {headerIcon && (
            <div
              className="flex-shrink-0 rounded-xl p-2.5 bg-[#67afc3]/15 text-[#67afc3]"
              aria-hidden
            >
              {headerIcon}
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            {headerTitle && (
              <h1 className="text-xl font-semibold text-slate-800">
                {headerTitle}
              </h1>
            )}
            {headerDescription && (
              <p className="text-sm text-gray-500">{headerDescription}</p>
            )}
          </div>
        </header>
      )}
      <Tabs
        aria-label={ariaLabel}
        selectedKey={activeKey}
        onSelectionChange={(key) => handleSelectionChange(String(key))}
        className="relative"
        classNames={TABS_CLASS_NAMES}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            title={<TabTitleWithIcon icon={tab.icon} label={tab.title} />}
          >
            {tab.children}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
