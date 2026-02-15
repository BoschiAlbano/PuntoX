"use client";

import { UserCog, Shield, FileText } from "lucide-react";
import CrudPageTabs from "@/components/shared/CrudPageTabs";
import UsuariosCRUD from "@/components/empleados/UsuariosCRUD";
import RolesCRUD from "@/components/empleados/RolesCRUD";
import AuditoriasCRUD from "@/components/empleados/AuditoriasCRUD";

const ICON_USUARIOS = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="size-5"
  >
    <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
  </svg>
);

const ICON_ROLES = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="size-5"
  >
    <path
      fillRule="evenodd"
      d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8Zm11 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8Zm-6.828 2.828a.75.75 0 0 1 0 1.061L6.11 12.95a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm3.594-3.317a.75.75 0 0 0-1.37.364l-.492 6.861a.75.75 0 0 0 1.204.65l1.043-.799.985 3.678a.75.75 0 0 0 1.45-.388l-.978-3.646 1.292.204a.75.75 0 0 0 .74-1.16l-3.874-5.764Z"
      clipRule="evenodd"
    />
  </svg>
);

const ICON_AUDITORIA = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="size-5"
  >
    <path
      fillRule="evenodd"
      d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const EMPLEADOS_TABS = [
  {
    key: "usuarios",
    title: "Usuarios",
    icon: ICON_USUARIOS,
    headerTitle: "Usuarios",
    headerDescription: "Administra los empleados, roles y permisos del sistema",
    headerIcon: <UserCog size={24} />,
    children: <UsuariosCRUD />,
  },
  {
    key: "roles",
    title: "Roles",
    icon: ICON_ROLES,
    headerTitle: "Roles",
    headerDescription: "Gestiona roles y permisos de acceso",
    headerIcon: <Shield size={24} />,
    children: <RolesCRUD />,
  },
  {
    key: "auditoria",
    title: "Auditoría",
    icon: ICON_AUDITORIA,
    headerTitle: "Auditoría",
    headerDescription: "Registro de acciones y actividad del sistema",
    headerIcon: <FileText size={24} />,
    children: <AuditoriasCRUD />,
  },
];

export default function EmpleadosPage() {
  return (
    <CrudPageTabs
      tabs={EMPLEADOS_TABS}
      defaultKey="usuarios"
      ariaLabel="Opciones de empleados"
    />
  );
}
