"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SucursalSelector } from "@/components/sucursal";
import { useUserStore } from "@/store/useUserStore";
import { PuntoXLogo } from "@/components/ui/PuntoXLogo";
import { Tooltip } from "@heroui/react";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onClose?: () => void;
}

const menuSections: MenuSection[] = [
  {
    title: "Principal",
    items: [
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
        ),
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
        ),
        label: "Ventas",
        href: "/ventas",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
        label: "Caja Actual",
        href: "/caja",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v11.75A2.75 2.75 0 0 0 16.75 18h-12A2.75 2.75 0 0 1 2 15.25V3.5Zm3.75 7a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm0 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5ZM5 5.75A.75.75 0 0 1 5.75 5h4.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 8.25v-2.5Z"
              clipRule="evenodd"
            />
            <path d="M16.5 6.5h-1v8.75a1.25 1.25 0 1 0 2.5 0V8a1.5 1.5 0 0 0-1.5-1.5Z" />
          </svg>
        ),
        label: "Historial de Cajas",
        href: "/caja/historial",
      },
    ],
  },
  {
    title: "Inventario",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        ),
        label: "Productos",
        href: "/productos",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
        label: "Compras",
        href: "/compras",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        ),
        label: "Proveedores",
        href: "/proveedores",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: "Marcas",
        href: "/productos/marcas",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
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
        ),
        label: "Rubros",
        href: "/productos/rubros",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668.83.75.75 0 0 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.339 1.462A18.558 18.558 0 0 0 10 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 0 1-.338-1.462 20.01 20.01 0 0 1 3.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 0 1-.387.83A4.98 4.98 0 0 1 5 14a4.98 4.98 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.37.07-.738.148-1.103.232a.75.75 0 0 1-.336-1.462 32.845 32.845 0 0 1 6.668-.829V2.75A.75.75 0 0 1 10 2ZM5 7.543 3.92 12.33a3.499 3.499 0 0 0 2.16 0L5 7.543Zm10 0-1.08 4.787a3.498 3.498 0 0 0 2.16 0L15 7.543Z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: "Unidades de Medida",
        href: "/productos/unidades",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.065.681L5.5 17l1.435.931a.75.75 0 0 0 .826 0L9.5 17l1.435.931a.75.75 0 0 0 .826 0L13.5 17l1.435.931a.75.75 0 0 0 .826 0l1.435-.931a.75.75 0 0 0 1.065-.681V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Zm0 5.5a.75.75 0 0 0-.75.75v1.5H7.75a.75.75 0 0 0 0 1.5h1.5v1.5a.75.75 0 0 0 1.5 0v-1.5h1.5a.75.75 0 0 0 0-1.5h-1.5V8.25A.75.75 0 0 0 10 7.5Z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: "Listas de Precios",
        href: "/productos/listas-precios",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ),
        label: "Clientes",
        href: "/clientes",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
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
        ),
        label: "Cuentas Corrientes",
        href: "/clientes/cuentas-corrientes",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M1 4.25A2.25 2.25 0 0 1 3.25 2h13.5A2.25 2.25 0 0 1 19 4.25v2.531a.75.75 0 0 1-.75.75H1.75a.75.75 0 0 1-.75-.75V4.25ZM2 8.5h16v7.25A2.25 2.25 0 0 1 15.75 18H3.25A2.25 2.25 0 0 1 1 15.75V8.5Z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: "Cuentas Cte. Prov.",
        href: "/proveedores/cuentas-corrientes",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ),
        label: "Empleados",
        href: "/empleados",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8Zm11 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8Zm-6.828 2.828a.75.75 0 0 1 0 1.061L6.11 12.95a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm3.594-3.317a.75.75 0 0 0-1.37.364l-.492 6.861a.75.75 0 0 0 1.204.65l1.043-.799.985 3.678a.75.75 0 0 0 1.45-.388l-.978-3.646 1.292.204a.75.75 0 0 0 .74-1.16l-3.874-5.764Z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: "Roles",
        href: "/empleados/roles",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: "Auditoría",
        href: "/empleados/auditoria",
      },
    ],
  },
  {
    title: "Reportes",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
        label: "Analíticas",
        href: "/analiticas",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
        label: "Logs de Actividad",
        href: "/analiticas/logs",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        ),
        label: "Sucursales",
        href: "/sucursales",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
        label: "Perfil del Negocio",
        href: "/configuracion",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
        label: "Preferencias de Venta",
        href: "/configuracion/ventas",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        ),
        label: "Notificaciones",
        href: "/configuracion/notificaciones",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        ),
        label: "Seguridad y Acceso",
        href: "/configuracion/seguridad",
      },
      {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
        label: "Facturación y Región",
        href: "/configuracion/fiscal",
      },
    ],
  },
];

function SidebarComponent({ isCollapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Use global store
  const { canAccessRoute } = useUserStore();

  // Solo una sección abierta a la vez (acordeón). Por defecto "Principal".
  const [openSection, setOpenSection] = useState<string | null>("Principal");

  const toggleSection = useCallback((title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  }, []);

  // Auto-expandir la sección que contiene la ruta activa al navegar
  useEffect(() => {
    const activeSection = menuSectionsFiltradas.find((section) =>
      section.items.some((item) => pathname === item.href),
    );
    if (activeSection && openSection !== activeSection.title) {
      setOpenSection(activeSection.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Filtrar menuSections según permisos (SuperAdmin ve todo gracias a canAccessRoute)
  const menuSectionsFiltradas = useMemo(() => {
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => canAccessRoute(item.href)),
      }))
      .filter((section) => section.items.length > 0);
  }, [canAccessRoute]);

  // Prefetch todas las rutas disponibles al montar el componente para navegación instantánea
  useEffect(() => {
    menuSectionsFiltradas.forEach((section) => {
      section.items.forEach((item) => {
        router.prefetch(item.href);
      });
    });
  }, [menuSectionsFiltradas, router]);

  return (
    <motion.section
      onClick={(e) => e.stopPropagation()}
      className={`z-40 sm:relative sticky flex-col h-auto sm:flex  ${
        isCollapsed ? "sm:w-[80px] w-0" : "w-[280px]"
      }`}
      initial={false}
      animate={{
        width: isCollapsed ? "80px" : "280px",
      }}
      transition={{
        duration: 0.4,
        ease: "easeInOut",
      }}
    >
      <motion.aside
        className="fixed bg-[#182337] border-r border-slate-700/50 flex flex-col h-screen"
        initial={false}
        animate={{
          width: isCollapsed ? "80px" : "280px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        {/* Header del Sidebar */}
        <div className="w-full flex items-center justify-center p-6 border-b border-slate-700/50 ">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="logo-expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-row items-center gap-2 h-[40px] w-full  "
              >
                <PuntoXLogo className="w-12 h-12  border border-[#67afc3]/50 rounded-lg p-1 hover:rotate-345 transition-all duration-300 cursor-pointer shadow-sm shadow-[#67afc3]/50" />
                <div className="flex flex-col items-start truncate">
                  <span className="text-xl font-bold text-white">Punto X</span>
                  <span className="text-sm font-bold text-slate-400">
                    Software de gestión
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-[40px]"
              >
                <PuntoXLogo className="w-12 h-12  border border-[#67afc3]/50 rounded-lg p-1 hover:rotate-345 transition-all duration-300 cursor-pointer shadow-sm shadow-[#67afc3]/50" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selector de Sucursal */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-6 space-y-2 group cursor-pointer group-hover:text-[#5fa7b8]"
          >
            <SucursalSelector hideIfSingle={false} isCollapsed={isCollapsed} />
          </motion.div>
        </AnimatePresence>

        {/* Menu Items por Secciones */}
        <nav
          id="Scroll"
          className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide"
        >
          {menuSectionsFiltradas.map((section, sectionIndex) => {
            const isSectionCollapsed = isCollapsed
              ? false
              : openSection !== section.title;
            return (
              <div
                key={section.title}
                className={sectionIndex > 0 ? "pt-3" : ""}
              >
                {/* Título de la sección (clickeable para colapsar/expandir) */}
                <AnimatePresence mode="wait">
                  {!isCollapsed ? (
                    <motion.button
                      key={`section-label-${section.title}`}
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex items-center justify-between px-4 pb-2 pt-1 cursor-pointer group/section"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 group-hover/section:text-slate-400 transition-colors">
                        {section.title}
                      </span>
                      <motion.svg
                        animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-3.5 h-3.5 text-slate-500 group-hover/section:text-slate-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </motion.svg>
                    </motion.button>
                  ) : (
                    sectionIndex > 0 && (
                      <motion.div
                        key={`section-divider-${section.title}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mx-4 mb-2 border-t border-slate-700/40"
                      />
                    )
                  )}
                </AnimatePresence>

                {/* Items de la sección (animados al colapsar/expandir) */}
                <AnimatePresence initial={false}>
                  {!isSectionCollapsed && (
                    <motion.div
                      key={`section-items-${section.title}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href;

                          // Manejador extra para responsive
                          const handleNavigationTrigger = () => {
                            if (window.innerWidth < 768 && onClose) {
                              onClose();
                            }
                          };

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={handleNavigationTrigger}
                              className="block"
                            >
                              <Tooltip
                                content={item.label}
                                placement="right"
                                isDisabled={!isCollapsed}
                                offset={20}
                                classNames={{
                                  content:
                                    "bg-[#1f2d47] text-white font-semibold text-xs border border-slate-700/50 shadow-lg",
                                }}
                              >
                                <motion.div
                                  whileHover={{
                                    x: isCollapsed ? 0 : 2,
                                    scale: isCollapsed ? 1 : 1.01,
                                  }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`
                                      w-full h-[50px] flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden
                                      relative group cursor-pointer
                                      ${
                                        isActive
                                          ? "bg-slate-800/80 text-white shadow-none"
                                          : "text-slate-300 hover:text-white hover:bg-slate-700/30"
                                      }
                                    `}
                                >
                                  {isActive && (
                                    <motion.div
                                      layoutId="activeIndicator"
                                      className="absolute top-1 left-1 w-[5px] h-[5px] rounded-full bg-[#5fa7b8] animate-pulse"
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                      }}
                                    />
                                  )}

                                  <div
                                    className={`relative ${
                                      isActive
                                        ? "text-[#5fa7b8] animate-pulse"
                                        : "text-slate-500 dark:text-white animate-none"
                                    }`}
                                  >
                                    <div className=" group-hover:text-[#5fa7b8]">
                                      {item.icon}
                                    </div>
                                    {item.badge && (
                                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-linear-to-b from-blue-500 to-[#90c472] text-white text-xs rounded-full flex items-center justify-center">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>

                                  <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                      <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="whitespace-nowrap flex-1"
                                      >
                                        <span className="text-[13px] font-semibold tracking-wide relative z-10">
                                          {item.label}
                                        </span>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              </Tooltip>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="w-full p-4 border-t border-slate-700/50 flex flex-col gap-3 items-center">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full p-4 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                  Version 1.0.0
                </p>
                <p className="text-xs text-slate-500 truncate">
                  (c) 2024 Punto X SaaS
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  V 1.0.0
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </motion.section>

    // </section>
  );
}

// Memoizar componente para evitar re-renders innecesarios
const Sidebar = memo(SidebarComponent);
export default Sidebar;
