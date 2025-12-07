"use client";

import { useState } from "react";
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

interface UnidadMedida {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

export default function UnidadMedidaCRUD() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [unidades, setUnidades] = useState<UnidadMedida[]>([
    { Id: 1, Descripcion: "Unidad", EstaEliminado: false },
    { Id: 2, Descripcion: "Kilogramo", EstaEliminado: false },
    { Id: 3, Descripcion: "Litro", EstaEliminado: false },
  ]);
  const [unidadSeleccionada, setUnidadSeleccionada] =
    useState<UnidadMedida | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<UnidadMedida>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  // Abrir modal para crear
  const handleCrear = () => {
    setModoEdicion(false);
    setUnidadSeleccionada(null);
    setFormData({
      Descripcion: "",
      EstaEliminado: false,
    });
    onOpen();
  };

  // Abrir modal para editar
  const handleEditar = (unidad: UnidadMedida) => {
    setModoEdicion(true);
    setUnidadSeleccionada(unidad);
    setFormData(unidad);
    onOpen();
  };

  // Guardar unidad (crear o actualizar)
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

      if (modoEdicion && unidadSeleccionada) {
        // Actualizar - Simulación
        setUnidades((prev) =>
          prev.map((u) =>
            u.Id === unidadSeleccionada.Id
              ? ({ ...u, ...formData } as UnidadMedida)
              : u
          )
        );
        addToast({
          title: "Éxito",
          description: "Unidad de medida actualizada correctamente",
          color: "success",
        });
      } else {
        // Crear - Simulación
        const nuevaUnidad: UnidadMedida = {
          Id: Math.max(...unidades.map((u) => u.Id), 0) + 1,
          Descripcion: formData.Descripcion!,
          EstaEliminado: formData.EstaEliminado || false,
        };
        setUnidades([...unidades, nuevaUnidad]);
        addToast({
          title: "Éxito",
          description: "Unidad de medida creada correctamente",
          color: "success",
        });
      }

      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al guardar la unidad de medida",
        color: "danger",
      });
      console.error(error);
    }
  };

  // Eliminar unidad
  const handleEliminar = async (id: number) => {
    try {
      // Simulación de eliminado lógico
      setUnidades((prev) =>
        prev.map((u) => (u.Id === id ? { ...u, EstaEliminado: true } : u))
      );
      addToast({
        title: "Éxito",
        description: "Unidad de medida eliminada correctamente",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al eliminar la unidad de medida",
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
            Gestión de Unidades
          </h2>
          <p className="text-gray-600 mt-1">
            Administra las unidades de medida
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
        >
          + Nueva Unidad
        </Button>
      </div>

      {/* Tabla de unidades */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de unidades de medida">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>DESCRIPCIÓN</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No hay unidades registradas">
            {unidades.map((unidad) => (
              <TableRow key={unidad.Id}>
                <TableCell>{unidad.Id}</TableCell>
                <TableCell>{unidad.Descripcion}</TableCell>
                <TableCell>
                  <Chip
                    color={unidad.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {unidad.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(unidad)}
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
                        onPress={() => handleEliminar(unidad.Id)}
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
              {modoEdicion ? "Editar Unidad" : "Nueva Unidad"}
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Nombre de la unidad (ej: Litro, Kilo)"
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
                  {formData.EstaEliminado ? "Unidad Inactiva" : "Unidad Activa"}
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
