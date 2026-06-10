import { modalMotionProps } from "@/lib/motionConfig";
import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Switch,
  Select,
  SelectItem,
  NumberInput,
  Chip,
  addToast,
  Autocomplete,
  AutocompleteItem,
  Tooltip,
} from "@heroui/react";
import { Producto } from "@/lib/validations/producto.schema";
// import { GenericFormProps } from "@/components/shared/GenericCrud";
export interface ProductoFormProps {
  initialData: Producto | null;
  onSubmit: (data: Partial<Producto>) => void;
  isSaving: boolean;
  onCancel: () => void;
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  FileText,
  Tags,
  DollarSign,
  Package,
  Settings,
  X,
  Percent,
  Trash2,
  Wand2,
} from "lucide-react";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import MarcaGenericForm from "../marcas/MarcaForm";
import RubroGenericForm from "../rubros/RubroForm";
import UnidadMedidaGenericForm from "../unidad-medida/UnidadMedidaForm";
import { TiposVenta } from "../../../prisma/generated/prisma";
import { LoadingComponent } from "../loading/loading";

const inputClassNames = {
  inputWrapper:
    "bg-white border border-slate-200 shadow-none hover:border-slate-300 focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
};

function getSectionStatus(formData: Partial<Producto>) {
  const general =
    (formData.Codigo ?? 0) > 0 &&
    (formData.CodigoBarra?.trim() ?? "").length > 0 &&
    (formData.Descripcion?.trim() ?? "").length > 0;
  const categorizacion =
    (formData.MarcaId ?? 0) > 0 &&
    (formData.RubroId ?? 0) > 0 &&
    (formData.UnidadMedidaId ?? 0) > 0 &&
    (formData.IvaId ?? 0) > 0;
  const precios = (formData.PreciosLista ?? []).some(
    (p) => (p.PrecioFinal ?? 0) > 0,
  );
  const promociones = true;
  const stock = (formData.Stock ?? 0) > 0;
  return {
    general,
    categorizacion,
    precios,
    promociones,
    stock,
    configuracion: true,
  };
}

const defaultProducto: Producto = {
  Id: 0,
  MarcaId: 0,
  RubroId: 0,
  UnidadMedidaId: 0,
  IvaId: 0,
  Codigo: 0,
  CodigoBarra: "",
  Abreviatura: "",
  Descripcion: "",
  Detalle: "",
  Ubicacion: "",
  ActivarLimiteVenta: false,
  LimiteVenta: 0,
  ActivarHoraVenta: false,
  HoraLimiteVentaDesde: "00:00",
  HoraLimiteVentaHasta: "23:59",
  PermiteStockNegativo: false,
  DescuentaStock: true,
  StockMinimo: 0,
  VencimientoDias: 0,
  TipoVenta: TiposVenta.UNIDAD,
  EstaEliminado: false,
  PrecioCosto: 0,
  PreciosLista: [],
  PromocionesCantidad: [],
  Stock: 0,
  EsCombo: false,
  ComponentesCombo: [],
};

const fetchProductos = async () => {
  const res = await fetch("/api/productos");
  if (!res.ok) throw new Error("Error fetching productos");
  const data = await res.json();
  return data.data;
};

const fetchMarcas = async () => {
  const res = await fetch("/api/marcas");
  if (!res.ok) throw new Error("Error fetching marcas");
  const data = await res.json();
  return data.data;
};

const fetchRubros = async () => {
  const res = await fetch("/api/rubros");
  if (!res.ok) throw new Error("Error fetching rubros");
  const data = await res.json();
  return data.data;
};

const fetchUnidadesMedida = async () => {
  const res = await fetch("/api/unidades-medidas");
  if (!res.ok) throw new Error("Error fetching unidades");
  const data = await res.json();
  return data.data;
};

const fetchIvas = async () => {
  const res = await fetch("/api/ivas");
  if (!res.ok) throw new Error("Error fetching ivas");
  const data = await res.json();
  return data.data;
};

const fetchUltimoCodigo = async () => {
  const res = await fetch("/api/productos/ultimo-codigo");
  if (!res.ok) throw new Error("Error fetching ultimo codigo");
  const data = await res.json();
  return data;
};

const fetchListasPrecios = async () => {
  const res = await fetch("/api/listas-precios");
  if (!res.ok) throw new Error("Error fetching listas");
  const data = await res.json();
  return data.data;
};

type SectionKey =
  | "general"
  | "categorizacion"
  | "precios"
  | "promociones"
  | "stock"
  | "configuracion"
  | "componentes";

export default function ProductoForm({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: ProductoFormProps) {
  const [formData, setFormData] = useState<Partial<Producto>>(defaultProducto);
  const [activeSection, setActiveSection] = useState<SectionKey>("general");

  const queryClient = useQueryClient();
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
  const [isRubroModalOpen, setIsRubroModalOpen] = useState(false);
  const [isUnidadModalOpen, setIsUnidadModalOpen] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");

  const createMarcaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/marcas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear marca");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["marcas-generic"] });
      setFormData((prev) => ({ ...prev, MarcaId: data.Id }));
      setIsMarcaModalOpen(false);
      addToast({
        title: "Éxito",
        description: "Marca creada correctamente",
        color: "success",
        timeout: 3000,
      });
    },
    onError: (error: any) => {
      addToast({
        title: "Error",
        description: error.message || "Error al crear marca",
        color: "danger",
        timeout: 3000,
      });
    },
  });

  const createRubroMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/rubros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear rubro");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rubros-generic"] });
      setFormData((prev) => ({ ...prev, RubroId: data.Id }));
      setIsRubroModalOpen(false);
      addToast({
        title: "Éxito",
        description: "Rubro creado correctamente",
        color: "success",
        timeout: 3000,
      });
    },
    onError: (error: any) => {
      addToast({
        title: "Error",
        description: error.message || "Error al crear rubro",
        color: "danger",
        timeout: 3000,
      });
    },
  });

  const createUnidadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/unidades-medidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear unidad");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unidades-medidas-generic"] });
      setFormData((prev) => ({ ...prev, UnidadMedidaId: data.Id }));
      setIsUnidadModalOpen(false);
      addToast({
        title: "Éxito",
        description: "Unidad creada correctamente",
        color: "success",
        timeout: 3000,
      });
    },
    onError: (error: any) => {
      addToast({
        title: "Error",
        description: error.message || "Error al crear unidad",
        color: "danger",
        timeout: 3000,
      });
    },
  });

  const { data: productos = [], isLoading: isLoadingProductos } = useQuery({
    queryKey: ["productos-generic"],
    queryFn: fetchProductos,
  });
  const { data: marcas = [], isLoading: isLoadingMarcas } = useQuery({
    queryKey: ["marcas-generic"],
    queryFn: fetchMarcas,
  });
  const { data: rubros = [], isLoading: isLoadingRubros } = useQuery({
    queryKey: ["rubros-generic"],
    queryFn: fetchRubros,
  });
  const { data: unidades = [], isLoading: isLoadingUnidades } = useQuery({
    queryKey: ["unidades-medidas-generic"],
    queryFn: fetchUnidadesMedida,
  });
  const { data: ivas = [], isLoading: isLoadingIvas } = useQuery({
    queryKey: ["ivas-generic"],
    queryFn: fetchIvas,
  });
  const { data: listasPrecios = [], isLoading: isLoadingListas } = useQuery({
    queryKey: ["listas-precios-generic"],
    queryFn: fetchListasPrecios,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: nextCodeData } = useQuery({
    queryKey: ["ultimo-codigo"],
    queryFn: fetchUltimoCodigo,
    enabled: !initialData,
    refetchOnMount: "always",
  });

  const { data: fullProduct, isLoading: isLoadingFullProduct } = useQuery({
    queryKey: ["producto-detail", initialData?.Id],
    queryFn: async () => {
      const res = await fetch(`/api/productos/${initialData?.Id}`);
      if (!res.ok) throw new Error("Error loading product");
      return res.json();
    },
    enabled: !!initialData?.Id,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (fullProduct) {
      setFormData(fullProduct);
    } else if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultProducto);
    }
    setFotoFile(null);
    setFotoPreview("");
  }, [initialData, fullProduct]);

  useEffect(() => {
    if (!initialData && nextCodeData?.ultimoCodigo) {
      setFormData((prev) => ({ ...prev, Codigo: nextCodeData.ultimoCodigo }));
    }
  }, [nextCodeData, initialData]);

  const handleSubmit = () => {
    const dataToSubmit = { ...formData, EsCombo: false, ComponentesCombo: [] };
    if (fotoPreview) dataToSubmit.Foto = fotoPreview;
    onSubmit(dataToSubmit);
  };

  const updatePrecio = (
    listaId: number | null,
    field: string,
    value: number,
  ) => {
    setFormData((prev) => {
      if (listaId === null && field === "PrecioCosto") {
        const newCosto = value;
        const newPreciosLista = (prev.PreciosLista || []).map((p) => ({
          ...p,
          PrecioFinal: parseFloat(
            (newCosto * (1 + (p.PorcentajeGanancia || 0) / 100)).toFixed(2),
          ),
        }));
        return {
          ...prev,
          PrecioCosto: newCosto,
          PreciosLista: newPreciosLista,
        };
      }

      const prevCosto = prev.PrecioCosto || 0;
      const currentListas = [...(prev.PreciosLista || [])];
      const listaIndex = currentListas.findIndex(
        (p) => p.ListaPrecioId === listaId,
      );

      const currentLista =
        listaIndex >= 0
          ? currentListas[listaIndex]
          : {
              ListaPrecioId: listaId as number,
              PorcentajeGanancia: 0,
              PrecioFinal: 0,
            };

      if (field === "PorcentajeGanancia") {
        currentLista.PorcentajeGanancia = value;
        currentLista.PrecioFinal = parseFloat(
          (prevCosto * (1 + value / 100)).toFixed(2),
        );
      } else if (field === "PrecioFinal") {
        currentLista.PrecioFinal = value;
        if (prevCosto > 0) {
          currentLista.PorcentajeGanancia = parseFloat(
            ((value / prevCosto - 1) * 100).toFixed(2),
          );
        }
      }

      if (listaIndex >= 0) {
        currentListas[listaIndex] = {
          ...currentLista,
          ListaPrecioId: currentLista.ListaPrecioId as number,
        };
      } else {
        currentListas.push({
          ...currentLista,
          ListaPrecioId: currentLista.ListaPrecioId as number,
        });
      }

      return { ...prev, PreciosLista: currentListas };
    });
  };

  const isEdit = !!initialData;
  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      {isLoadingFullProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <LoadingComponent message="Cargando detalles..." />
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#67afc3] to-[#4899b0] shadow-sm">
            <Package size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
              {isEdit ? "Editar Producto" : "Nuevo Producto"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit
                ? formData.Descripcion || "Sin nombre"
                : "Completá la información del producto"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            onPress={onCancel}
            isDisabled={isSaving}
            className="font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-5 h-10"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            className="bg-[#67afc3] hover:bg-[#4899b0] text-white font-bold rounded-xl shadow-md shadow-[#67afc3]/30 px-6 h-10"
          >
            {isEdit ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </div>
      </div>

      {/* ── Grid Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* GENERAL */}
          <Card className="shadow-sm border border-slate-200/60 bg-white overflow-visible">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <FileText size={18} className="text-[#67afc3]" /> Información
                General
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Código"
                  placeholder="Ej: 1"
                  autoFocus
                  type="number"
                  value={formData.Codigo?.toString() || ""}
                  max={Number(process.env.MAX_ARTICLE_CODE || 999)}
                  min={1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Codigo: parseInt(e.target.value) || 0,
                    })
                  }
                  isRequired
                  isDisabled={isLoadingFullProduct || isSaving}
                  classNames={inputClassNames}
                />
                <Input
                  label="Código de Barras"
                  placeholder="Ej: 7790001234567"
                  value={formData.CodigoBarra || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      CodigoBarra: e.target.value,
                    })
                  }
                  type="text"
                  isRequired
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                  endContent={
                    <Tooltip
                      content="Generar código automático"
                      placement="top"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          // Generamos un código de 12 dígitos comenzando con '100'
                          // para evitar choques con balanzas (que usan 13 dígitos y empiezan con 20-29).
                          const randomCode =
                            "100" +
                            Math.floor(Math.random() * 1000000000)
                              .toString()
                              .padStart(9, "0");
                          setFormData({ ...formData, CodigoBarra: randomCode });
                        }}
                        className="text-slate-400 hover:text-[#67afc3] transition-colors focus:outline-none"
                        disabled={isSaving}
                      >
                        <Wand2 size={18} />
                      </button>
                    </Tooltip>
                  }
                />
                <Input
                  label="Abreviatura"
                  placeholder="Ej: PROD-001"
                  value={formData.Abreviatura || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Abreviatura: e.target.value,
                    })
                  }
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                />
                <Input
                  label="Descripción"
                  placeholder="Nombre del producto"
                  value={formData.Descripcion || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Descripcion: e.target.value,
                    })
                  }
                  isRequired
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                />
              </div>
              <Textarea
                label="Detalle"
                placeholder="Descripción detallada del producto"
                value={formData.Detalle || ""}
                onChange={(e) =>
                  setFormData({ ...formData, Detalle: e.target.value })
                }
                minRows={2}
                isDisabled={isSaving}
                classNames={{ ...inputClassNames, input: "resize-none" }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Ubicación"
                  placeholder="Ej: Pasillo 2, Estante B"
                  value={formData.Ubicacion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Ubicacion: e.target.value })
                  }
                  isDisabled={isSaving}
                  classNames={inputClassNames}
                />
              </div>
            </CardBody>
          </Card>

          {/* CATEGORIZACIÓN */}
          <Card className="shadow-sm border border-slate-200/60 bg-white overflow-visible">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Tags size={18} className="text-[#67afc3]" /> Categorización
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Autocomplete
                    label="Marca"
                    placeholder="Seleccione una marca"
                    selectedKey={
                      formData.MarcaId ? formData.MarcaId.toString() : null
                    }
                    onSelectionChange={(key) =>
                      setFormData({
                        ...formData,
                        MarcaId: key ? parseInt(key.toString()) : 0,
                      })
                    }
                    isRequired
                    isDisabled={isSaving}
                  >
                    {isLoadingMarcas ? (
                      <AutocompleteItem key="0" textValue="Cargando...">
                        Cargando...
                      </AutocompleteItem>
                    ) : (
                      marcas?.map((marca: any) => (
                        <AutocompleteItem
                          key={marca.Id.toString()}
                          textValue={marca.Descripcion}
                        >
                          {marca.Descripcion}
                        </AutocompleteItem>
                      ))
                    )}
                  </Autocomplete>
                  <Button
                    isIconOnly
                    variant="flat"
                    onPress={() => setIsMarcaModalOpen(true)}
                    className="h-14 min-w-12 bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/20 border border-[#67afc3]/20"
                  >
                    <PlusIcon size={18} />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Autocomplete
                    label="Rubro"
                    placeholder="Seleccione un rubro"
                    selectedKey={
                      formData.RubroId ? formData.RubroId.toString() : null
                    }
                    onSelectionChange={(key) =>
                      setFormData({
                        ...formData,
                        RubroId: key ? parseInt(key.toString()) : 0,
                      })
                    }
                    isRequired
                    isDisabled={isSaving}
                  >
                    {isLoadingRubros ? (
                      <AutocompleteItem key="0" textValue="Cargando...">
                        Cargando...
                      </AutocompleteItem>
                    ) : (
                      rubros?.map((rubro: any) => (
                        <AutocompleteItem
                          key={rubro.Id.toString()}
                          textValue={rubro.Descripcion}
                        >
                          {rubro.Descripcion}
                        </AutocompleteItem>
                      ))
                    )}
                  </Autocomplete>
                  <Button
                    isIconOnly
                    variant="flat"
                    onPress={() => setIsRubroModalOpen(true)}
                    className="h-14 min-w-12 bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/20 border border-[#67afc3]/20"
                  >
                    <PlusIcon size={18} />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Autocomplete
                    label="Unidad de Medida"
                    placeholder="Seleccione unidad"
                    selectedKey={
                      formData.UnidadMedidaId
                        ? formData.UnidadMedidaId.toString()
                        : null
                    }
                    onSelectionChange={(key) =>
                      setFormData({
                        ...formData,
                        UnidadMedidaId: key ? parseInt(key.toString()) : 0,
                      })
                    }
                    isRequired
                    isDisabled={isSaving}
                  >
                    {isLoadingUnidades ? (
                      <AutocompleteItem key="0" textValue="Cargando...">
                        Cargando...
                      </AutocompleteItem>
                    ) : (
                      unidades?.map((unidad: any) => (
                        <AutocompleteItem
                          key={unidad.Id.toString()}
                          textValue={unidad.Descripcion}
                        >
                          {unidad.Descripcion}
                        </AutocompleteItem>
                      ))
                    )}
                  </Autocomplete>
                  <Button
                    isIconOnly
                    variant="flat"
                    onPress={() => setIsUnidadModalOpen(true)}
                    className="h-14 min-w-12 bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/20 border border-[#67afc3]/20"
                  >
                    <PlusIcon size={18} />
                  </Button>
                </div>

                <Select
                  label="Tipo de Venta"
                  placeholder="Seleccione tipo"
                  selectedKeys={formData.TipoVenta ? [formData.TipoVenta] : []}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      TipoVenta: e.target.value as TiposVenta,
                    })
                  }
                  isDisabled={isSaving}
                >
                  <SelectItem key={TiposVenta.PESO} textValue={TiposVenta.PESO}>
                    {TiposVenta.PESO}
                  </SelectItem>
                  <SelectItem
                    key={TiposVenta.UNIDAD}
                    textValue={TiposVenta.UNIDAD}
                  >
                    {TiposVenta.UNIDAD}
                  </SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>

          {/* PRECIOS E IMPUESTOS */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <DollarSign size={18} className="text-[#67afc3]" /> Precios e
                Impuestos
              </h3>

              <div className="mb-5">
                <Select
                  label="IVA"
                  placeholder="Seleccione IVA"
                  selectedKeys={
                    formData.IvaId ? [formData.IvaId.toString()] : []
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      IvaId: parseInt(e.target.value),
                    })
                  }
                  isRequired
                  isDisabled={isSaving}
                  classNames={{
                    trigger: "bg-slate-50 shadow-none border border-slate-200",
                  }}
                >
                  {isLoadingIvas ? (
                    <SelectItem key="0" textValue="Cargando...">
                      Cargando...
                    </SelectItem>
                  ) : (
                    ivas?.map((iva: any) => (
                      <SelectItem
                        key={iva.Id.toString()}
                        textValue={iva.Descripcion}
                      >
                        {iva.Descripcion}
                      </SelectItem>
                    ))
                  )}
                </Select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 mb-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Costo Base
                </p>
                <NumberInput
                  label="Precio Costo"
                  classNames={inputClassNames}
                  placeholder="0,00"
                  value={Number(formData.PrecioCosto) || 0}
                  onValueChange={(value) =>
                    updatePrecio(null, "PrecioCosto", value)
                  }
                  isRequired
                  isDisabled={isSaving}
                  min={0}
                />
              </div>

              {isLoadingListas ? (
                <div className="text-center text-sm text-slate-400 py-4">
                  Cargando listas de precios...
                </div>
              ) : listasPrecios.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-4">
                  No hay listas de precios activas.
                </div>
              ) : (
                <div className="space-y-4">
                  {listasPrecios.map((lista: any) => {
                    const isDefault = lista.PorDefecto;
                    const listaData = formData.PreciosLista?.find(
                      (p) => Number(p.ListaPrecioId) === Number(lista.Id),
                    ) || { PorcentajeGanancia: 0, PrecioFinal: 0 };

                    return (
                      <div
                        key={lista.Id}
                        className={`space-y-3 p-4 rounded-xl border ${
                          isDefault
                            ? "bg-gradient-to-br from-[#67afc3]/5 to-[#4899b0]/5 border-[#67afc3]/30 shadow-sm"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-1 h-4 rounded-full shrink-0 ${
                              isDefault ? "bg-[#67afc3]" : "bg-slate-300"
                            }`}
                          />
                          <h4 className="font-semibold text-slate-800 text-sm flex-1 truncate">
                            {lista.Nombre}
                          </h4>
                          {isDefault && (
                            <Chip
                              size="sm"
                              variant="flat"
                              className="h-5 text-[10px] bg-[#67afc3]/10 text-[#67afc3] font-semibold tracking-wide"
                            >
                              DEFECTO
                            </Chip>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <NumberInput
                            label="% Ganancia"
                            placeholder="0"
                            value={Number(listaData.PorcentajeGanancia) || 0}
                            onValueChange={(value) =>
                              updatePrecio(
                                lista.Id,
                                "PorcentajeGanancia",
                                value,
                              )
                            }
                            isRequired
                            isDisabled={isSaving}
                            classNames={inputClassNames}
                          />
                          <NumberInput
                            label="Precio Venta"
                            placeholder="0.00"
                            value={Number(listaData.PrecioFinal) || 0}
                            onValueChange={(value) =>
                              updatePrecio(lista.Id, "PrecioFinal", value)
                            }
                            isDisabled={isSaving}
                            classNames={{
                              ...inputClassNames,
                              input: `font-bold ${isDefault ? "text-[#67afc3]" : "text-slate-800"}`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* PROMOCIONES */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Percent size={18} className="text-[#67afc3]" /> Promociones
                  por Cantidad
                </h3>
                <Button
                  size="sm"
                  variant="flat"
                  className="bg-[#67afc3]/10 text-[#67afc3] font-semibold h-9 rounded-lg"
                  startContent={<PlusIcon size={16} />}
                  onPress={() => {
                    const isPeso = formData.TipoVenta === TiposVenta.PESO;
                    setFormData((prev) => ({
                      ...prev,
                      PromocionesCantidad: [
                        ...(prev.PromocionesCantidad || []),
                        {
                          Cantidad: isPeso ? 0.001 : 2,
                          DescuentoPorcentaje: 0,
                          EstaActiva: true,
                        },
                      ],
                    }));
                  }}
                >
                  Añadir Escala
                </Button>
              </div>

              {(formData.PromocionesCantidad || []).length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Percent size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500 font-medium">
                    No hay promociones configuradas
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Añadí escalas para aplicar descuentos por volumen
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(formData.PromocionesCantidad || []).map((promo, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group"
                    >
                      <div className="flex-1 w-full">
                        <NumberInput
                          label={
                            formData.TipoVenta === TiposVenta.PESO
                              ? "A partir de (kg)"
                              : "A partir de (cantidad)"
                          }
                          value={promo.Cantidad}
                          onValueChange={(val) => {
                            const newPromos = [
                              ...(formData.PromocionesCantidad || []),
                            ];
                            newPromos[index].Cantidad = val;
                            setFormData({
                              ...formData,
                              PromocionesCantidad: newPromos,
                            });
                          }}
                          minValue={
                            formData.TipoVenta === TiposVenta.PESO ? 0.001 : 1
                          }
                          step={
                            formData.TipoVenta === TiposVenta.PESO ? 0.001 : 1
                          }
                          formatOptions={
                            formData.TipoVenta === TiposVenta.PESO
                              ? {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                }
                              : {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }
                          }
                          classNames={inputClassNames}
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <NumberInput
                          label="% de Descuento"
                          value={promo.DescuentoPorcentaje}
                          onValueChange={(val) => {
                            const newPromos = [
                              ...(formData.PromocionesCantidad || []),
                            ];
                            newPromos[index].DescuentoPorcentaje = val;
                            setFormData({
                              ...formData,
                              PromocionesCantidad: newPromos,
                            });
                          }}
                          minValue={0}
                          classNames={inputClassNames}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          size="sm"
                          isSelected={promo.EstaActiva}
                          onValueChange={(val) => {
                            const newPromos = [
                              ...(formData.PromocionesCantidad || []),
                            ];
                            newPromos[index].EstaActiva = val;
                            setFormData({
                              ...formData,
                              PromocionesCantidad: newPromos,
                            });
                          }}
                        />
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          className="text-red-400 hover:bg-red-50"
                          onPress={() => {
                            const newPromos = [
                              ...(formData.PromocionesCantidad || []),
                            ];
                            newPromos.splice(index, 1);
                            setFormData({
                              ...formData,
                              PromocionesCantidad: newPromos,
                            });
                          }}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column (Sidebar Content) */}
        <div className="space-y-6">
          {/* ESTADO Y FOTO */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Settings size={18} className="text-[#67afc3]" /> Estado y Foto
              </h3>

              <div className="mb-6 p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-700 text-sm">
                    Visibilidad
                  </p>
                  <p className="text-xs text-slate-500">
                    ¿El producto está disponible?
                  </p>
                </div>
                <Switch
                  isSelected={!formData.EstaEliminado}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      EstaEliminado: !value,
                      EsCombo: false,
                    })
                  }
                  color={formData.EstaEliminado ? "danger" : "success"}
                  isDisabled={isSaving}
                >
                  <span
                    className={`text-sm font-bold ml-1 ${
                      formData.EstaEliminado
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formData.EstaEliminado ? "Inactivo" : "Activo"}
                  </span>
                </Switch>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <ImageUploadField
                  existingImageUrl={formData.Foto || null}
                  previewUrl={fotoPreview}
                  onChange={(file, base64) => {
                    setFotoFile(file);
                    setFotoPreview(base64);
                  }}
                  disabled={isSaving}
                />
              </div>
            </CardBody>
          </Card>



          {/* INVENTARIO */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Package size={18} className="text-[#67afc3]" /> Inventario
              </h3>

              <div className="space-y-4 mb-6">
                <Input
                  label="Stock Actual"
                  classNames={inputClassNames}
                  placeholder="0"
                  type="number"
                  step="0.01"
                  value={formData.Stock?.toString() || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Stock: parseFloat(e.target.value) || 0,
                    })
                  }
                  isDisabled={isSaving || formData.EsCombo}
                  description={
                    formData.EsCombo ? "Calculado por componentes." : undefined
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Stock Mínimo"
                    classNames={inputClassNames}
                    placeholder="0"
                    type="number"
                    step="0.01"
                    value={formData.StockMinimo?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        StockMinimo: parseFloat(e.target.value) || 0,
                      })
                    }
                    isDisabled={isSaving || formData.EsCombo}
                  />
                  <Input
                    label="Venc. (Días)"
                    classNames={inputClassNames}
                    placeholder="0"
                    type="number"
                    value={formData.VencimientoDias?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        VencimientoDias: parseInt(e.target.value) || 0,
                      })
                    }
                    isDisabled={isSaving}
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 space-y-4">
                <Switch
                  isSelected={formData.DescuentaStock}
                  onValueChange={(value) =>
                    setFormData({ ...formData, DescuentaStock: value })
                  }
                  isDisabled={isSaving}
                  size="sm"
                  classNames={{
                    label: "text-sm text-slate-700 font-medium ml-2",
                  }}
                >
                  Descuenta Stock al vender
                </Switch>
                <Switch
                  isSelected={formData.PermiteStockNegativo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, PermiteStockNegativo: value })
                  }
                  isDisabled={isSaving}
                  size="sm"
                  classNames={{
                    label: "text-sm text-slate-700 font-medium ml-2",
                  }}
                >
                  Permite Stock Negativo
                </Switch>
              </div>
            </CardBody>
          </Card>

          {/* CONFIGURACIÓN AVANZADA */}
          <Card className="shadow-sm border border-slate-200/60 bg-white">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Settings size={18} className="text-[#67afc3]" /> Opciones
                Avanzadas
              </h3>

              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <Switch
                    isSelected={formData.ActivarLimiteVenta}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ActivarLimiteVenta: value })
                    }
                    isDisabled={isSaving}
                    size="sm"
                    classNames={{
                      label: "text-sm text-slate-700 font-medium ml-2",
                    }}
                  >
                    Límite Máximo por Venta
                  </Switch>
                  {formData.ActivarLimiteVenta && (
                    <NumberInput
                      label="Cantidad Máxima"
                      size="sm"
                      classNames={inputClassNames}
                      value={Number(formData.LimiteVenta) || 0}
                      onValueChange={(value) =>
                        setFormData({ ...formData, LimiteVenta: Number(value) })
                      }
                      isDisabled={isSaving}
                    />
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <Switch
                    isSelected={formData.ActivarHoraVenta}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ActivarHoraVenta: value })
                    }
                    isDisabled={isSaving}
                    size="sm"
                    classNames={{
                      label: "text-sm text-slate-700 font-medium ml-2",
                    }}
                  >
                    Restricción Horaria
                  </Switch>
                  {formData.ActivarHoraVenta && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <Input
                        label="Desde"
                        size="sm"
                        classNames={inputClassNames}
                        type="time"
                        value={formData.HoraLimiteVentaDesde || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            HoraLimiteVentaDesde: e.target.value,
                          })
                        }
                        isDisabled={isSaving}
                      />
                      <Input
                        label="Hasta"
                        size="sm"
                        classNames={inputClassNames}
                        type="time"
                        value={formData.HoraLimiteVentaHasta || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            HoraLimiteVentaHasta: e.target.value,
                          })
                        }
                        isDisabled={isSaving}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Sub-modales ────────────────────────────────────────────── */}
      <Modal
        isOpen={isMarcaModalOpen}
        onClose={() => setIsMarcaModalOpen(false)}
        size="2xl"
        backdrop="opaque"
        isDismissable={!isSaving}
        scrollBehavior="inside"
        motionProps={modalMotionProps}
        classNames={{ backdrop: "bg-slate-900/50", base: "bg-white" }}
      >
        <MarcaGenericForm
          isOpen={isMarcaModalOpen}
          onClose={() => setIsMarcaModalOpen(false)}
          initialData={null}
          onSubmit={(data) => {
            createMarcaMutation.mutate(data);
          }}
          isSaving={createMarcaMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isRubroModalOpen}
        onClose={() => setIsRubroModalOpen(false)}
        size="2xl"
        backdrop="opaque"
        isDismissable={!isSaving}
        scrollBehavior="inside"
        motionProps={modalMotionProps}
        classNames={{ backdrop: "bg-slate-900/50", base: "bg-white" }}
      >
        <RubroGenericForm
          isOpen={isRubroModalOpen}
          onClose={() => setIsRubroModalOpen(false)}
          initialData={null}
          onSubmit={(data) => {
            createRubroMutation.mutate(data);
          }}
          isSaving={createRubroMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isUnidadModalOpen}
        onClose={() => setIsUnidadModalOpen(false)}
        size="2xl"
        backdrop="opaque"
        isDismissable={!isSaving}
        scrollBehavior="inside"
        motionProps={modalMotionProps}
        classNames={{ backdrop: "bg-slate-900/50", base: "bg-white" }}
      >
        <UnidadMedidaGenericForm
          isOpen={isUnidadModalOpen}
          onClose={() => setIsUnidadModalOpen(false)}
          initialData={null}
          onSubmit={(data) => {
            createUnidadMutation.mutate(data);
          }}
          isSaving={createUnidadMutation.isPending}
        />
      </Modal>
    </div>
  );
}
