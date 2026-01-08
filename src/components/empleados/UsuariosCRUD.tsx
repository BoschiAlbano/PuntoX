"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import { Chip, Tooltip } from "@heroui/react";
import { EditButton, DeleteButton } from "../shared/TableActions";
import { Eye, Zap, Mail } from "lucide-react";
import { Button } from "@heroui/react";

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
  rolTipo?: "ADMINISTRADOR" | "EMPLEADO" | null;
  estado: "Activo" | "Invitado" | "Suspendido";
  legajo: string | null;
  dni: string | null;
  ultimaActividad: string | null;
};

interface UsuariosCRUDProps {
  onEdit?: (usuario: Usuario) => void;
  onDelete?: (usuario: Usuario) => void;
  onView?: (usuario: Usuario) => void;
  onToggleEstado?: (usuario: Usuario) => void;
  onSendEmail?: (usuario: Usuario) => void;
}

export default function UsuariosCRUD({
  onEdit,
  onDelete,
  onView,
  onToggleEstado,
  onSendEmail,
}: UsuariosCRUDProps) {
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
      initialLimit={15}
      transformer={transformer}
      columns={[
        { uid: "nombreCompleto", name: "NOMBRE", sortable: true },
        { uid: "username", name: "USUARIO", sortable: true },
        { uid: "rolNombre", name: "ROL", sortable: false },
        { uid: "legajo", name: "LEGAJO", sortable: true },
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
            return (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <EditButton
                    onPress={() => onEdit(item)}
                    label={`Editar ${item.nombreCompleto}`}
                  />
                )}
                {onView && (
                  <Tooltip content="Ver detalles">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onView(item)}
                    >
                      <Eye size={16} />
                    </Button>
                  </Tooltip>
                )}
                {onToggleEstado && (
                  <Tooltip content="Suspender/Activar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onToggleEstado(item)}
                    >
                      <Zap size={16} />
                    </Button>
                  </Tooltip>
                )}
                {onSendEmail && (
                  <Tooltip content="Enviar email">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onSendEmail(item)}
                    >
                      <Mail size={16} />
                    </Button>
                  </Tooltip>
                )}
                {onDelete && (
                  <DeleteButton
                    onPress={() => onDelete(item)}
                    label={`Eliminar ${item.nombreCompleto}`}
                  />
                )}
              </div>
            );
          default:
            return null;
        }
      }}
      // No usamos FormComponent porque los usuarios tienen un formulario complejo personalizado
      FormComponent={() => null as any}
    />
  );
}
