"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/react";
import Image from "next/image";

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPT = "image/jpeg,image/jpg,image/png";

export interface ImageUploadFieldProps {
  /** URL de la imagen existente (ej: /api/productos/123?foto=1) */
  existingImageUrl?: string | null;
  /** Preview en base64 tras seleccionar archivo (sobreescribe existingImageUrl) */
  previewUrl?: string;
  onChange: (file: File | null, previewBase64: string) => void;
  disabled?: boolean;
  label?: string;
  placeholderLabel?: string;
}

export function ImageUploadField({
  existingImageUrl,
  previewUrl,
  onChange,
  disabled = false,
  label = "Foto del producto",
  placeholderLabel = "Sin imagen",
}: ImageUploadFieldProps) {
  const [existingImageError, setExistingImageError] = useState(false);
  useEffect(() => {
    setExistingImageError(false);
  }, [existingImageUrl, previewUrl]);
  const displayUrl = previewUrl
    ? `data:image/jpeg;base64,${previewUrl}`
    : existingImageUrl && !existingImageError
      ? existingImageUrl
      : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onChange(null, "");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      alert(`El archivo es demasiado grande. Máximo ${MAX_SIZE_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = (reader.result as string) || "";
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
      onChange(file, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null, "");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-24 h-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
          {displayUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={displayUrl}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized={displayUrl.startsWith("data:") || displayUrl.startsWith("/api/")}
                onError={() => setExistingImageError(true)}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">{placeholderLabel}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Input
            type="file"
            accept={ACCEPT}
            variant="bordered"
            size="sm"
            isDisabled={disabled}
            onChange={handleChange}
            classNames={{
              inputWrapper: "bg-white border-slate-200",
            }}
          />
          <p className="text-xs text-slate-500 mt-1">
            JPG, PNG. Máximo {MAX_SIZE_MB}MB
          </p>
        </div>
      </div>
    </div>
  );
}
