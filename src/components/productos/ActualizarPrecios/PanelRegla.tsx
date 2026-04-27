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
const TIPOS: { key: TipoAjustePrecio; label: string; icon: string }[] = [
  { key: "incremento_porcentaje", label: "+%", icon: "+" },
  { key: "decremento_porcentaje", label: "-%", icon: "-" },
  { key: "incremento_fijo", label: "+$", icon: "+" },
  { key: "decremento_fijo", label: "-$", icon: "-" },
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
    <Card className="border border-[#67afc3]/20 shadow-lg shadow-[#67afc3]/5">
      <CardBody className="p-5 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2 text-[#67afc3]">
          <TrendingUp className="w-5 h-5" />
          <h3 className="font-bold text-lg">Regla de Ajuste</h3>
        </div>

        {/* Objetivo */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Que actualizar
          </span>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {OBJETIVOS.map((obj) => (
              <button
                key={obj.key}
                type="button"
                onClick={() => handleChange("objetivo", obj.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-[11px] font-medium transition-colors leading-tight ${
                  regla.objetivo === obj.key
                    ? "bg-[#67afc3] text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {obj.icon}
                {obj.label}
              </button>
            ))}
          </div>
          {selectedObjetivo && (
            <p className="text-[11px] text-slate-500 leading-relaxed">
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
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Tipo de ajuste
          </span>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleChange("tipo", t.key)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-bold transition-colors ${
                  regla.tipo === t.key
                    ? "border-[#67afc3] bg-[#67afc3]/10 text-[#67afc3]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
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
            color={
              previewModo && previewEstaActualizada ? "primary" : "default"
            }
            onPress={onGenerarPreview}
            startContent={previewButtonIcon}
            className="font-semibold"
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
            color="success"
            className="text-white font-bold"
            startContent={<Save className="w-4 h-4" />}
            onPress={onAplicar}
            isLoading={isApplying}
            isDisabled={
              seleccionadosCount === 0 ||
              !previewModo ||
              !previewEstaActualizada
            }
          >
            Aplicar a {seleccionadosCount} seleccionados
          </Button>

          {seleccionadosCount === 0 ? (
            <p className="text-[10px] text-center text-slate-400 italic">
              Selecciona articulos en la tabla para aplicar cambios
            </p>
          ) : !previewModo || !previewEstaActualizada ? (
            <p className="text-[10px] text-center text-slate-400 italic">
              Genera la vista previa antes de aplicar los cambios
            </p>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
