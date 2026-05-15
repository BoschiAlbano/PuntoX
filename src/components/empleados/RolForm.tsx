"use client";

import { modalMotionProps } from "@/lib/motionConfig";
import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { ShieldCheck } from "lucide-react";
import { GenericFormProps } from "@/components/shared/GenericCrud";
import {
  PERMISSION_MODULES,
  PERMISSION_MODULE_LABELS,
  WRITABLE_MODULES,
  TIPO_PERFIL,
  type TipoPerfil,
  type PermissionModule,
} from "@/lib/constants/comprobantes";

// ─── Tipo del ítem de rol (Id mayúscula para GenericCrud) ──────────────────────
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Módulo
            </th>
            <th className="text-center py-2 px-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-16 sm:w-20">
              Página
            </th>
            <th className="text-center py-2 px-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-16 sm:w-20">
              Leer
            </th>
            <th className="text-center py-2 px-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-16 sm:w-20">
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
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="py-1.5 px-3">
                  <label
                    className={`flex items-center gap-2 select-none ${
                      readOnly ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={allActive}
                      onChange={(e) => toggleRow(mod, e.target.checked)}
                      className={`w-4 h-4 rounded accent-[#67afc3] ${
                        readOnly ? "cursor-default" : "cursor-pointer"
                      }`}
                    />
                    <span className="font-medium text-slate-700">
                      {PERMISSION_MODULE_LABELS[mod]}
                    </span>
                  </label>
                </td>
                <td className="py-1.5 px-2">
                  <CellBtn
                    clave={`${mod}:page`}
                    color="bg-[#67afc3]/10 text-[#67afc3] border-[#67afc3]/30"
                  />
                </td>
                <td className="py-1.5 px-2">
                  <CellBtn
                    clave={`${mod}:get`}
                    color="bg-blue-50 text-blue-600 border-blue-200"
                  />
                </td>
                <td className="py-1.5 px-2">
                  {hasWrite ? (
                    <CellBtn
                      clave={`${mod}:set`}
                      color="bg-amber-50 text-amber-600 border-amber-200"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-8 text-slate-300 text-xs">
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-400">
        <span className="text-[#67afc3] font-semibold">Página</span> → acceso a
        la sección ·{" "}
        <span className="text-blue-500 font-semibold">Leer</span> → consultar
        datos ·{" "}
        <span className="text-amber-500 font-semibold">Escribir</span> → crear,
        editar y eliminar
      </p>
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

// ─── Componente principal ──────────────────────────────────────────────────────
export default function RolForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<RolItem>) {
  const [formData, setFormData] = useState<Partial<RolItem>>(rolPorDefecto);

  const isEdit = !!initialData;
  const esRolSistema =
    isEdit &&
    ((initialData?.Id ?? 0) < 0 ||
      initialData?.nombre.toLowerCase() === "administrador" ||
      initialData?.nombre.toLowerCase() === "admin" ||
      initialData?.nombre.toLowerCase() === "superadmin");

  // Inicializar formulario cuando se abre
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
  }, [initialData, isOpen]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="opaque"
      isDismissable={!isSaving}
      placement="center"
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{
        backdrop: "bg-slate-900/40 backdrop-blur-md",
        base: "font-sans bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60 w-full mx-2 sm:mx-0",
        header:
          "border-b border-slate-100/60 pb-4 pt-5 px-5 sm:px-6 bg-transparent",
        body: "py-5 px-5 sm:px-6 overflow-y-auto overflow-x-hidden",
        footer:
          "border-t border-slate-100/60 py-4 px-5 sm:px-6 bg-transparent",
        closeButton:
          "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#67afc3]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {isEdit ? "Editar Rol" : "Crear Nuevo Rol"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEdit
                  ? "Modifica los permisos y configuración del rol."
                  : "Define permisos base. Luego podrás afinarlos en cada usuario."}
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              label="Nombre"
              placeholder="Ej: Supervisor de turno"
              value={formData.nombre ?? ""}
              onChange={(e) => handleChange("nombre", e.target.value)}
              isRequired
              isDisabled={esRolSistema}
              classNames={{
                inputWrapper:
                  "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
              }}
            />
            <Select
              label="Tipo de rol"
              selectedKeys={formData.tipo ? [formData.tipo] : []}
              onChange={(e) =>
                handleChange("tipo", e.target.value as TipoPerfil)
              }
              isDisabled={esRolSistema}
              isRequired
            >
              <SelectItem key={TIPO_PERFIL.EMPLEADO}>Empleado</SelectItem>
            </Select>
          </div>

          <Textarea
            label="Descripción"
            placeholder="Qué puede y qué no puede hacer este rol"
            value={formData.descripcion ?? ""}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            classNames={{
              inputWrapper:
                "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
            }}
          />

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Permisos</p>
            <PermisosTable
              permisos={formData.permisos ?? []}
              onChange={(permisos) => handleChange("permisos", permisos)}
            />
          </div>
        </ModalBody>

        <ModalFooter className="gap-3">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="font-medium text-[#6b7280] hover:bg-[#f1f5f9] h-11 px-5 rounded-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow"
          >
            {isEdit ? "Guardar cambios" : "Crear rol"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
