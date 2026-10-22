import {
  Card,
  CardBody,
  Input,
  Switch,
  Button,
  Divider,
  Tooltip,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  TrendingUp,
  HelpCircle,
  Save,
  Calculator,
  RefreshCcw,
  Eraser,
  DollarSign,
  List,
  Layers,
} from "lucide-react";
import { ReglaActualizacion } from "@/hooks/useActualizarPrecios";
import {
  TipoAjustePrecio,
  TipoObjetivo,
  TipoRedondeo,
} from "@/lib/validations/actualizar-precios.schema";

interface ListaPrecioRef {
  Id: number;
  Nombre: string;
}

interface Props {
  regla: ReglaActualizacion;
  setRegla: (regla: ReglaActualizacion) => void;
  listas: ListaPrecioRef[];
  previewModo: boolean;
  previewEstaActualizada: boolean;
  onGenerarPreview: () => void;
  onLimpiarPreview: () => void;
  onAplicar: () => void;
  isApplying: boolean;
  seleccionadosCount: number;
}

const OBJETIVOS: {
  key: TipoObjetivo;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    key: "costo",
    label: "Precio de costo",
    icon: <DollarSign className="w-4 h-4" />,
    desc: "Modifica el costo y recalcula cada lista con su markup.",
  },
  {
    key: "todas_las_listas",
    label: "Todas las listas",
    icon: <Layers className="w-4 h-4" />,
    desc: "Modifica el precio final de todas las listas de precio.",
  },
  {
    key: "lista_especifica",
    label: "Lista especifica",
    icon: <List className="w-4 h-4" />,
    desc: "Modifica el precio final de una sola lista.",
  },
];

// 4 tipos en una grilla 2x2: signo + unidad
const TIPOS: {
  key: TipoAjustePrecio;
  label: string;
  icon: string;
  desc: string;
  ejemplo: string;
  color: string;
}[] = [
  {
    key: "incremento_porcentaje",
    label: "+%",
    icon: "+",
    desc: "Sube en %",
    ejemplo: "$100 → $115",
    color: "#10B981",
  },
  {
    key: "decremento_porcentaje",
    label: "-%",
    icon: "-",
    desc: "Baja en %",
    ejemplo: "$100 → $85",
    color: "#EF4444",
  },
  {
    key: "incremento_fijo",
    label: "+$",
    icon: "+",
    desc: "Sube monto fijo",
    ejemplo: "$100 → $115",
    color: "#10B981",
  },
  {
    key: "decremento_fijo",
    label: "-$",
    icon: "-",
    desc: "Baja monto fijo",
    ejemplo: "$100 → $85",
    color: "#EF4444",
  },
];

const TIPOS_REDONDEO: { key: TipoRedondeo; label: string; desc: string }[] = [
  { key: "none", label: "Sin redondeo", desc: "Mantiene decimales estandar" },
  { key: "ceil", label: "Entero superior", desc: "$1234.10 -> $1235" },
  { key: "ceil_99", label: "* Ceil $99", desc: "Recomendado: $1234 -> $1299" },
  { key: "floor", label: "Entero inferior", desc: "$1234.90 -> $1234" },
];

function esPorcentaje(tipo: TipoAjustePrecio) {
  return tipo === "incremento_porcentaje" || tipo === "decremento_porcentaje";
}

export function PanelRegla({
  regla,
  setRegla,
  listas,
  previewModo,
  previewEstaActualizada,
  onGenerarPreview,
  onLimpiarPreview,
  onAplicar,
  isApplying,
  seleccionadosCount,
}: Props) {
  const handleChange = (key: keyof ReglaActualizacion, value: unknown) => {
    if (key === "objetivo") {
      setRegla({
        ...regla,
        objetivo: value as TipoObjetivo,
        listaPrecioId: null,
      });
      return;
    }
    setRegla({ ...regla, [key]: value });
  };

  const selectedObjetivo = OBJETIVOS.find((o) => o.key === regla.objetivo);
  const previewButtonLabel = !previewModo
    ? "Ver Vista Previa"
    : "Actualizar Vista Previa";
  const previewButtonIcon =
    previewModo && previewEstaActualizada ? (
      <RefreshCcw className="w-4 h-4" />
    ) : (
      <Calculator className="w-4 h-4" />
    );

  return (
    <Card
      className="border"
      style={{
        borderColor: "#E2E8F0",
        boxShadow: "0 4px 6px -1px rgba(15,34,51,0.06), 0 2px 4px -2px rgba(15,34,51,0.04)",
      }}
    >
      <CardBody className="p-5 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "#0F2233",
              boxShadow: "0 2px 8px 0 rgba(15,34,51,0.25)",
            }}
          >
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <h3
            className="font-bold text-base text-[#0F2233]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Regla de Ajuste
          </h3>
        </div>

        {/* Objetivo */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest">
            Que actualizar
          </span>
          <div className="flex rounded-xl border border-[#E2E8F0] overflow-hidden">
            {OBJETIVOS.map((obj) => (
              <button
                key={obj.key}
                type="button"
                onClick={() => handleChange("objetivo", obj.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-[11px] font-medium transition-colors leading-tight ${
                  regla.objetivo === obj.key
                    ? "bg-[#0F2233] text-white font-semibold shadow-sm"
                    : "bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F2233]"
                }`}
              >
                {obj.icon}
                {obj.label}
              </button>
            ))}
          </div>
          {selectedObjetivo && (
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {selectedObjetivo.desc}
            </p>
          )}
        </div>

        {/* Lista especifica selector */}
        {regla.objetivo === "lista_especifica" && (
          <Select
            label="Lista de precios"
            selectedKeys={
              regla.listaPrecioId ? [String(regla.listaPrecioId)] : []
            }
            onChange={(e) =>
              handleChange(
                "listaPrecioId",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            variant="bordered"
            placeholder="Selecciona una lista..."
            isRequired
          >
            {listas.map((l) => (
              <SelectItem key={String(l.Id)} textValue={l.Nombre}>
                {l.Nombre}
              </SelectItem>
            ))}
          </Select>
        )}

        {/* Tipo de ajuste: grilla 2x2 */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest">
            Tipo de ajuste
          </span>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => {
              const isSelected = regla.tipo === t.key;
              const isSubida = t.icon === "+";
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleChange("tipo", t.key)}
                  className="flex flex-col items-center gap-1 rounded-lg border py-3 px-2 transition-all duration-150"
                  style={{
                    borderColor: isSelected
                      ? isSubida ? "#10B981" : "#EF4444"
                      : "#E2E8F0",
                    background: isSelected
                      ? isSubida ? "#ECFDF5" : "#FEF2F2"
                      : "#FFFFFF",
                  }}
                >
                  <span
                    className="text-lg font-extrabold leading-none"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: isSelected
                        ? isSubida ? "#047857" : "#DC2626"
                        : "#475569",
                    }}
                  >
                    {t.label}
                  </span>
                  <span
                    className="text-[10px] font-medium leading-none"
                    style={{
                      color: isSelected
                        ? isSubida ? "#047857" : "#DC2626"
                        : "#94A3B8",
                    }}
                  >
                    {t.desc}
                  </span>
                  {isSelected && (
                    <span
                      className="text-[9px] font-mono mt-0.5 px-1.5 py-0.5 rounded"
                      style={{
                        background: isSubida ? "#D1FAE5" : "#FEE2E2",
                        color: isSubida ? "#047857" : "#DC2626",
                      }}
                    >
                      ej: {t.ejemplo.replace("$15", `$${regla.valor}`).replace("$100 → $115", `$100 → $${100 + (regla.tipo.includes("porcentaje") ? Math.round(100 * regla.valor / 100) : regla.valor)}`).replace("$100 → $85", `$100 → $${100 - (regla.tipo.includes("porcentaje") ? Math.round(100 * regla.valor / 100) : regla.valor)}`)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Valor */}
        <Input
          type="number"
          label={esPorcentaje(regla.tipo) ? "Porcentaje" : "Monto"}
          placeholder="0"
          variant="bordered"
          min={0}
          value={String(regla.valor)}
          onValueChange={(val) =>
            handleChange("valor", Math.max(0, Number(val)))
          }
          startContent={
            <span className="text-slate-400 font-semibold">
              {esPorcentaje(regla.tipo) ? "%" : "$"}
            </span>
          }
          description={(() => {
            const sign = regla.tipo.startsWith("incremento") ? "+" : "-";
            const unit = esPorcentaje(regla.tipo) ? "%" : "$";
            return `Se aplicara ${sign}${regla.valor}${unit} sobre ${
              regla.objetivo === "costo"
                ? "el precio de costo"
                : "el precio final de lista"
            }`;
          })()}
        />

        <Divider />

        {/* Redondeo */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Aplicar redondeo</span>
              <Tooltip content="Ajusta el precio final para que sea mas comercial">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
              </Tooltip>
            </div>
            <Switch
              isSelected={regla.redondear}
              onValueChange={(val) => handleChange("redondear", val)}
              size="sm"
              color="primary"
            />
          </div>

          {regla.redondear && (
            <Select
              label="Tipo de redondeo"
              size="sm"
              selectedKeys={[regla.redondeoTipo]}
              onChange={(e) =>
                handleChange("redondeoTipo", e.target.value as TipoRedondeo)
              }
              variant="flat"
            >
              {TIPOS_REDONDEO.map((r) => (
                <SelectItem
                  key={r.key}
                  textValue={r.label}
                  description={r.desc}
                >
                  {r.label}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>

        <Divider className="my-1" />

        {/* Acciones */}
        <div className="flex flex-col gap-3 mt-auto">
          <Button
            variant={previewModo && previewEstaActualizada ? "solid" : "flat"}
            onPress={onGenerarPreview}
            startContent={
              previewModo && previewEstaActualizada ? (
                <RefreshCcw className="w-4 h-4 text-[#FBBF24]" />
              ) : (
                <Calculator className="w-4 h-4 text-[#0F2233]" />
              )
            }
            className="font-semibold transition-all duration-150"
            style={
              previewModo && previewEstaActualizada
                ? {
                    background: "#0F2233",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 12px 0 rgba(15,34,51,0.25)",
                  }
                : {
                    background: "#F1F5F9",
                    color: "#0F2233",
                  }
            }
          >
            {previewButtonLabel}
          </Button>

          {previewModo && (
            <Button
              variant="bordered"
              onPress={onLimpiarPreview}
              startContent={<Eraser className="w-4 h-4" />}
            >
              Limpiar vista previa
            </Button>
          )}

          <Button
            onPress={onAplicar}
            isLoading={isApplying}
            startContent={<Save className="w-4 h-4" />}
            isDisabled={
              seleccionadosCount === 0 ||
              !previewModo ||
              !previewEstaActualizada
            }
            className="font-bold text-white"
            style={{
              background:
                seleccionadosCount === 0 || !previewModo || !previewEstaActualizada
                  ? undefined
                  : "#FF6100",
              boxShadow:
                seleccionadosCount === 0 || !previewModo || !previewEstaActualizada
                  ? undefined
                  : "0 4px 14px 0 rgba(255,97,0,0.35)",
            }}
          >
            Aplicar a {seleccionadosCount} seleccionados
          </Button>

          {seleccionadosCount === 0 ? (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
              style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
            >
              <span className="text-base">☝️</span>
              <p className="text-[#92400E]">
                Seleccioná artículos en la tabla para continuar
              </p>
            </div>
          ) : !previewModo || !previewEstaActualizada ? (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
              style={{ background: "#FEFCE8", border: "1px solid #FEF08A" }}
            >
              <span className="text-base text-[#D97706]">⚡</span>
              <p className="text-[#854D0E]">
                Presioná <strong>Ver Vista Previa</strong> antes de aplicar
              </p>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
