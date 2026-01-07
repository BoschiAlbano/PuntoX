"use client";

/**
 * =====================================================
 * PÁGINA DE GESTIÓN DE SUCURSALES
 * =====================================================
 *
 * Permite administrar las sucursales del tenant:
 * - Listar sucursales
 * - Crear nueva sucursal
 * - Editar sucursal existente
 * - Ver estadísticas por sucursal
 *
 * =====================================================
 */

import { useState, useEffect } from "react";
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
import { usePagePermission } from "@/lib/permissions/usePagePermission";

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
  // Permisos - usar mismo permiso que configuración
  usePagePermission();

  // Estado
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    esPrincipal: false,
  });

  // Cargar sucursales
  const cargarSucursales = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/sucursales");
      if (res.ok) {
        const data = await res.json();
        setSucursales(data.sucursales || []);
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

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
      alert("El nombre es requerido");
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
        await cargarSucursales();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error guardando sucursal:", error);
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar sucursal
  const handleEliminar = async (sucursal: Sucursal) => {
    if (!confirm(`¿Eliminar sucursal "${sucursal.nombre}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sucursales/${sucursal.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await cargarSucursales();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error eliminando sucursal:", error);
      alert("Error al eliminar");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
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
                      onPress={() => handleEliminar(sucursal)}
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
