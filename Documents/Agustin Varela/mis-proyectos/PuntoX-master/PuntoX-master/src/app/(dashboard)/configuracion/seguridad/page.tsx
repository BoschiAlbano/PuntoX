"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Switch,
  Button,
  Spinner,
} from "@heroui/react";
import { Shield, Lock, Eye, Save } from "lucide-react";
import { addToast } from "@heroui/react";

interface PoliticasSeguridad {
  forzar2FA: boolean;
  expirarSesiones30Dias: boolean;
  bloquearTras5Intentos: boolean;
  alertasNuevoDevice: boolean;
}

export default function Seguridad() {
  const [politicas, setPoliticas] = useState<PoliticasSeguridad>({
    forzar2FA: false,
    expirarSesiones30Dias: true,
    bloquearTras5Intentos: false,
    alertasNuevoDevice: true,
  });
  const [politicasOriginales, setPoliticasOriginales] = useState<PoliticasSeguridad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración al montar
  useEffect(() => {
    loadConfiguracion();
  }, []);

  // Detectar cambios
  useEffect(() => {
    if (politicasOriginales) {
      const changed = Object.keys(politicas).some(
        (key) => politicas[key as keyof PoliticasSeguridad] !== politicasOriginales[key as keyof PoliticasSeguridad]
      );
      setHasChanges(changed);
    }
  }, [politicas, politicasOriginales]);

  const loadConfiguracion = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/configuracion/seguridad");
      
      if (!response.ok) {
        throw new Error("Error al cargar la configuración");
      }

      const data = await response.json();
      setPoliticas(data);
      setPoliticasOriginales(data);
    } catch (error) {
      console.error("Error cargando configuración:", error);
      addToast({
        title: "Error",
        description: "No se pudo cargar la configuración de seguridad",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof PoliticasSeguridad) => {
    setPoliticas((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/configuracion/seguridad", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(politicas),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error al guardar");
      }

      await response.json();
      setPoliticasOriginales(politicas);
      setHasChanges(false);

      addToast({
        title: "Éxito",
        description: "Configuración de seguridad guardada correctamente",
        color: "success",
      });
    } catch (error) {
      console.error("Error guardando configuración:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la configuración",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const politicasActivas = Object.values(politicas).filter(Boolean).length;
  const totalPoliticas = Object.keys(politicas).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seguridad</h1>
          <p className="text-gray-600 mt-2">
            Configura las políticas de seguridad globales para tu negocio
          </p>
        </div>
        {hasChanges && (
          <Button
            color="primary"
            startContent={<Save size={16} />}
            onPress={handleSave}
            isLoading={isSaving}
          >
            Guardar cambios
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Resumen */}
        <Card className="shadow-sm border border-slate-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Estado general</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Políticas de seguridad
                </h3>
              </div>
              <Chip variant="flat" color="success" size="sm">
                {politicasActivas}/{totalPoliticas} activas
              </Chip>
            </div>
          </CardBody>
        </Card>

        {/* Acceso y autenticación */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="flex items-center gap-3 pb-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Lock size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Acceso y autenticación
              </h3>
              <p className="text-sm text-gray-500">
                Configura cómo los usuarios acceden al sistema
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4 pt-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Forzar autenticación de dos factores (2FA)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Requiere que todos los usuarios configuren 2FA en su próxima
                  sesión
                </p>
              </div>
              <Switch
                size="sm"
                isSelected={politicas.forzar2FA}
                onValueChange={() => handleToggle("forzar2FA")}
              />
            </div>
            <Divider />
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Expirar sesiones después de 30 días
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Las sesiones inactivas se cerrarán automáticamente después de
                  30 días
                </p>
              </div>
              <Switch
                size="sm"
                isSelected={politicas.expirarSesiones30Dias}
                onValueChange={() => handleToggle("expirarSesiones30Dias")}
              />
            </div>
            <Divider />
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Bloquear cuenta tras 5 intentos fallidos
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Bloquea temporalmente la cuenta después de 5 intentos de
                  inicio de sesión fallidos
                </p>
              </div>
              <Switch
                size="sm"
                isSelected={politicas.bloquearTras5Intentos}
                onValueChange={() => handleToggle("bloquearTras5Intentos")}
              />
            </div>
          </CardBody>
        </Card>

        {/* Protección de cuenta */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="flex items-center gap-3 pb-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Shield size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Protección de cuenta
              </h3>
              <p className="text-sm text-gray-500">
                Configura alertas y notificaciones de seguridad
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4 pt-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Alertas de ingreso desde nuevo dispositivo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Envía notificaciones cuando un usuario inicie sesión desde un
                  dispositivo o ubicación no reconocida
                </p>
              </div>
              <Switch
                size="sm"
                isSelected={politicas.alertasNuevoDevice}
                onValueChange={() => handleToggle("alertasNuevoDevice")}
              />
            </div>
          </CardBody>
        </Card>

        {/* Auditoría informativa */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="flex items-center gap-3 pb-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Eye size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Auditoría informativa
              </h3>
              <p className="text-sm text-gray-500">
                Visualiza y monitorea la actividad de seguridad
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm text-gray-700">
                Los logs de auditoría se registran automáticamente para todas
                las acciones de seguridad. Puedes revisar los logs completos
                en la sección de{" "}
                <a
                  href="/analiticas?tab=logs"
                  className="text-primary hover:underline font-medium"
                >
                  Analíticas → Logs
                </a>
                .
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <p className="text-xs text-gray-500">Eventos registrados</p>
                <p className="text-lg font-semibold text-slate-900">1,234</p>
                <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <p className="text-xs text-gray-500">Intentos fallidos</p>
                <p className="text-lg font-semibold text-slate-900">12</p>
                <p className="text-xs text-gray-500 mt-1">Últimos 7 días</p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <p className="text-xs text-gray-500">Dispositivos activos</p>
                <p className="text-lg font-semibold text-slate-900">8</p>
                <p className="text-xs text-gray-500 mt-1">En este momento</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

