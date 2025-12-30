"use client";

import { useState, Key, useMemo, useEffect } from "react";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { useGenericApi } from "@/hooks/useGenericApi";
import { Empleado } from "@/hooks/useEmpleados";
import { empleadoListAdapter } from "@/lib/adapters/empleado.adapter";
import { Chip, Tooltip, Button } from "@heroui/react";
import { Pencil, Trash2, Eye, Zap, Mail } from "lucide-react";
import { SortDescriptor } from "@heroui/react";

// Interfaz para el tipo Empleado con Id
interface EmpleadoWithId extends Empleado {
  Id: number;
}

interface EmpleadoCRUDProps {
  onEdit?: (empleado: EmpleadoWithId) => void;
  onDelete?: (empleado: EmpleadoWithId) => void;
  onView?: (empleado: EmpleadoWithId) => void;
  onToggleEstado?: (empleado: EmpleadoWithId) => void;
  onSendEmail?: (empleado: EmpleadoWithId) => void;
  onCreate?: () => void;
}

export default function EmpleadoCRUD({
  onEdit,
  onDelete,
  onView,
  onToggleEstado,
  onSendEmail,
  onCreate,
}: EmpleadoCRUDProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15); // Límite razonable para empleados
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "nombreCompleto",
    direction: "ascending",
  });

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Función para transformar la respuesta del API
  const transformer = (data: any) => {
    if (!Array.isArray(data)) return [];
    return empleadoListAdapter(data).map((emp) => ({
      ...emp,
      Id: emp.id, // Mapear id a Id para GenericTable
    }));
  };

  // Hook de Data
  const {
    data,
    paginationMeta,
    isLoading,
    isError,
    refetch,
  } = useGenericApi<EmpleadoWithId>({
    endpoint: "/api/empleados",
    queryKey: "empleados-generic",
    search,
    page,
    limit,
    transformer,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortedItems = useMemo(() => {
    return [...data].sort((a: EmpleadoWithId, b: EmpleadoWithId) => {
      const first = a[sortDescriptor.column as keyof EmpleadoWithId] as unknown as
        | number
        | string;
      const second = b[sortDescriptor.column as keyof EmpleadoWithId] as unknown as
        | number
        | string;
      const cmp =
        (parseInt(first as string) || first) <
        (parseInt(second as string) || second)
          ? -1
          : 1;

      if (sortDescriptor.direction === "descending") {
        return -cmp;
      }

      return cmp;
    });
  }, [sortDescriptor, data]);

  const columns: Column[] = [
    { uid: "nombreCompleto", name: "NOMBRE", sortable: true },
    { uid: "email", name: "CORREO", sortable: true },
    { uid: "rolNombre", name: "ROL", sortable: false },
    { uid: "legajo", name: "LEGAJO", sortable: true },
    { uid: "localidad", name: "LOCALIDAD", sortable: false },
    { uid: "estado", name: "ESTADO", sortable: false },
    { uid: "acciones", name: "ACCIONES" },
  ];

  const renderCell = (item: EmpleadoWithId, columnKey: Key) => {
    switch (columnKey) {
      case "nombreCompleto":
        return (
          <span className="font-medium text-gray-700">
            {item.nombreCompleto}
          </span>
        );
      case "email":
        return <span className="text-gray-600 text-sm">{item.email}</span>;
      case "rolNombre":
        const rolColor =
          item.rolTipo === "ADMINISTRADOR" ? "primary" : "secondary";
        return (
          <Chip size="sm" color={rolColor} variant="flat">
            {item.rolNombre || "Sin rol"}
          </Chip>
        );
      case "legajo":
        return <span className="text-gray-600 text-sm">{item.legajo || "-"}</span>;
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
              <Tooltip content="Editar">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => onEdit(item)}
                >
                  <Pencil size={16} />
                </Button>
              </Tooltip>
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
              <Tooltip content="Eliminar">
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => onDelete(item)}
                >
                  <Trash2 size={16} />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <GenericTable
      data={sortedItems}
      columns={columns}
      renderCell={renderCell}
      isLoading={isLoading}
      isError={isError}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por nombre, correo o DNI..."
      page={page}
      onPageChange={setPage}
      paginationMeta={paginationMeta}
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      onNewClick={onCreate}
      newButtonText="Crear nuevo usuario"
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
