"use client";

import GenericCrud from "@/components/shared/GenericCrud";
import { Chip, addToast } from "@heroui/react";
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Star,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useQueryClient } from "@tanstack/react-query";
import SucursalForm from "@/components/sucursales/SucursalForm";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/dashboard/PageHeader";

export interface Sucursal {
  Id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esPrincipal: boolean;
  estaActiva: boolean;
  fechaCreacion: string;
  cantidadUsuarios: number;
}

export default function SucursalesPage() {
  const userStore = useUserStore();
  const queryClient = useQueryClient();

  const handleEliminarPost = async (sucursal: Sucursal) => {
    // Si era la sucursal actual, informar o limpiar?
    if (userStore.currentBranch.Id === sucursal.Id.toString()) {
      addToast({
        title: "Sucursal Eliminada",
        description:
          "Has eliminado la sucursal que tenías activa. Se recomienda recargar.",
        color: "warning",
      });
    }
    userStore.removeBranch(sucursal.Id.toString());
  };

  return (
    <div className="   flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de"
        accentTitle="Sucursales"
        description="Aquí puedes observar un panorama rápido del rendimiento actual."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 h-full flex flex-col"
      >
        <GenericCrud<Sucursal>
          apiPath="/api/sucursales"
          queryKey="sucursales"
          searchPlaceholder="Buscar por nombre o dirección..."
          initialLimit={10}
          enableBulkActions={false}
          columns={[
            { uid: "nombre", name: "SUCURSAL", sortable: true },
            { uid: "usuarios", name: "USUARIOS", sortable: false },
            { uid: "contacto", name: "CONTACTO", sortable: false },
            { uid: "estado", name: "ESTADO", sortable: false },
            { uid: "acciones", name: "ACCIONES", sortable: false },
          ]}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case "nombre":
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl bg-linear-to-br ${item.esPrincipal ? "from-amber-400 to-orange-400 shadow-amber-200" : "from-[#67afc3] to-[#2dd4bf] shadow-sky-100"} text-white shadow-lg shrink-0`}
                    >
                      <Building2 size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        {item.nombre}
                        {item.esPrincipal && (
                          <Star
                            size={12}
                            fill="currentColor"
                            className="text-amber-500"
                          />
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar size={10} />
                        Creada el{" "}
                        {new Date(item.fechaCreacion).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              case "usuarios":
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(item.cantidadUsuarios, 3))].map(
                        (_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500"
                          >
                            {i + 1}
                          </div>
                        ),
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.cantidadUsuarios}{" "}
                      {item.cantidadUsuarios === 1 ? "usuario" : "usuarios"}
                    </span>
                  </div>
                );
              case "contacto":
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin size={12} className="shrink-0" />
                      <span className="text-xs font-medium truncate max-w-[200px]">
                        {item.direccion || "Sin dirección"}
                      </span>
                    </div>
                    {item.telefono && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone size={12} className="shrink-0" />
                        <span className="text-[11px] font-medium">
                          {item.telefono}
                        </span>
                      </div>
                    )}
                  </div>
                );
              case "estado":
                return (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                        item.estaActiva
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-slate-50 text-slate-400 border border-slate-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${item.estaActiva ? "bg-emerald-500" : "bg-slate-300"}`}
                      ></span>
                      {item.estaActiva ? "Operativa" : "Inactiva"}
                    </span>
                    {item.esPrincipal && (
                      <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                        Principal
                      </span>
                    )}
                  </div>
                );
              default:
                return null;
            }
          }}
          renderRowPreview={(item) => (
            <div className="space-y-6 text-sm">
              <div className="p-5 rounded-3xl bg-linear-to-br from-slate-50 to-white border border-slate-100 shadow-sm flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl bg-linear-to-br ${item.esPrincipal ? "from-amber-400 to-orange-400" : "from-[#67afc3] to-[#2dd4bf]"} text-white flex items-center justify-center shadow-lg shrink-0 transform -rotate-3`}
                >
                  <Building2 size={28} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg leading-tight flex items-center gap-2">
                    {item.nombre}
                    {item.esPrincipal && (
                      <Star
                        size={16}
                        fill="currentColor"
                        className="text-amber-500"
                      />
                    )}
                  </h4>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-0.5">
                    {item.estaActiva
                      ? "Punto de Venta Activo"
                      : "Sede Fuera de Operación"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-1 transition-all hover:bg-white hover:shadow-sm">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                    Dirección Física
                  </p>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-[#67afc3] shrink-0" />
                    <span className="font-semibold text-slate-700 wrap-break-word leading-tight">
                      {item.direccion || "No especificada"}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-1 transition-all hover:bg-white hover:shadow-sm">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                    Teléfono Interno
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-[#67afc3] shrink-0" />
                    <span className="font-semibold text-slate-700">
                      {item.telefono || "No registrado"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="flex justify-between items-center mb-3 text-slate-800">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#67afc3]" />
                    <span className="font-bold text-sm">Equipo de Trabajo</span>
                  </div>
                  <span className="bg-[#67afc3]/10 text-[#67afc3] px-2.5 py-1 rounded-md text-[11px] font-bold">
                    {item.cantidadUsuarios} INTEGRANTES
                  </span>
                </div>
                <div className="bg-white/80 rounded-xl p-3 border border-slate-50">
                  <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    Los usuarios se gestionan desde la pestaña de Empleados.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#67afc3]/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#67afc3]/40 transition-all" />
                <div className="relative z-10 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Estado Maestro
                  </span>
                  <span className="text-sm font-bold mt-1 leading-none">
                    Configuración Prioritaria
                  </span>
                </div>
                {item.esPrincipal ? (
                  <Chip
                    startContent={<CheckCircle2 size={12} />}
                    size="sm"
                    className="bg-amber-400/20 text-amber-400 border border-amber-400/30"
                  >
                    NODO PRINCIPAL
                  </Chip>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500">
                    SEDE SECUNDARIA
                  </span>
                )}
              </div>
            </div>
          )}
          getRowPreviewTitle={(item) => `Perfil de Sede: ${item.nombre}`}
          FormComponent={({ isOpen, onClose, initialData }) => (
            <SucursalForm
              isOpen={isOpen}
              onClose={onClose}
              sucursal={initialData as any}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["sucursales"] });
              }}
            />
          )}
        />
      </motion.div>
    </div>
  );
}
