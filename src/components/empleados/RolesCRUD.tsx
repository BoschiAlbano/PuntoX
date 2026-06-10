"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import RolForm, { type RolItem } from "./RolForm";
import { EditButton, DeleteButton } from "@/components/shared/TableActions";
import { TIPO_PERFIL } from "@/lib/constants/comprobantes";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

// Roles del sistema: no se pueden editar ni eliminar
function esRolSistema(rol: RolItem): boolean {
  return (
    rol.Id < 0 ||
    rol.nombre.toLowerCase() === "administrador" ||
    rol.nombre.toLowerCase() === "admin" ||
    rol.nombre.toLowerCase() === "superadmin"
  );
}

export default function RolesCRUD() {
  const router = useRouter();
  const { setOverride } = useBreadcrumbStore();

  return (
    <GenericCrud<RolItem>
      apiPath="/api/roles"
      queryKey="roles-generic"
      searchPlaceholder="Buscar rol por nombre"
      additionalInvalidateQueryKeys={["roles-crud", "roles-select"]}
      onNewClick={() => router.push("/empleados/roles/nuevo")}
      exportConfig={{
        filename: "roles",
        columns: [
          { key: "nombre", header: "Nombre" },
          { key: "tipo", header: "Tipo" },
          { key: "descripcion", header: "Descripción" },
          { key: "usuarios", header: "Usuarios asignados" },
          { key: "permisos", header: "Permisos" },
        ],
        mapItem: (r) => ({
          nombre: r.nombre,
          tipo: r.tipo,
          descripcion: r.descripcion ?? "",
          usuarios: r.usuarios,
          permisos: (r.permisos ?? []).join(", "),
        }),
      }}
      columns={[
        {
          uid: "nombre",
          name: "ROL",
          sortable: true,
          align: "start",
        },
        { uid: "tipo", name: "TIPO", sortable: true },
        { uid: "descripcion", name: "DESCRIPCIÓN", sortable: false },
        { uid: "usuarios", name: "USUARIOS", sortable: true },
        { uid: "permisos", name: "PERMISOS", sortable: false },
        { uid: "acciones", name: "ACCIONES" },
      ]}
      renderCell={(item, columnKey, actions) => {
        switch (columnKey) {
          case "nombre":
            return (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {item.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    {item.nombre}
                  </span>
                  {esRolSistema(item) && (
                    <span className="text-[10px] font-medium text-amber-500">
                      Sistema
                    </span>
                  )}
                </div>
              </div>
            );

          case "tipo":
            return (
              <span
                className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                  item.tipo === TIPO_PERFIL.ADMINISTRADOR
                    ? "bg-[#67afc3]/10 text-[#67afc3]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.tipo}
              </span>
            );

          case "descripcion":
            return (
              <span className="text-sm text-slate-500 line-clamp-1 max-w-[240px]">
                {item.descripcion || "—"}
              </span>
            );

          case "usuarios":
            return (
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Users size={14} className="text-[#67afc3]" />
                <span>
                  {item.usuarios} usuario{item.usuarios !== 1 ? "s" : ""}
                </span>
              </div>
            );

          case "permisos": {
            const isSystemAdmin =
              item.tipo === "ADMINISTRADOR" ||
              item.tipo === "SUPERADMIN" ||
              item.nombre.toLowerCase() === "administrador" ||
              item.nombre.toLowerCase() === "admin" ||
              item.nombre.toLowerCase() === "superadmin";

            if (isSystemAdmin) {
              return (
                <span className="text-sm font-semibold text-[#67afc3]">
                  Acceso Total (Sistema)
                </span>
              );
            }

            return (
              <span className="text-sm text-slate-500">
                {(item.permisos ?? []).length > 0
                  ? `${item.permisos!.length} permiso${item.permisos!.length !== 1 ? "s" : ""}`
                  : "Sin permisos"}
              </span>
            );
          }

          case "acciones": {
            const esSistema = esRolSistema(item);
            const tieneUsuarios = item.usuarios > 0;
            return (
              <div className="flex gap-2 w-full justify-center items-center">
                <EditButton
                  tooltipContent={
                    esSistema ? "No se puede editar un rol del sistema" : "Editar"
                  }
                  isDisabled={esSistema}
                  onPress={() => {
                    setOverride(`/empleados/roles/${item.Id}`, item.nombre || "Rol");
                    router.push(`/empleados/roles/${item.Id}`);
                  }}
                />
                <DeleteButton
                  tooltipContent={
                    esSistema
                      ? "No se puede eliminar un rol del sistema"
                      : tieneUsuarios
                        ? "El rol tiene usuarios asignados"
                        : "Eliminar rol"
                  }
                  isDisabled={esSistema || tieneUsuarios}
                  onPress={() => actions.onDelete(item)}
                />
              </div>
            );
          }

          default:
            return null;
        }
      }}
    />
  );
}
