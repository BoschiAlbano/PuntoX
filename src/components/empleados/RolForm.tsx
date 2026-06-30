"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { ShieldCheck } from "lucide-react";
import {
  PERMISSION_MODULES,
  PERMISSION_MODULE_LABELS,
  WRITABLE_MODULES,
  TIPO_PERFIL,
  type TipoPerfil,
  type PermissionModule,
} from "@/lib/constants/comprobantes";

// ─── Tipo del ítem de rol (Id mayúscula para backward compatibilidad) ───────────
export type RolItem = {
  Id: number;
  nombre: string;
  tipo: TipoPerfil;
  descripcion: string | null;
  usuarios: number;
  permisos: string[];
};

// ─── Constantes ────────────────────────────────────────────────────────────────
const WRITABLE_MODULE_SET = new Set<PermissionModule>(
  WRITABLE_MODULES as PermissionModule[],
);

// ─── Tabla de permisos ─────────────────────────────────────────────────────────
function PermisosTable({
  permisos,
  onChange,
  readOnly = false,
}: {
  permisos: string[];
  onChange?: (permisos: string[]) => void;
  readOnly?: boolean;
}) {
  const toggle = (clave: string) => {
    if (readOnly || !onChange) return;
    const next = permisos.includes(clave)
      ? permisos.filter((p) => p !== clave)
      : [...permisos, clave];
    onChange(next);
  };

  const toggleRow = (mod: PermissionModule, checked: boolean) => {
    if (readOnly || !onChange) return;
    const rowKeys = [
      `${mod}:page`,
      `${mod}:get`,
      ...(WRITABLE_MODULE_SET.has(mod) ? [`${mod}:set`] : []),
    ];
    const next = checked
      ? Array.from(new Set([...permisos, ...rowKeys]))
      : permisos.filter((p) => !rowKeys.includes(p));
    onChange(next);
  };

  const CellBtn = ({ clave, color }: { clave: string; color: string }) => {
    const active = permisos.includes(clave);
    return (
      <button
        type="button"
        disabled={readOnly}
        onClick={() => toggle(clave)}
        className={`w-full h-8 rounded-md text-[11px] font-bold transition-all border ${
          active ? color : "bg-white text-slate-400 border-slate-200"
        }`}
      >
        {active ? "✓" : "+"}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Módulo
            </th>
            <th className="text-center py-3 px-2 text-xs font-bold text-slate-600 uppercase tracking-wider w-20">
              Página
            </th>
            <th className="text-center py-3 px-2 text-xs font-bold text-slate-600 uppercase tracking-wider w-20">
              Leer
            </th>
            <th className="text-center py-3 px-2 text-xs font-bold text-slate-600 uppercase tracking-wider w-20">
              Escribir
            </th>
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MODULES.map((mod) => {
            const hasWrite = WRITABLE_MODULE_SET.has(mod);
            const rowKeys = [
              `${mod}:page`,
              `${mod}:get`,
              ...(hasWrite ? [`${mod}:set`] : []),
            ];
            const allActive = rowKeys.every((k) => permisos.includes(k));
            return (
              <tr
                key={mod}
                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-2 px-4">
                  <label
                    className={`flex items-center gap-3 select-none ${
                      readOnly ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={allActive}
                      onChange={(e) => toggleRow(mod, e.target.checked)}
                      className={`w-4 h-4 rounded accent-[#0F2233] ${
                        readOnly ? "cursor-default" : "cursor-pointer"
                      }`}
                    />
                    <span className="font-semibold text-slate-700">
                      {PERMISSION_MODULE_LABELS[mod]}
                    </span>
                  </label>
                </td>
                <td className="py-2 px-2">
                  <CellBtn
                    clave={`${mod}:page`}
                    color="bg-[#0F2233]/10 text-[#0F2233] border-[#0F2233]/30"
                  />
                </td>
                <td className="py-2 px-2">
                  <CellBtn
                    clave={`${mod}:get`}
                    color="bg-blue-50 text-blue-600 border-blue-200"
                  />
                </td>
                <td className="py-2 px-2">
                  {hasWrite ? (
                    <CellBtn
                      clave={`${mod}:set`}
                      color="bg-amber-50 text-amber-600 border-amber-200"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-8 text-slate-300 text-xs font-medium">
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <p className="text-xs text-slate-500 font-medium">
          <span className="text-[#0F2233] font-bold">Página</span> → acceso a la
          sección · <span className="text-blue-600 font-bold">Leer</span> →
          consultar datos ·{" "}
          <span className="text-amber-600 font-bold">Escribir</span> → crear,
          editar y eliminar
        </p>
      </div>
    </div>
  );
}

// ─── Estado inicial del formulario ─────────────────────────────────────────────
const rolPorDefecto: Partial<RolItem> = {
  Id: 0,
  nombre: "",
  descripcion: "",
  tipo: TIPO_PERFIL.EMPLEADO as TipoPerfil,
  permisos: [],
};

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface RolFormProps {
  initialData?: RolItem | null;
  onSubmit: (data: Partial<RolItem>) => void;
  isSaving: boolean;
  onCancel: () => void;
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function RolForm({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: RolFormProps) {
  const [formData, setFormData] = useState<Partial<RolItem>>(rolPorDefecto);

  const isEdit = !!initialData;
  const esRolSistema =
    isEdit &&
    ((initialData?.Id ?? 0) < 0 ||
      initialData?.nombre.toLowerCase() === "administrador" ||
      initialData?.nombre.toLowerCase() === "admin" ||
      initialData?.nombre.toLowerCase() === "superadmin");

  // Inicializar formulario cuando se carga initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        Id: initialData.Id,
        nombre: initialData.nombre,
        descripcion: initialData.descripcion ?? "",
        tipo: initialData.tipo,
        permisos: initialData.permisos ?? [],
      });
    } else {
      setFormData(rolPorDefecto);
    }
  }, [initialData]);

  const handleChange = (field: keyof RolItem, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit({
      nombre: formData.nombre?.trim(),
      descripcion: formData.descripcion?.trim() || "",
      tipo: formData.tipo,
      permisos: formData.permisos ?? [],
    });
  };

  const inputClassNames = {
    inputWrapper:
      "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#0F2233] focus-within:ring-1 focus-within:ring-[#0F2233]/20",
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-linear-to-br from-[#0F2233] to-[#1a364d] shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isEdit ? "Editar Rol" : "Crear Nuevo Rol"}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isEdit
                ? "Modifica los permisos y configuración del rol."
                : "Define permisos base. Luego podrás afinarlos en cada usuario."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="flat"
            onPress={onCancel}
            isDisabled={isSaving}
            className="flex-1 sm:flex-none font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            isDisabled={!formData.nombre}
            className="flex-1 sm:flex-none bg-[#0F2233] hover:bg-[#1a364d] text-white font-semibold shadow-md shadow-[#0F2233]/20"
          >
            {isEdit ? "Guardar cambios" : "Crear rol"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: Configuración */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
              <ShieldCheck className="text-slate-400 w-5 h-5" />
              <h3 className="font-semibold text-slate-800 text-base">
                Configuración del Rol
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <Input
                label="Nombre"
                placeholder="Ej: Supervisor de turno"
                autoFocus
                value={formData.nombre ?? ""}
                onValueChange={(value) => handleChange("nombre", value)}
                isRequired
                isDisabled={esRolSistema || isSaving}
                classNames={inputClassNames}
              />
              <Select
                label="Tipo de perfil base"
                selectedKeys={formData.tipo ? [formData.tipo] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) handleChange("tipo", val as TipoPerfil);
                }}
                isDisabled={esRolSistema || isSaving}
                isRequired
                description="Heredará restricciones de este tipo de perfil"
              >
                <SelectItem key={TIPO_PERFIL.EMPLEADO} textValue="Empleado">
                  Empleado
                </SelectItem>
                <SelectItem
                  key={TIPO_PERFIL.ADMINISTRADOR}
                  textValue="Administrador"
                >
                  Administrador
                </SelectItem>
              </Select>
              <Textarea
                label="Descripción"
                placeholder="Qué puede y qué no puede hacer este rol"
                value={formData.descripcion ?? ""}
                onValueChange={(value) => handleChange("descripcion", value)}
                isDisabled={isSaving}
                classNames={inputClassNames}
                minRows={3}
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Permisos */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Matriz de Permisos
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Seleccioná qué accesos tendrá este rol en cada módulo.
              </p>
            </div>
            <div className="sm:p-6 p-1 flex-1 bg-slate-50/30">
              <PermisosTable
                permisos={formData.permisos ?? []}
                onChange={(permisos) => handleChange("permisos", permisos)}
                readOnly={isSaving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
