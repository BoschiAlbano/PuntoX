"use client";

import { useState } from "react";
import GenericCrud from "@/components/shared/GenericCrud";
import { addToast, Chip, Button, Tooltip } from "@heroui/react";
import { EditButton, DeleteButton } from "../shared/TableActions";
import UsuarioForm from "./UsuarioForm";
import ChangePasswordModal from "./ChangePasswordModal";
import { PerfilTipo } from "../../../prisma/generated/prisma";
import { Sucursal } from "../../../prisma/generated/prisma";
import { useUserStore } from "@/store/useUserStore";
import { TIPO_PERFIL } from "@/lib/constants/comprobantes";

export type Usuario = {
  Id: number;
  id: number;
  personaId: number;
  usuarioId: number | null;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  username: string | null;
  telefono: string | null;
  direccion: string | null;
  localidadId: number | null;
  localidad: string | null;
  departamentoId?: number | null;
  provinciaId?: number | null;
  rolId: number | null;
  rolNombre: string | null;
  rolTipo?: PerfilTipo;
  sucursales?: Sucursal[];
  estado: "Activo" | "Invitado" | "Suspendido";
  legajo: string | null;
  dni: string | null;
  ultimaActividad: string | null;
};

export default function UsuariosCRUD() {
  const { user, roles } = useUserStore();
  const [passwordModalUser, setPasswordModalUser] = useState<Usuario | null>(
    null,
  );

  // Transformer para adaptar la respuesta de la API
  const transformer = (data: any): Usuario[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      Id: item.id, // Mapear id a Id para GenericCrud
    }));
  };

  return (
    <>
      <GenericCrud<Usuario>
        apiPath="/api/empleados"
        queryKey="usuarios-crud"
        searchPlaceholder="Buscar por nombre, usuario o DNI..."
        transformer={transformer}
        additionalInvalidateQueryKeys={["roles-select"]}
        columns={[
          {
            uid: "nombreCompleto",
            name: "NOMBRE",
            sortable: true,
            align: "start",
          },
          { uid: "username", name: "USUARIO", sortable: true },
          { uid: "rolNombre", name: "ROL", sortable: false },
          { uid: "legajo", name: "LEGAJO", sortable: true },
          // { uid: "sucursal", name: "SUCURSAL", sortable: false },
          { uid: "localidad", name: "LOCALIDAD", sortable: false },
          { uid: "estado", name: "ESTADO", sortable: false },
          { uid: "acciones", name: "ACCIONES" },
        ]}
        renderCell={(item, columnKey, actions) => {
          switch (columnKey) {
            case "nombreCompleto":
              return (
                <span className="font-medium text-gray-700">
                  {item.nombreCompleto}
                </span>
              );
            case "username":
              return (
                <span className="text-gray-600 text-sm font-mono">
                  {item.username || item.email || "-"}
                </span>
              );
            case "rolNombre":
              const rolColor =
                item.rolTipo === "ADMINISTRADOR" ? "primary" : "secondary";
              return (
                <Chip size="sm" color={rolColor} variant="flat">
                  {item.rolNombre || "Sin rol"}
                </Chip>
              );
            case "legajo":
              return (
                <span className="text-gray-600 text-sm">
                  {item.legajo || "-"}
                </span>
              );
            case "localidad":
              return (
                <span className="text-gray-600 text-sm">
                  {item.localidad || "Pendiente"}
                </span>
              );
            case "estado":
              const estadoColor =
                item.estado === "Activo"
                  ? "success"
                  : item.estado === "Invitado"
                    ? "warning"
                    : "danger";
              return (
                <Chip size="sm" color={estadoColor} variant="flat">
                  {item.estado}
                </Chip>
              );
            case "acciones":
              const isCurrentUser = Number(item.Id) === Number(user?.Id);

              // Check if the CURRENT user is an Administrator
              const currentUserIsAdmin = roles?.some(
                (r) =>
                  r.Tipo === TIPO_PERFIL.ADMINISTRADOR ||
                  r.Tipo === "SUPERADMIN",
              );

              // Lógica de Permisos Refinada:

              // 1. Editar / Cambiar Contraseña:
              // - Admin: Puede editar a todos.
              // - No-Admin: Solo puede editarse a sí mismo.
              const canEditOrPass = currentUserIsAdmin || isCurrentUser;

              // 2. Eliminar:
              // - Admin: Puede eliminar a todos, MENOS a sí mismo.
              // - No-Admin: No puede eliminar a nadie (ni a sí mismo, ni a otros).
              const canDelete = currentUserIsAdmin && !isCurrentUser;

              return (
                <div className="flex gap-2 w-full justify-center items-center">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="secondary"
                    onPress={() => setPasswordModalUser(item)}
                    isDisabled={!canEditOrPass}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  </Button>

                  <EditButton
                    onPress={() => actions.onEdit(item)}
                    label={`Editar ${item.nombreCompleto || "usuario"}`}
                    isDisabled={!canEditOrPass}
                  />

                  <DeleteButton
                    onPress={() => actions.onDelete(item)}
                    label={`Eliminar ${item.nombreCompleto || "usuario"}`}
                    isDisabled={!canDelete}
                  />
                </div>
              );
            default:
              return null;
          }
        }}
        FormComponent={UsuarioForm}
      />
      {passwordModalUser && (
        <ChangePasswordModal
          isOpen={!!passwordModalUser}
          onClose={() => setPasswordModalUser(null)}
          usuarioId={passwordModalUser.Id}
          userName={
            passwordModalUser.username || passwordModalUser.nombreCompleto
          }
        />
      )}
    </>
  );
}
