"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import { Chip } from "@heroui/react";
import { EditButton, DeleteButton } from "../shared/TableActions";
import UsuarioForm from "./UsuarioForm";
import { PerfilTipo } from "../../../prisma/generated/prisma";
import { Sucursal } from "../../../prisma/generated/prisma";

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
  // Transformer para adaptar la respuesta de la API
  const transformer = (data: any): Usuario[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      Id: item.id, // Mapear id a Id para GenericCrud
    }));
  };

  return (
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
          // case "sucursal":
          //   return (
          //     <span className="text-gray-600 text-sm">
          //       {/* {item.sucursales?.[0].Nombre || "-"} */}
          //       Eliminar despues
          //     </span>
          //   );
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
            return (
              <div className="flex gap-2 w-full justify-center items-center">
                <EditButton
                  onPress={() => actions.onEdit(item)}
                  label={`Editar ${item.nombreCompleto || "usuario"}`}
                />
                <DeleteButton
                  onPress={() => actions.onDelete(item)}
                  label={`Eliminar ${item.nombreCompleto || "usuario"}`}
                />
              </div>
            );
          default:
            return null;
        }
      }}
      FormComponent={UsuarioForm}
    />
  );
}
