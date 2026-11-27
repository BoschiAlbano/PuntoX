"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Switch,
} from "@heroui/react";
import { modalMotionProps } from "@/lib/motionConfig";
import type { GenericFormProps } from "@/components/shared/GenericCrud";

export type PlanLimites = {
  maxSucursales: number | null;
  maxUsuarios: number | null;
  maxArticulos: number | null;
  incluyeAFIP: boolean;
};

export type Plan = {
  Id: number;
  Nombre: string;
  Descripcion: string;
  CostoMensual: number;
  Limites: PlanLimites;
  CantidadTenants: number;
};

type ClaveLimite = "maxSucursales" | "maxUsuarios" | "maxArticulos";

const CAMPOS: { clave: ClaveLimite; label: string; ayuda: string }[] = [
  { clave: "maxSucursales", label: "Sucursales", ayuda: "Cantidad máxima de sucursales." },
  { clave: "maxUsuarios", label: "Usuarios", ayuda: "Incluye al dueño o administrador." },
  { clave: "maxArticulos", label: "Artículos", ayuda: "Productos y combos del catálogo." },
];

/** Valores iniciales de un plan nuevo. */
const LIMITES_NUEVO: PlanLimites = {
  maxSucursales: 1,
  maxUsuarios: 3,
  maxArticulos: 1000,
  incluyeAFIP: true,
};

type EstadoLimite = { ilimitado: boolean; valor: string };

const aEstado = (v: number | null): EstadoLimite =>
  v === null ? { ilimitado: true, valor: "" } : { ilimitado: false, valor: String(v) };

/** Error del campo, o null si es válido. */
function errorLimite(e: EstadoLimite): string | null {
  if (e.ilimitado) return null;
  const n = Number(e.valor);
  if (e.valor.trim() === "" || !Number.isInteger(n)) return "Ingresá un número entero";
  if (n < 1) return "Tiene que ser al menos 1";
  return null;
}

export default function PlanForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Plan>) {
  const isEdit = !!initialData;

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costoMensual, setCostoMensual] = useState("");
  const [limites, setLimites] = useState<Record<ClaveLimite, EstadoLimite>>({
    maxSucursales: aEstado(LIMITES_NUEVO.maxSucursales),
    maxUsuarios: aEstado(LIMITES_NUEVO.maxUsuarios),
    maxArticulos: aEstado(LIMITES_NUEVO.maxArticulos),
  });
  const [incluyeAFIP, setIncluyeAFIP] = useState(true);

  useEffect(() => {
    const base = initialData?.Limites ?? LIMITES_NUEVO;
    setNombre(initialData?.Nombre ?? "");
    setDescripcion(initialData?.Descripcion ?? "");
    setCostoMensual(initialData ? String(initialData.CostoMensual ?? "") : "");
    setLimites({
      maxSucursales: aEstado(base.maxSucursales),
      maxUsuarios: aEstado(base.maxUsuarios),
      maxArticulos: aEstado(base.maxArticulos),
    });
    setIncluyeAFIP(base.incluyeAFIP);
  }, [initialData, isOpen]);

  const cambiarLimite = (clave: ClaveLimite, cambio: Partial<EstadoLimite>) =>
    setLimites((prev) => ({ ...prev, [clave]: { ...prev[clave], ...cambio } }));

  const hayErrores = CAMPOS.some(({ clave }) => errorLimite(limites[clave]) !== null);
  const costo = Number(costoMensual || 0);
  const costoInvalido = !Number.isFinite(costo) || costo < 0;

  const handleSubmit = () => {
    if (!nombre.trim() || hayErrores || costoInvalido) return;

    const valor = (clave: ClaveLimite) =>
      limites[clave].ilimitado ? null : Number(limites[clave].valor);

    onSubmit({
      ...(initialData ? { Id: initialData.Id } : {}),
      Nombre: nombre.trim(),
      Descripcion: descripcion.trim(),
      CostoMensual: costo,
      Limites: {
        maxSucursales: valor("maxSucursales"),
        maxUsuarios: valor("maxUsuarios"),
        maxArticulos: valor("maxArticulos"),
        incluyeAFIP,
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="opaque"
      motionProps={modalMotionProps}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">
            {isEdit ? "Editar Plan" : "Nuevo Plan"}
          </h2>
          <p className="text-sm text-slate-500 font-normal">
            {isEdit
              ? "Modificá los datos y límites del plan SaaS"
              : "Creá un nuevo plan para asignar a tiendas"}
          </p>
        </ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Nombre del plan"
            variant="bordered"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Plan Básico"
            isRequired
            autoFocus
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />
          <Textarea
            label="Descripción"
            variant="bordered"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Para quién es este plan..."
            minRows={2}
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />
          <Input
            label="Costo Mensual"
            variant="bordered"
            type="number"
            min={0}
            value={costoMensual}
            onChange={(e) => setCostoMensual(e.target.value)}
            placeholder="0.00"
            isInvalid={costoInvalido}
            errorMessage="El costo no puede ser negativo"
            startContent={<span className="text-slate-400 text-sm">$</span>}
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />

          <section aria-labelledby="limites-plan" className="space-y-3 pt-1">
            <div>
              <h3 id="limites-plan" className="text-sm font-semibold text-slate-800">
                Límites
              </h3>
              <p className="text-xs text-slate-500">
                Al llegar al máximo, la tienda no puede crear más. Lo que ya existe no se borra.
              </p>
            </div>

            {CAMPOS.map(({ clave, label, ayuda }) => {
              const estado = limites[clave];
              const error = errorLimite(estado);
              return (
                <div
                  key={clave}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Input
                      label={label}
                      description={ayuda}
                      variant="bordered"
                      type="number"
                      min={1}
                      step={1}
                      size="sm"
                      value={estado.ilimitado ? "" : estado.valor}
                      placeholder={estado.ilimitado ? "Ilimitado" : undefined}
                      onChange={(e) => cambiarLimite(clave, { valor: e.target.value })}
                      isDisabled={estado.ilimitado}
                      isInvalid={error !== null}
                      errorMessage={error ?? undefined}
                      classNames={{ inputWrapper: "bg-white border-slate-200" }}
                    />
                  </div>
                  <Switch
                    size="sm"
                    className="mt-2 shrink-0"
                    isSelected={estado.ilimitado}
                    onValueChange={(ilimitado) =>
                      cambiarLimite(clave, {
                        ilimitado,
                        // Al desmarcar "Ilimitado" se propone un valor para editar
                        ...(!ilimitado && estado.valor === "" ? { valor: "1" } : {}),
                      })
                    }
                    classNames={{ label: "text-sm text-slate-700" }}
                  >
                    {/* Nombre accesible distinto para cada interruptor */}
                    <span className="sr-only">{label}</span> Ilimitado
                  </Switch>
                </div>
              );
            })}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Facturación electrónica ARCA</p>
                <p className="text-xs text-slate-500">
                  Permite emitir facturas con CAE desde la caja.
                </p>
              </div>
              <Switch
                size="sm"
                isSelected={incluyeAFIP}
                onValueChange={setIncluyeAFIP}
                aria-label="Incluye facturación electrónica ARCA"
              />
            </div>
          </section>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isSaving}>
            Cancelar
          </Button>
          <Button
            color="primary"
            className="bg-[#0f2233]"
            onPress={handleSubmit}
            isLoading={isSaving}
            isDisabled={!nombre.trim() || hayErrores || costoInvalido}
          >
            {isEdit ? "Guardar cambios" : "Crear plan"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
