"use client";

import { modalMotionProps } from "@/lib/motionConfig";
import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
  addToast,
} from "@heroui/react";
import { Building2, MapPin, Phone, Star } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

interface Sucursal {
  Id?: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esPrincipal: boolean;
  estaActiva?: boolean;
}

interface SucursalFormProps {
  isOpen: boolean;
  onClose: () => void;
  sucursal: Sucursal | null;
  onSuccess: () => void;
}

export default function SucursalForm({
  isOpen,
  onClose,
  sucursal,
  onSuccess,
}: SucursalFormProps) {
  const userStore = useUserStore();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    esPrincipal: false,
    estaActiva: true,
  });

  useEffect(() => {
    if (sucursal) {
      setFormData({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion || "",
        telefono: sucursal.telefono || "",
        esPrincipal: sucursal.esPrincipal,
        estaActiva: sucursal.estaActiva ?? true,
      });
    } else {
      setFormData({
        nombre: "",
        direccion: "",
        telefono: "",
        esPrincipal: false,
        estaActiva: true,
      });
    }
  }, [sucursal, isOpen]);

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      addToast({
        title: "Error",
        description: "El nombre es requerido",
        color: "danger",
      });
      return;
    }

    try {
      setIsSaving(true);
      const url = sucursal
        ? `/api/sucursales/${sucursal.Id}`
        : "/api/sucursales";
      const method = sucursal ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        const savedSucursal = data?.sucursal;
        
        if (savedSucursal) {
          if (sucursal) {
            userStore.updateBranch({
              Id: savedSucursal.Id.toString(),
              Nombre: savedSucursal.nombre,
              EsPrincipal: savedSucursal.esPrincipal,
              esDefault: false,
            });
          } else {
            userStore.pushBranch({
              Id: savedSucursal.Id.toString(),
              Nombre: savedSucursal.nombre,
              EsPrincipal: savedSucursal.esPrincipal,
              esDefault: false,
            });
          }
        }

        addToast({
          title: "Éxito",
          description: `Sucursal ${sucursal ? "actualizada" : "creada"} correctamente`,
          color: "success",
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        addToast({
          title: "Error",
          description: errorData.error || "Error al guardar",
          color: "danger",
        });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error de conexión",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      backdrop="blur"
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{
        wrapper: "items-end sm:items-center",
        base: "bg-white/90 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-t-[20px] rounded-b-none sm:rounded-3xl w-full sm:w-auto m-0 sm:m-auto max-h-[92vh]",
        header: "border-b border-slate-100/60 pb-4",
        footer: "border-t border-slate-100/60 pt-4",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex gap-3 items-center">
              <div className="p-2.5 rounded-2xl bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white shadow-lg shadow-[#67afc3]/20">
                <Building2 size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  {sucursal ? "Editar Sucursal" : "Nueva Sucursal"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {sucursal ? "Modifica los datos de la sucursal" : "Registra un nuevo punto de venta"}
                </p>
              </div>
            </ModalHeader>
            <ModalBody className="py-6 space-y-5">
              <Input
                label="Nombre de la sucursal"
                placeholder="Ej: Sede Central"
                autoFocus
                variant="bordered"
                labelPlacement="outside"
                value={formData.nombre}
                onValueChange={(v) => setFormData({ ...formData, nombre: v })}
                classNames={{
                  label: "text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-1",
                  inputWrapper: "h-12 border-slate-200 hover:border-[#67afc3] focus-within:!border-[#67afc3] transition-all rounded-xl bg-slate-50/50",
                  input: "text-sm",
                }}
                startContent={<Building2 size={18} className="text-slate-400 mr-1" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Dirección"
                  placeholder="Calle y número"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formData.direccion}
                  onValueChange={(v) => setFormData({ ...formData, direccion: v })}
                  classNames={{
                    label: "text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-1",
                    inputWrapper: "h-12 border-slate-200 hover:border-[#67afc3] focus-within:!border-[#67afc3] transition-all rounded-xl bg-slate-50/50",
                    input: "text-sm",
                  }}
                  startContent={<MapPin size={18} className="text-slate-400 mr-1" />}
                />
                <Input
                  label="Teléfono"
                  placeholder="Ej: 011 4444-4444"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formData.telefono}
                  onValueChange={(v) => setFormData({ ...formData, telefono: v })}
                  classNames={{
                    label: "text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-1",
                    inputWrapper: "h-12 border-slate-200 hover:border-[#67afc3] focus-within:!border-[#67afc3] transition-all rounded-xl bg-slate-50/50",
                    input: "text-sm",
                  }}
                  startContent={<Phone size={18} className="text-slate-400 mr-1" />}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="flex gap-3 items-center">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-500">
                    <Star size={20} fill={formData.esPrincipal ? "currentColor" : "none"} />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-slate-700">Sucursal Principal</p>
                    <p className="text-[11px] text-slate-500 font-medium">Define esta sede como la predeterminada</p>
                  </div>
                </div>
                <Switch 
                  isSelected={formData.esPrincipal} 
                  onValueChange={(v) => setFormData({ ...formData, esPrincipal: v })}
                  color="warning"
                />
              </div>

              {sucursal && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className={`p-2 rounded-xl ${formData.estaActiva ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                      <Building2 size={20} />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-700">Estado de Operación</p>
                      <p className="text-[11px] text-slate-500 font-medium">{formData.estaActiva ? 'Activa y recibiendo ventas' : 'Inactiva temporalmente'}</p>
                    </div>
                  </div>
                  <Switch 
                    isSelected={formData.estaActiva} 
                    onValueChange={(v) => setFormData({ ...formData, estaActiva: v })}
                    color="success"
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter className="gap-3">
              <Button 
                variant="light" 
                onPress={onClose}
                className="font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleGuardar}
                isLoading={isSaving}
                className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-8 shadow-lg shadow-[#67afc3]/30 rounded-xl transform transition-transform active:scale-95"
              >
                {sucursal ? "Actualizar Cambios" : "Crear Sucursal"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
