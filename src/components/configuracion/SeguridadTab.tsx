"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Select,
  SelectItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
} from "@heroui/react";
import {
  ShieldCheck,
  Lock,
  Clock,
  Smartphone,
  RefreshCw,
  MonitorX,
  Save,
  LogOut,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useConfiguracion, Seguridad } from "@/hooks/useConfiguracion";
import { VentasSection, ToggleRow } from "./ventas/VentasPrimitives";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

interface SesionActiva {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  ipAddress: string | null;
  dispositivo: string | null;
  fechaInicio: string;
  esActual: boolean;
}

interface DispositivoConfiable {
  id: number;
  usuarioId: number;
  nombreDispositivo: string;
  ipAddress: string | null;
  fechaRegistro: string;
  fechaUltimoUso: string;
}

const selectCls = {
  trigger:
    "h-9 border-slate-200 bg-white hover:border-[#67afc3]/60 data-[focus=true]:border-[#67afc3] rounded-xl text-sm",
};

const formatFecha = (fecha: string) => {
  try {
    return new Date(fecha).toLocaleString("es-AR");
  } catch {
    return fecha;
  }
};

export function SeguridadTab() {
  const {
    seguridad: seguridadData,
    saveSeguridad,
    isSavingSeguridad,
  } = useConfiguracion({ enableSeguridad: true });

  const [seguridad, setSeguridad] = useState<Seguridad>({
    dobleFactor: false,
    expirarSesiones: true,
    diasExpiracionSesion: 30,
    bloquearTrasIntentos: "5",
    alertarNuevoDispositivo: true,
    recordarSesion30Dias: true,
  });

  const [sesionesActivas, setSesionesActivas] = useState<SesionActiva[]>([]);
  const [dispositivos, setDispositivos] = useState<DispositivoConfiable[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    sesionesActivas: 0,
    dispositivosActivos: 0,
  });
  const [modalDetalle, setModalDetalle] = useState<
    "sesiones" | "dispositivos" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCerrandoOtras, setIsCerrandoOtras] = useState(false);
  const [confirmCerrarOtras, setConfirmCerrarOtras] = useState(false);

  useEffect(() => {
    if (seguridadData) setSeguridad(seguridadData);
  }, [seguridadData]);

  useEffect(() => {
    recargarDatos();
  }, []);

  const recargarDatos = async () => {
    setIsLoading(true);
    try {
      const [sesRes, dispRes, estRes] = await Promise.all([
        fetch("/api/configuracion/seguridad/sesiones"),
        fetch("/api/configuracion/seguridad/dispositivos"),
        fetch("/api/configuracion/seguridad/estadisticas"),
      ]);
      if (sesRes.ok) setSesionesActivas((await sesRes.json()).sesiones || []);
      if (dispRes.ok)
        setDispositivos((await dispRes.json()).dispositivos || []);
      if (estRes.ok) {
        const d = await estRes.json();
        setEstadisticas(
          d.estadisticas || { sesionesActivas: 0, dispositivosActivos: 0 },
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };


  const cerrarTodasLasDemas = async () => {
    setIsCerrandoOtras(true);
    setConfirmCerrarOtras(false);
    try {
      // 1. Revocar refresh tokens en Supabase (lado cliente)
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "others" });

      // 2. Sincronizar estado en nuestra DB
      const res = await fetch(
        "/api/configuracion/seguridad/sesiones/cerrar-otras",
        {
          method: "POST",
        },
      );
      const data = await res.json();
      if (res.ok) {
        addToast({
          title: data.message ?? "Sesiones cerradas",
          color: "success",
        });
        recargarDatos();
      } else {
        addToast({
          title: data.error ?? "Error al cerrar sesiones",
          color: "danger",
        });
      }
    } catch {
      addToast({
        title: "Error al cerrar las otras sesiones",
        color: "danger",
      });
    } finally {
      setIsCerrandoOtras(false);
    }
  };

  const revocarDispositivo = async (id: number) => {
    try {
      const res = await fetch(
        `/api/configuracion/seguridad/dispositivos?id=${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        addToast({ title: "Dispositivo revocado", color: "success" });
        recargarDatos();
      }
    } catch {
      addToast({ title: "Error al revocar dispositivo", color: "danger" });
    }
  };

  const hasChanges = seguridadData
    ? JSON.stringify(seguridad) !== JSON.stringify(seguridadData)
    : false;

  const statCards = [
    {
      label: "Sesiones activas",
      value: estadisticas.sesionesActivas,
      icon: Shield,
      modal: "sesiones" as const,
    },
    {
      label: "Dispositivos confiables",
      value: estadisticas.dispositivosActivos,
      icon: Smartphone,
      modal: "dispositivos" as const,
    },
  ];

  return (
    <div className="space-y-5 pt-4 pb-6">
      <VentasSection title="Acceso y autenticación" icon={Lock}>
        <ToggleRow
          icon={ShieldCheck}
          title="Doble factor de autenticación (2FA)"
          description="Todos los usuarios deberán verificar su identidad con un segundo método al iniciar sesión"
          isSelected={seguridad.dobleFactor}
          onValueChange={(v) => setSeguridad({ ...seguridad, dobleFactor: v })}
        />
        <ToggleRow
          icon={Clock}
          title="Expirar sesiones por inactividad"
          description="Las sesiones se cerrarán automáticamente si superan el tiempo de inactividad configurado"
          isSelected={seguridad.expirarSesiones}
          onValueChange={(v) =>
            setSeguridad({ ...seguridad, expirarSesiones: v })
          }
        >
          {seguridad.expirarSesiones && (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                size="sm"
                variant="bordered"
                min={1}
                max={365}
                value={String(seguridad.diasExpiracionSesion)}
                onValueChange={(v) => {
                  const n = parseInt(v);
                  if (!isNaN(n) && n >= 1 && n <= 365) {
                    setSeguridad({ ...seguridad, diasExpiracionSesion: n });
                  }
                }}
                className="max-w-[90px]"
                classNames={{ input: "text-center font-semibold text-sm", inputWrapper: "border-[#67afc3]/40" }}
                aria-label="Días de inactividad"
                endContent={
                  <span className="text-xs text-slate-400 whitespace-nowrap">días</span>
                }
              />
            </div>
          )}
        </ToggleRow>
        <ToggleRow
          icon={MonitorX}
          title="Bloquear cuenta tras intentos fallidos"
          description="Protege las cuentas contra ataques de fuerza bruta"
        >
          <Select
            size="sm"
            variant="bordered"
            classNames={selectCls}
            selectedKeys={[seguridad.bloquearTrasIntentos]}
            onSelectionChange={(keys) =>
              setSeguridad({
                ...seguridad,
                bloquearTrasIntentos: Array.from(keys)[0] as any,
              })
            }
            className="max-w-[200px]"
            aria-label="Bloquear tras intentos"
          >
            <SelectItem key="nunca">Nunca bloquear</SelectItem>
            <SelectItem key="5">5 intentos</SelectItem>
            <SelectItem key="10">10 intentos</SelectItem>
          </Select>
        </ToggleRow>

        {hasChanges && (
          <div className="flex justify-end pt-2">
            <Button
              onPress={() => saveSeguridad(seguridad)}
              isLoading={isSavingSeguridad}
              className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-6 h-10 shadow-md shadow-[#67afc3]/20 rounded-xl gap-2"
              startContent={!isSavingSeguridad && <Save size={15} />}
            >
              Guardar seguridad
            </Button>
          </div>
        )}
      </VentasSection>

      {/* Estado de seguridad */}
      <VentasSection title="Estado de seguridad" icon={Shield}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statCards.map(({ label, value, icon: Icon, modal }) => (
            <button
              key={label}
              onClick={() => modal && setModalDetalle(modal)}
              className={`text-left p-4 rounded-2xl bg-linear-to-br from-[#67afc3]/8 to-[#2dd4bf]/8 border border-[#67afc3]/15 transition-all hover:shadow-sm ${modal ? "cursor-pointer hover:scale-[1.01] hover:border-[#67afc3]/30" : "cursor-default"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} strokeWidth={2.5} className="text-[#67afc3]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {label}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-[#67afc3] leading-none">
                {value}
              </p>
              {modal && (
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Clic para ver detalles →
                </p>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="flat"
            onPress={recargarDatos}
            isLoading={isLoading}
            className="text-slate-500 text-xs font-bold gap-1.5 rounded-xl"
            startContent={!isLoading && <RefreshCw size={13} />}
          >
            Actualizar datos
          </Button>
        </div>
      </VentasSection>

      {/* Modal */}
      <Modal
        isOpen={!!modalDetalle}
        onClose={() => setModalDetalle(null)}
        size="lg"
        backdrop="opaque"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md",
          base: "font-sans bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60",
          header: "border-b border-slate-100/60 pb-4 pt-6 px-6",
          body: "py-4 px-6",
          footer: "border-t border-slate-100/60 py-4 px-6",
          closeButton: "hover:bg-slate-100 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
                  {modalDetalle === "sesiones" ? (
                    <Shield size={18} />
                  ) : (
                    <Smartphone size={18} />
                  )}
                </div>
                <span className="text-lg font-extrabold text-slate-800">
                  {modalDetalle === "sesiones"
                    ? "Sesiones activas"
                    : "Dispositivos confiables"}
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  {modalDetalle === "sesiones" &&
                    (sesionesActivas.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        Sin sesiones activas registradas.
                      </p>
                    ) : (
                      sesionesActivas.map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border ${s.esActual ? "bg-[#67afc3]/5 border-[#67afc3]/30" : "bg-slate-50 border-slate-100"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-xl border ${s.esActual ? "bg-linear-to-br from-[#67afc3]/20 to-[#2dd4bf]/20 border-[#67afc3]/30" : "bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border-[#67afc3]/20"}`}
                            >
                              <Shield size={14} className="text-[#67afc3]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-700">
                                  {s.dispositivo || "Dispositivo desconocido"}
                                </p>
                                {s.esActual && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                    <CheckCircle size={10} />
                                    Esta sesión
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">
                                {s.ipAddress} · {formatFecha(s.fechaInicio)}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">
                                {s.usuarioNombre}
                              </p>
                            </div>
                          </div>

                        </div>
                      ))
                    ))}
                  {modalDetalle === "dispositivos" &&
                    (dispositivos.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        Sin dispositivos confiables registrados.
                      </p>
                    ) : (
                      dispositivos.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20">
                              <Smartphone
                                size={14}
                                className="text-[#67afc3]"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">
                                {d.nombreDispositivo}
                              </p>
                              <p className="text-xs text-slate-400">
                                Registrado: {formatFecha(d.fechaRegistro)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => revocarDispositivo(d.id)}
                            className="text-rose-500 bg-rose-50 border border-rose-100 font-bold text-xs rounded-xl gap-1"
                            startContent={<MonitorX size={12} />}
                          >
                            Revocar
                          </Button>
                        </div>
                      ))
                    ))}
                </div>
              </ModalBody>
              <ModalFooter className="flex items-center justify-between">
                <div>
                  {modalDetalle === "sesiones" &&
                    sesionesActivas.filter((s) => !s.esActual).length > 0 && (
                      <>
                        {confirmCerrarOtras ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">
                              ¿Confirmar cierre?
                            </span>
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={cerrarTodasLasDemas}
                              isLoading={isCerrandoOtras}
                              className="text-rose-500 bg-rose-50 border border-rose-100 font-bold text-xs rounded-xl gap-1"
                              startContent={
                                !isCerrandoOtras && <LogOut size={12} />
                              }
                            >
                              Sí, cerrar
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              onPress={() => setConfirmCerrarOtras(false)}
                              className="font-bold text-slate-500 text-xs rounded-xl"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setConfirmCerrarOtras(true)}
                            className="text-rose-500 bg-rose-50 border border-rose-100 font-bold text-xs rounded-xl gap-1"
                            startContent={<LogOut size={12} />}
                          >
                            Cerrar todas las demás
                          </Button>
                        )}
                      </>
                    )}
                </div>
                <Button
                  variant="light"
                  onPress={onClose}
                  className="font-bold text-slate-500 rounded-xl"
                >
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
