"use client";

import { Users, BookOpen } from "lucide-react";
import CrudPageTabs from "@/components/shared/CrudPageTabs";
import ClienteCRUD from "@/components/clientes/ClienteCRUD";
import CuentasCorrientesCRUD from "@/components/clientes/CuentasCorrientesCRUD";

const ICON_CLIENTES = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="size-5"
  >
    <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
  </svg>
);

const ICON_CTA_CTE = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="size-5"
  >
    <path
      fillRule="evenodd"
      d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5V7A2.5 2.5 0 0 0 11 4.5H8.128a2.252 2.252 0 0 1 1.884-1.488A2.25 2.25 0 0 1 12.25 1h1.5a2.25 2.25 0 0 1 2.238 2.012ZM11.5 3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.25h-3v-.25Z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M2 7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Zm2 3.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
      clipRule="evenodd"
    />
  </svg>
);

const CLIENTES_TABS = [
  {
    key: "clientes",
    title: "Clientes",
    icon: ICON_CLIENTES,
    headerTitle: "Clientes",
    headerDescription: "Gestiona los clientes y sus datos de facturación",
    headerIcon: <Users size={24} />,
    children: <ClienteCRUD />,
  },
  {
    key: "cuentas-corrientes",
    title: "Cuentas Corrientes",
    icon: ICON_CTA_CTE,
    headerTitle: "Cuentas Corrientes",
    headerDescription: "Administra las cuentas corrientes y pagos de clientes",
    headerIcon: <BookOpen size={24} />,
    children: <CuentasCorrientesCRUD />,
  },
];

export default function ClientesPage() {
  return (
    <CrudPageTabs
      tabs={CLIENTES_TABS}
      defaultKey="clientes"
      ariaLabel="Opciones de clientes"
    />
  );
}
