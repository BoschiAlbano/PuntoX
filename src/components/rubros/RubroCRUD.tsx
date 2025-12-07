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

interface Rubro {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

export default function RubroCRUD() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rubros, setRubros] = useState<Rubro[]>([
    { Id: 1, Descripcion: "Almacén", EstaEliminado: false },
    { Id: 2, Descripcion: "Bebidas", EstaEliminado: false },
  ]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState<Rubro | null>(
    null
  );
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Rubro>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  // Abrir modal para crear
  const handleCrear = () => {
    setModoEdicion(false);
    setRubroSeleccionado(null);
    setFormData({
      Descripcion: "",
      EstaEliminado: false,
    });
    onOpen();
  };

  // Abrir modal para editar
  const handleEditar = (rubro: Rubro) => {
    setModoEdicion(true);
    setRubroSeleccionado(rubro);
    setFormData(rubro);
    onOpen();
  };

  // Guardar rubro (crear o actualizar)
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

      if (modoEdicion && rubroSeleccionado) {
        // Actualizar - Simulación
        setRubros((prev) =>
          prev.map((r) =>
            r.Id === rubroSeleccionado.Id ? ({ ...r, ...formData } as Rubro) : r
          )
        );
        addToast({
          title: "Éxito",
          description: "Rubro actualizado correctamente",
          color: "success",
        });
      } else {
        // Crear - Simulación
        const nuevoRubro: Rubro = {
          Id: Math.max(...rubros.map((r) => r.Id), 0) + 1,
          Descripcion: formData.Descripcion!,
          EstaEliminado: formData.EstaEliminado || false,
        };
        setRubros([...rubros, nuevoRubro]);
        addToast({
          title: "Éxito",
          description: "Rubro creado correctamente",
          color: "success",
        });
      }

      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al guardar el rubro",
        color: "danger",
      });
      console.error(error);
    }
  };

  // Eliminar rubro
  const handleEliminar = async (id: number) => {
    try {
      // Simulación de eliminado lógico
      setRubros((prev) =>
        prev.map((r) => (r.Id === id ? { ...r, EstaEliminado: true } : r))
      );
      addToast({
        title: "Éxito",
        description: "Rubro eliminado correctamente",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al eliminar el rubro",
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
            Gestión de Rubros
          </h2>
          <p className="text-gray-600 mt-1">
            Administra los rubros de tus productos
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
        >
          + Nuevo Rubro
        </Button>
      </div>

      {/* Tabla de rubros */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de rubros">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>DESCRIPCIÓN</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No hay rubros registrados">
            {rubros.map((rubro) => (
              <TableRow key={rubro.Id}>
                <TableCell>{rubro.Id}</TableCell>
                <TableCell>{rubro.Descripcion}</TableCell>
                <TableCell>
                  <Chip
                    color={rubro.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {rubro.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(rubro)}
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
                        onPress={() => handleEliminar(rubro.Id)}
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
              {modoEdicion ? "Editar Rubro" : "Nuevo Rubro"}
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <Input
                label="Descripción"
                placeholder="Nombre del rubro"
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
                  {formData.EstaEliminado ? "Rubro Inactivo" : "Rubro Activo"}
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
