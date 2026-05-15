"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button, addToast } from "@heroui/react";
import { Camera, Trash2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

const ACCENT = "#67afc3";

/** Genera las iniciales a partir del nombre y apellido del usuario del store. */
function getInitials(nombre?: string, apellido?: string): string {
  const n = nombre?.trim()[0]?.toUpperCase() ?? "";
  const a = apellido?.trim()[0]?.toUpperCase() ?? "";
  return n + a || "U";
}

/**
 * FotoPerfilSection
 * Sección para que el usuario autenticado visualice y actualice su propia foto de perfil.
 * Llama a PATCH /api/perfil/foto con FormData.
 * Al éxito actualiza useUserStore para reflejar el cambio en el header inmediatamente.
 */
export function FotoPerfilSection() {
  const { user, updateUserFoto } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null); // solo mientras se elige
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentFoto = user?.Foto ?? null;
  const initials = getInitials(user?.Nombre, user?.Apellido);

  // La foto a mostrar: si hay preview de nuevo archivo, mostrarla; sino la actual del store
  const displayFoto = preview ?? currentFoto;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica en cliente
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type.toLowerCase())) {
      addToast({
        title: "Formato inválido",
        description: "Solo se permiten imágenes PNG, JPG o JPEG.",
        color: "danger",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "Imagen demasiado grande",
        description: "La imagen no puede superar los 5 MB.",
        color: "danger",
      });
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCancelar = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
  };

  const handleGuardar = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("foto", selectedFile);

      const res = await fetch("/api/perfil/foto", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la foto.");
      }

      // Actualizar store para que el header refleje el cambio inmediatamente
      updateUserFoto(data.foto);

      // Revocar el preview local y limpiar estado
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setSelectedFile(null);

      addToast({
        title: "Foto actualizada",
        description: "Tu foto de perfil fue guardada correctamente.",
        color: "success",
      });
    } catch (err: any) {
      addToast({
        title: "Error al guardar",
        description: err?.message ?? "No se pudo actualizar la foto.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (!currentFoto && !preview) return;

    // Si hay un preview pendiente, solo cancelar sin llamar a la API
    if (preview) {
      handleCancelar();
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      // Enviamos campo vacío para indicar eliminar
      formData.append("foto", "");

      const res = await fetch("/api/perfil/foto", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar la foto.");
      }

      updateUserFoto(null);

      addToast({
        title: "Foto eliminada",
        description: "Tu foto de perfil fue eliminada.",
        color: "success",
      });
    } catch (err: any) {
      addToast({
        title: "Error",
        description: err?.message ?? "No se pudo eliminar la foto.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header de la tarjeta */}
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-800">Foto de perfil</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Esta imagen se muestra en el menú de navegación.
        </p>
      </div>

      {/* Contenido */}
      <div className="px-6 py-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={() => !isSaving && fileInputRef.current?.click()}
            disabled={isSaving}
            className="relative flex h-24 w-24 items-center justify-center rounded-2xl
                       overflow-hidden shadow-md ring-2 ring-white focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-[#67afc3]/50
                       transition-all duration-200 hover:ring-[#67afc3]/40 cursor-pointer"
            aria-label="Cambiar foto de perfil"
          >
            {displayFoto ? (
              <Image
                src={displayFoto}
                alt="Foto de perfil"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                {initials}
              </div>
            )}
            {/* Overlay cámara */}
            <div className="absolute inset-0 flex items-center justify-center
                            bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>

          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSaving}
          />
        </div>

        {/* Info + acciones */}
        <div className="flex flex-col gap-3 flex-1 w-full items-center sm:items-start">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-slate-700">
              {user?.Nombre} {user?.Apellido}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              PNG, JPG o JPEG · Máximo 5 MB
            </p>
          </div>

          {/* Botones: aparecen según el estado */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {selectedFile ? (
              // Hay un archivo nuevo seleccionado: mostrar Guardar + Cancelar
              <>
                <Button
                  size="sm"
                  onPress={handleGuardar}
                  isLoading={isSaving}
                  className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold
                             h-9 px-4 rounded-lg shadow-sm text-xs"
                >
                  Guardar foto
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={handleCancelar}
                  isDisabled={isSaving}
                  className="h-9 px-4 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
              </>
            ) : (
              // Estado normal: botón cambiar y (si hay foto) botón eliminar
              <>
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={() => fileInputRef.current?.click()}
                  isDisabled={isSaving}
                  startContent={<Camera className="w-3.5 h-3.5" />}
                  className="h-9 px-4 rounded-lg text-xs font-medium border-slate-200
                             text-slate-700 hover:border-[#67afc3] hover:text-[#67afc3] transition-colors"
                >
                  {currentFoto ? "Cambiar foto" : "Agregar foto"}
                </Button>
                {currentFoto && (
                  <Button
                    size="sm"
                    variant="light"
                    onPress={handleEliminarFoto}
                    isDisabled={isSaving}
                    startContent={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                    className="h-9 px-4 rounded-lg text-xs font-medium text-rose-500
                               hover:bg-rose-50 transition-colors"
                  >
                    Eliminar foto
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
