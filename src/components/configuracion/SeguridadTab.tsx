"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Switch,
  Input,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import {
  Lock,
  Shield,
  Eye,
  Trash2,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useConfiguracion, Seguridad } from "@/hooks/useConfiguracion";
import { SectionPanel } from "./SectionPanel";

// Interfaces
interface SesionActiva {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  ipAddress: string | null;
  userAgent: string | null;
  dispositivo: string | null;
  ubicacion: string | null;
  fechaInicio: string;
  fechaUltimaActividad: string;
  esConfiable: boolean;
}

interface DispositivoConfiable {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  nombreDispositivo: string;
  userAgent: string | null;
  ipAddress: string | null;
  fechaRegistro: string;
  fechaUltimoUso: string;
}

interface AlertaSeguridad {
  tipo: "critico" | "advertencia" | "info";
  titulo: string;
  descripcion: string;
  ips?: string[];
}

export function SeguridadTab() {
  const {
    seguridad: seguridadData,
    saveSeguridad,
    isSavingSeguridad,
  } = useConfiguracion();

  const [seguridad, setSeguridad] = useState<Seguridad>({
    dobleFactor: false,
    expirarSesiones30Dias: true,
    bloquearTrasIntentos: "5",
    alertarNuevoDispositivo: true,
    bloquearPorInactividad: false,
    tiempoInactividadMinutos: 30,
    recordarSesion30Dias: true,
  });

  // Local state for fetched data
  const [sesionesActivas, setSesionesActivas] = useState<SesionActiva[]>([]);
  const [dispositivosConfiable, setDispositivosConfiable] = useState<
    DispositivoConfiable[]
  >([]);
  const [estadisticasSeguridad, setEstadisticasSeguridad] = useState({
    sesionesActivas: 0,
    dispositivosActivos: 0,
    ultimaActividad: null as string | null,
    intentosFallidos7Dias: 0,
    intentosExitosos7Dias: 0,
  });
  const [intentosSospechosos, setIntentosSospechosos] = useState<{
    sospechosos: Array<{
      ipAddress: string;
      intentos24Horas: number;
      ultimoIntento: string;
      esCritico: boolean;
    }>;
    alertas: AlertaSeguridad[];
    ultimosIntentos: Array<{
      id: number;
      fecha: string;
      ipAddress: string | null;
      usuarioNombre: string | null;
      usuarioId: number | null;
    }>;
    estadisticas: {
      ipsUnicasUltimaHora: number;
      intentosFallidos24Horas: number;
    };
  } | null>(null);

  // Loading states
  const [isLoadingSesiones, setIsLoadingSesiones] = useState(false);
  const [isLoadingDispositivos, setIsLoadingDispositivos] = useState(false);
  const [isLoadingIntentosSospechosos, setIsLoadingIntentosSospechosos] =
    useState(false);

  // Modal State
  const [modalDetalle, setModalDetalle] = useState<
    | "sesiones"
    | "dispositivos"
    | "ultimoAcceso"
    | "intentosFallidos"
    | "intentosExitosos"
    | null
  >(null);

  useEffect(() => {
    if (seguridadData) {
      setSeguridad(seguridadData);
    }
  }, [seguridadData]);

  // Load data on mount
  useEffect(() => {
    loadSesionesActivas();
    loadDispositivosConfiable();
    loadEstadisticasSeguridad();
    loadIntentosSospechosos();
  }, []);

  const handleSave = async () => {
    await saveSeguridad(seguridad);
  };

  const hasChanges = seguridadData
    ? JSON.stringify(seguridad) !== JSON.stringify(seguridadData)
    : false;

  // Fetch functions (copied from page.tsx)
  const loadSesionesActivas = async () => {
    try {
      setIsLoadingSesiones(true);
      const response = await fetch("/api/configuracion/seguridad/sesiones");
      if (response.ok) {
        const data = await response.json();
        setSesionesActivas(data.sesiones || []);
      }
    } catch (error) {
      console.error("Error cargando sesiones", error);
    } finally {
      setIsLoadingSesiones(false);
    }
  };

  const loadDispositivosConfiable = async () => {
    try {
      setIsLoadingDispositivos(true);
      const response = await fetch("/api/configuracion/seguridad/dispositivos");
      if (response.ok) {
        const data = await response.json();
        setDispositivosConfiable(data.dispositivos || []);
      }
    } catch (error) {
      console.error("Error cargando dispositivos", error);
    } finally {
      setIsLoadingDispositivos(false);
    }
  };

  const loadEstadisticasSeguridad = async () => {
    try {
      const response = await fetch("/api/configuracion/seguridad/estadisticas");
      if (response.ok) {
        const data = await response.json();
        setEstadisticasSeguridad(
          data.estadisticas || {
            sesionesActivas: 0,
            dispositivosActivos: 0,
            ultimaActividad: null,
            intentosFallidos7Dias: 0,
            intentosExitosos7Dias: 0,
          },
        );
      }
    } catch (error) {
      console.error("Error cargando estadisticas", error);
    }
  };

  const loadIntentosSospechosos = async () => {
    try {
      setIsLoadingIntentosSospechosos(true);
      const response = await fetch(
        "/api/configuracion/seguridad/intentos-sospechosos",
      );
      if (response.ok) {
        const data = await response.json();
        setIntentosSospechosos(data);
      }
    } catch (error) {
      console.error("Error intententos sospechosos", error);
    } finally {
      setIsLoadingIntentosSospechosos(false);
    }
  };

  const cerrarSesion = async (sesionId: number) => {
    try {
      const response = await fetch(
        `/api/configuracion/seguridad/sesiones?id=${sesionId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        addToast({ title: "Sesión cerrada", color: "success" });
        loadSesionesActivas();
        loadEstadisticasSeguridad();
      }
    } catch (error) {
      console.error(error);
      addToast({ title: "Error al cerrar sesión", color: "danger" });
    }
  };

  const revocarDispositivo = async (dispositivoId: number) => {
    try {
      const response = await fetch(
        `/api/configuracion/seguridad/dispositivos?id=${dispositivoId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        addToast({ title: "Dispositivo eliminado", color: "success" });
        loadDispositivosConfiable();
        loadEstadisticasSeguridad();
      }
    } catch (error) {
      console.error(error);
      addToast({ title: "Error al eliminar dispositivo", color: "danger" });
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString();
    } catch {
      return fecha;
    }
  };

  return (
    <SectionPanel
      id="seguridad"
      title="Seguridad y acceso"
      description="Gestione los parámetros de seguridad de su cuenta"
      summary="Controle accesos, dispositivos y registros de actividad"
    >
      <div className="space-y-6">
        {/* Configuración de Seguridad */}
        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex items-center gap-3 pb-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Lock size={20} className="text-blue-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900">
                Acceso y autenticación
              </h4>
              <p className="text-xs text-gray-500">
                Configura cómo los usuarios acceden al sistema
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4 pt-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Habilitar doble factor (2FA)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Requiere que todos los usuarios configuren autenticación de
                  dos factores
                </p>
              </div>
              <Switch
                size="sm"
                isSelected={seguridad.dobleFactor}
                onValueChange={(val) =>
                  setSeguridad({ ...seguridad, dobleFactor: val })
                }
              />
            </div>

            <Divider />
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Expirar sesiones después de 30 días
                </p>
              </div>
              <Switch
                size="sm"
                isSelected={seguridad.expirarSesiones30Dias}
                onValueChange={(val) =>
                  setSeguridad({ ...seguridad, expirarSesiones30Dias: val })
                }
              />
            </div>

            <Divider />
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Bloquear cuenta tras intentos fallidos
                </p>
              </div>
              <Select
                size="sm"
                selectedKeys={[seguridad.bloquearTrasIntentos]}
                onSelectionChange={(keys) =>
                  setSeguridad({
                    ...seguridad,
                    bloquearTrasIntentos: Array.from(keys)[0] as any,
                  })
                }
                className="min-w-[140px]"
                aria-label="Bloquear tras intentos"
              >
                <SelectItem key="nunca">Nunca</SelectItem>
                <SelectItem key="5">5 intentos</SelectItem>
                <SelectItem key="10">10 intentos</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Estado de Seguridad (Cards) */}
        <Card className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Shield size={20} className="text-green-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  Estado de seguridad
                </h4>
                <p className="text-xs text-gray-500">
                  Información sobre sesiones y dispositivos activos
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onPress={() => {
                loadSesionesActivas();
                loadDispositivosConfiable();
                loadEstadisticasSeguridad();
              }}
            >
              Actualizar
            </Button>
          </CardHeader>
          <Divider />
          <CardBody className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100"
                onClick={() => setModalDetalle("sesiones")}
              >
                <p className="text-xs text-gray-500">Sesiones activas</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {estadisticasSeguridad.sesionesActivas}
                </p>
              </div>
              <div
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100"
                onClick={() => setModalDetalle("dispositivos")}
              >
                <p className="text-xs text-gray-500">Dispositivos confiables</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {estadisticasSeguridad.dispositivosActivos}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <p className="text-xs text-gray-500">Intentos fallidos (7d)</p>
                <p className="text-2xl font-semibold text-red-900">
                  {estadisticasSeguridad.intentosFallidos7Dias}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {hasChanges && (
          <div className="flex justify-end mt-4">
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSavingSeguridad}
            >
              Guardar Seguridad
            </Button>
          </div>
        )}

        {/* Modals for Details */}
        <Modal
          isOpen={!!modalDetalle}
          onClose={() => setModalDetalle(null)}
          size="3xl"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  {modalDetalle === "sesiones" && "Sesiones Activas"}
                  {modalDetalle === "dispositivos" && "Dispositivos Confiables"}
                </ModalHeader>
                <ModalBody>
                  {modalDetalle === "sesiones" && (
                    <div className="space-y-4">
                      {sesionesActivas.map((sesion) => (
                        <div
                          key={sesion.id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {sesion.dispositivo || "Dispositivo desconocido"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {sesion.ipAddress} -{" "}
                              {formatFecha(sesion.fechaInicio)}
                            </p>
                          </div>
                          <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            onPress={() => cerrarSesion(sesion.id)}
                          >
                            Cerrar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {modalDetalle === "dispositivos" && (
                    <div className="space-y-4">
                      {dispositivosConfiable.map((disp) => (
                        <div
                          key={disp.id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {disp.nombreDispositivo}
                            </p>
                            <p className="text-xs text-gray-500">
                              Registrado: {formatFecha(disp.fechaRegistro)}
                            </p>
                          </div>
                          <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            onPress={() => revocarDispositivo(disp.id)}
                          >
                            Revocar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button onPress={onClose}>Cerrar</Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </SectionPanel>
  );
}
