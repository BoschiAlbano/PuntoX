"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Switch,
  Chip,
  Tooltip,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import type { TenantUser } from "@/types/auth";

interface Marca {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

export default function MarcaCRUD() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<Marca | null>(
    null
  );
  const [modoEdicion, setModoEdicion] = useState(false);

  const { user } = useSupabaseAuthContext();

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Marca>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  useEffect(() => {
    const loadMarcas = async () => {
      try {
        const response = await fetch("/api/marcas");
        if (!response.ok) {
          throw new Error("Error al cargar marcas");
        }
        const data = await response.json();
        const listado = Array.isArray(data?.marcas) ? data.marcas : [];
        setMarcas(listado);
      } catch (err) {
        console.error("Error al obtener marcas:", err);
        setMarcas([]);
      }
    };

    loadMarcas();
  }, []);

  // Abrir modal para crear
  const handleCrear = () => {
    setModoEdicion(false);
    setMarcaSeleccionada(null);
    setFormData({
      Descripcion: "",
      EstaEliminado: false,
    });
    onOpen();
  };

  // Abrir modal para editar
  const handleEditar = (marca: Marca) => {
    setModoEdicion(true);
    setMarcaSeleccionada(marca);
    setFormData(marca);
    onOpen();
  };

  // Guardar marca (crear o actualizar)
  const handleGuardar = async () => {
    try {
      // Validaciones básicas
      if (!formData.Descripcion || formData.Descripcion.trim() === "") {
        addToast({
          title: "Error",
          description: "La descripción es obligatoria",
          color: "danger",
        });
        return;
      }

      if (modoEdicion && marcaSeleccionada) {
        // Actualizar - Simulación
        setMarcas((prev) =>
          prev.map((m) =>
            m.Id === marcaSeleccionada.Id ? ({ ...m, ...formData } as Marca) : m
          )
        );
        addToast({
          title: "Éxito",
          description: "Marca actualizada correctamente",
          color: "success",
        });
      } else {
        const getTenantId = (u: TenantUser | null) => {
          if (!u) return process.env.NEXT_PUBLIC_TENANT_ID;
          const fromMeta =
            (u.user_metadata?.tenant_id as string | number | undefined) ??
            (u.user_metadata?.tenantId as string | number | undefined);
          const fromApp = u.app_metadata?.tenant_id as
            | string
            | number
            | undefined;
          return u.tenantId ?? fromMeta ?? fromApp ?? process.env.NEXT_PUBLIC_TENANT_ID;
        };

        const tenantId = getTenantId(user);

        const response = await fetch("/api/marcas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            TenantId: tenantId ? Number(tenantId) : undefined,
          }),
        });

        if (!response.ok) {
          addToast({
            title: "Error",
            description: "Error al guardar la marca",
            color: "danger",
          });
          return;
        }
        const data = await response.json();
        setMarcas((prev) => [...prev, data]);
        addToast({
          title: "Éxito",
          description: "Marca creada correctamente",
          color: "success",
        });
      }

      onClose();
    } catch {
      addToast({
        title: "Error",
        description: "Error al guardar la marca",
        color: "danger",
      });
    }
  };

  // Eliminar marca
  const handleEliminar = async (id: number) => {
    try {
      // Simulación de eliminado lógico
      const response = await fetch(`/api/marcas/?Id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        addToast({
          title: "Error",
          description: "Error al eliminar la marca",
          color: "danger",
        });
        return;
      }

      setMarcas((prev) => prev.filter((m) => m.Id !== id));

      addToast({
        title: "Éxito",
        description: "Marca eliminada correctamente",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al eliminar la marca",
        color: "danger",
      });
      console.error(error);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header con botón crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Marcas
          </h2>
          <p className="text-gray-600 mt-1">
            Administra las marcas de tus productos
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
        >
          + Nueva Marca
        </Button>
      </div>

      {/* Tabla de marcas */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de marcas">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>DESCRIPTION</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No hay marcas registradas">
            {marcas.map((marca) => (
              <TableRow key={marca.Id}>
                <TableCell>{marca.Id}</TableCell>
                <TableCell>{marca.Descripcion}</TableCell>
                <TableCell>
                  <Chip
                    color={marca.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {marca.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(marca)}
                      >
                        ✏️
                      </Button>
                    </Tooltip>
                    <Tooltip content="Eliminar" color="danger">
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => handleEliminar(marca.Id)}
                      >
                        🗑️
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        backdrop="opaque"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b border-gray-200">
            <h3 className="text-xl font-bold">
              {modoEdicion ? "Editar Marca" : "Nueva Marca"}
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Nombre de la marca"
                value={formData.Descripcion || ""}
                onChange={(e) =>
                  setFormData({ ...formData, Descripcion: e.target.value })
                }
                isRequired
              />
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={!formData.EstaEliminado}
                  onValueChange={(value) =>
                    setFormData({ ...formData, EstaEliminado: !value })
                  }
                  color={formData.EstaEliminado ? "danger" : "success"}
                >
                  {formData.EstaEliminado ? "Marca Inactiva" : "Marca Activa"}
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200">
            <Button color="danger" variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleGuardar}>
              {modoEdicion ? "Actualizar" : "Crear"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
