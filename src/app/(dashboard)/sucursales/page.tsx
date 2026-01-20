"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  Users,
  Edit,
  Trash2,
  Star,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSucursales } from "@/hooks/useSucursales";
import { useUserStore } from "@/store/useUserStore";

type Sucursal = {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esPrincipal: boolean;
  estaActiva: boolean;
  fechaCreacion: string;
  cantidadUsuarios: number;
};

export default function SucursalesPage() {
  const queryClient = useQueryClient();
  const { data: sucursales = [], isLoading } = useSucursales();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);

  const userStore = useUserStore();
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    esPrincipal: false,
  });

  // Abrir modal para crear
  const handleNuevaSucursal = () => {
    setEditingSucursal(null);
    setFormData({
      nombre: "",
      direccion: "",
      telefono: "",
      esPrincipal: false,
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEditarSucursal = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion || "",
      telefono: sucursal.telefono || "",
      esPrincipal: sucursal.esPrincipal,
    });
    setIsModalOpen(true);
  };

  // Guardar sucursal
  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      addToast({
        title: "Sucursal",
        description: "El nombre es requerido",
      });
      return;
    }

    try {
      setIsSaving(true);
      const url = editingSucursal
        ? `/api/sucursales/${editingSucursal.id}`
        : "/api/sucursales";
      const method = editingSucursal ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["sucursales"] });
        const data = await res.json();
        userStore.pushBranch({
          Id: data?.sucursal?.id || "",
          Nombre: data?.sucursal?.nombre || "",
          EsPrincipal: data?.sucursal?.esPrincipal || false,
          esDefault: false,
        });
      } else {
        // const data = await res.json();
        // alert(data.error || "Error al guardar");
        addToast({
          title: "Sucursal",
          description: "Error al guardar",
        });
      }
    } catch (error) {
      addToast({
        title: "Sucursal",
        description: "Error al guardar",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar sucursal
  const handleEliminar = async (sucursal: Sucursal) => {
    if (userStore.currentBranch.Id == sucursal.id.toString()) {
      addToast({
        title: "Sucursal",
        description: "No se puede eliminar la sucursal actual",
      });
      return;
    }

    try {
      addToast({
        title: "Sucursal",
        description: "Cargando...",
        promise: fetch(`/api/sucursales/${sucursal.id}`, {
          method: "DELETE",
        }).then((res) => {
          if (res.ok) {
            userStore.removeBranch(sucursal.id.toString());
            queryClient.invalidateQueries({ queryKey: ["sucursales"] });
          } else {
            addToast({
              title: "Sucursal",
              description: "Error al eliminar",
            });
          }
        }),
        shouldShowTimeoutProgress: true,
        timeout: 500,
      });
      // const res = await fetch(`/api/sucursales/${sucursal.id}`, {
      //   method: "DELETE",
      // });

      // if (res.ok) {
      //   userStore.removeBranch(sucursal.id.toString());
      //   await queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      // } else {
      //   // const data = await res.json();
      //   // alert(data.error || "Error al eliminar");
      //   addToast({
      //     title: "Sucursal",
      //     description: "Error al eliminar",
      //   });
      // }
    } catch (error) {
      addToast({
        title: "Sucursal",
        description: "Error al eliminar",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch h-auto  min-h-full">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#67afc3]" />
            Sucursales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona las sucursales de tu comercio
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={handleNuevaSucursal}
        >
          Nueva Sucursal
        </Button>
      </div>

      {/* Lista de sucursales */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : sucursales.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay sucursales registradas</p>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              className="mt-4"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleNuevaSucursal}
            >
              Crear Primera Sucursal
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sucursales.map((sucursal) => (
            <Card
              key={sucursal.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex justify-between items-start pb-2">
                <div className="flex items-start gap-2 flex-1">
                  <Building2 className="h-5 w-5 text-[#67afc3] mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {sucursal.nombre}
                      </h3>
                      {sucursal.esPrincipal && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={sucursal.estaActiva ? "success" : "default"}
                      >
                        {sucursal.estaActiva ? "Activa" : "Inactiva"}
                      </Chip>
                      {sucursal.esPrincipal && (
                        <Chip size="sm" variant="flat" color="warning">
                          Principal
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="space-y-2 text-sm">
                  {sucursal.direccion && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="flex-1">{sucursal.direccion}</span>
                    </div>
                  )}
                  {sucursal.telefono && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{sucursal.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>
                      {sucursal.cantidadUsuarios}{" "}
                      {sucursal.cantidadUsuarios === 1 ? "usuario" : "usuarios"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Edit className="h-3 w-3" />}
                    onPress={() => handleEditarSucursal(sucursal)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  {!sucursal.esPrincipal && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      startContent={<Trash2 className="h-3 w-3" />}
                      onPress={() =>
                        addToast({
                          title: "Sucursal",
                          description:
                            "¿Eliminar sucursal " + sucursal.nombre + "?",
                          endContent: (
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => handleEliminar(sucursal)}
                            >
                              Aceptar
                            </Button>
                          ),
                        })
                      }
                      className="flex-1"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingSucursal ? "Editar Sucursal" : "Nueva Sucursal"}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Ej: Casa Central, Sucursal Norte"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    isRequired
                  />
                  <Input
                    label="Dirección"
                    placeholder="Dirección completa"
                    value={formData.direccion}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                  />
                  <Input
                    label="Teléfono"
                    placeholder="Número de contacto"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                  />
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">
                        Sucursal Principal
                      </p>
                      <p className="text-xs text-slate-500">
                        Solo una sucursal puede ser principal
                      </p>
                    </div>
                    <Switch
                      isSelected={formData.esPrincipal}
                      onValueChange={(value) =>
                        setFormData({ ...formData, esPrincipal: value })
                      }
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleGuardar}
                  isLoading={isSaving}
                >
                  {editingSucursal ? "Actualizar" : "Crear"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
