import { modalMotionProps } from "@/lib/motionConfig";
import { useState, useEffect } from "react";
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
  Select,
  SelectItem,
  NumberInput,
  Chip,
  addToast,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { Producto } from "@/lib/validations/producto.schema";
import { GenericFormProps } from "@/components/shared/GenericCrud";
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
  | "configuracion";

export default function ProductoForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Producto>) {
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
    enabled: !initialData && isOpen,
    refetchOnMount: "always",
  });

  const { data: fullProduct, isLoading: isLoadingFullProduct } = useQuery({
    queryKey: ["producto-detail", initialData?.Id],
    queryFn: async () => {
      const res = await fetch(`/api/productos/${initialData?.Id}`);
      if (!res.ok) throw new Error("Error loading product");
      return res.json();
    },
    enabled: !!initialData?.Id && isOpen,
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
  }, [initialData, fullProduct, isOpen]);

  useEffect(() => {
    if (!initialData && nextCodeData?.ultimoCodigo && isOpen) {
      setFormData((prev) => ({ ...prev, Codigo: nextCodeData.ultimoCodigo }));
    }
  }, [nextCodeData, initialData, isOpen]);

  const handleSubmit = () => {
    const dataToSubmit = { ...formData };
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
  const sectionStatus = getSectionStatus(formData);

  const navSections: {
    key: SectionKey;
    label: string;
    icon: React.ComponentType<any>;
    isComplete: boolean;
  }[] = [
    {
      key: "general",
      label: "General",
      icon: FileText,
      isComplete: sectionStatus.general,
    },
    {
      key: "categorizacion",
      label: "Categorización",
      icon: Tags,
      isComplete: sectionStatus.categorizacion,
    },
    {
      key: "precios",
      label: "Precios",
      icon: DollarSign,
      isComplete: sectionStatus.precios,
    },
    {
      key: "promociones",
      label: "Promos Cantidad",
      icon: Percent,
      isComplete: sectionStatus.promociones,
    },
    {
      key: "stock",
      label: "Stock",
      icon: Package,
      isComplete: sectionStatus.stock,
    },
    {
      key: "configuracion",
      label: "Configuración",
      icon: Settings,
      isComplete: sectionStatus.configuracion,
    },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        hideCloseButton
        isDismissable={!isSaving}
        motionProps={modalMotionProps}
        classNames={{
          backdrop: "bg-slate-900/60 backdrop-blur-sm",
          wrapper: "items-end sm:items-center",
          base: "font-sans bg-white shadow-2xl border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl w-full sm:max-w-[920px] h-[100dvh] sm:h-[84vh] m-0 sm:m-auto",
        }}
      >
        <ModalContent className="flex flex-col h-full overflow-hidden">
          {/* ── Header ─────────────────────────────────────────────── */}
          <ModalHeader className="flex items-center gap-3 py-4 px-5 border-b border-slate-100 flex-none">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#67afc3" }}
            >
              <Package size={18} className="text-white" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-base font-bold text-slate-800 leading-tight">
                {isEdit ? "Editar Producto" : "Nuevo Producto"}
              </span>
              <span className="text-xs text-slate-400 font-normal truncate">
                {isEdit
                  ? formData.Descripcion || "Sin nombre"
                  : "Completá la información del producto"}
              </span>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              isDisabled={isSaving}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl shrink-0"
            >
              <X size={16} />
            </Button>
          </ModalHeader>

          {/* ── Body ───────────────────────────────────────────────── */}
          <ModalBody className="p-0 flex flex-col sm:flex-row flex-1 overflow-hidden relative">
            {isLoadingFullProduct && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <LoadingComponent message="Cargando detalles..." />
              </div>
            )}

            {/* Nav — horizontal scrollable en mobile, sidebar en desktop */}
            <nav
              className="flex-none
              flex flex-row sm:flex-col
              border-b sm:border-b-0 sm:border-r border-slate-100
              bg-slate-50/60
              overflow-x-auto sm:overflow-x-hidden overflow-y-hidden sm:overflow-y-auto
              py-2 sm:py-3 px-2 gap-0.5
              sm:w-44 scrollbar-none"
            >
              {navSections.map(({ key, label, icon: Icon, isComplete }) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl text-left transition-all shrink-0 sm:w-full ${
                      isActive
                        ? "bg-[#67afc3]/10 text-[#67afc3]"
                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={`shrink-0 ${isActive ? "text-[#67afc3]" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-xs sm:text-sm whitespace-nowrap leading-none ${isActive ? "font-semibold" : "font-medium"}`}
                    >
                      {label}
                    </span>
                    <div
                      className={`hidden sm:block w-1.5 h-1.5 rounded-full shrink-0 ml-auto transition-colors ${
                        isComplete ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4">
              {/* ── GENERAL ──────────────────────────────────────── */}
              {activeSection === "general" && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                    Información General
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      type="number"
                      isRequired
                      isDisabled={isSaving}
                      classNames={inputClassNames}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <ImageUploadField
                    existingImageUrl={formData.Foto || null}
                    previewUrl={fotoPreview}
                    onChange={(file, base64) => {
                      setFotoFile(file);
                      setFotoPreview(base64);
                    }}
                    disabled={isSaving}
                  />
                </>
              )}

              {/* ── CATEGORIZACIÓN ───────────────────────────────── */}
              {activeSection === "categorizacion" && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                    Categorización
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="h-full min-w-9 bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/20 border border-[#67afc3]/20"
                      >
                        <PlusIcon size={16} />
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
                        className="h-full min-w-9 bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/20 border border-[#67afc3]/20"
                      >
                        <PlusIcon size={16} />
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
                        className="h-full min-w-9 bg-[#67afc3]/10 text-[#67afc3] hover:bg-[#67afc3]/20 border border-[#67afc3]/20"
                      >
                        <PlusIcon size={16} />
                      </Button>
                    </div>

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

                    <Select
                      label="Tipo de Venta"
                      placeholder="Seleccione tipo"
                      selectedKeys={
                        formData.TipoVenta ? [formData.TipoVenta] : []
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          TipoVenta: e.target.value as TiposVenta,
                        })
                      }
                      isDisabled={isSaving}
                    >
                      <SelectItem
                        key={TiposVenta.PESO}
                        textValue={TiposVenta.PESO}
                      >
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
                </>
              )}

              {/* ── PRECIOS ──────────────────────────────────────── */}
              {activeSection === "precios" && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                    Precios
                  </p>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Precio de Costo
                    </p>
                    <NumberInput
                      label="Costo"
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
                    <div className="text-center text-sm text-slate-400 py-6">
                      Cargando listas de precios...
                    </div>
                  ) : listasPrecios.length === 0 ? (
                    <div className="text-center text-sm text-slate-400 py-6">
                      No hay listas de precios activas.
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Listas de Precio
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {listasPrecios.map((lista: any) => {
                          const isDefault = lista.PorDefecto;
                          const listaData = formData.PreciosLista?.find(
                            (p) => Number(p.ListaPrecioId) === Number(lista.Id),
                          ) || { PorcentajeGanancia: 0, PrecioFinal: 0 };

                          return (
                            <div
                              key={lista.Id}
                              className={`space-y-3 p-4 rounded-xl border bg-white shadow-sm ${
                                isDefault
                                  ? "border-[#67afc3]/40 shadow-[#67afc3]/10"
                                  : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-1 h-4 rounded-full shrink-0 ${
                                    isDefault ? "bg-[#67afc3]" : "bg-slate-200"
                                  }`}
                                />
                                <h4 className="font-semibold text-slate-700 text-sm flex-1 truncate">
                                  {lista.Nombre}
                                </h4>
                                {isDefault && (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    className="h-4 text-[10px] bg-[#67afc3]/10 text-[#67afc3]"
                                  >
                                    Defecto
                                  </Chip>
                                )}
                              </div>
                              <NumberInput
                                label="% Ganancia"
                                placeholder="0"
                                value={
                                  Number(listaData.PorcentajeGanancia) || 0
                                }
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
                                label="Precio de Venta"
                                placeholder="0.00"
                                value={Number(listaData.PrecioFinal) || 0}
                                onValueChange={(value) =>
                                  updatePrecio(lista.Id, "PrecioFinal", value)
                                }
                                isDisabled={isSaving}
                                classNames={{
                                  ...inputClassNames,
                                  input: `font-bold ${isDefault ? "text-[#67afc3]" : "text-slate-700"}`,
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── STOCK ────────────────────────────────────────── */}
              {activeSection === "stock" && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                    Stock
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
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
                      isDisabled={isSaving}
                    />
                    <Input
                      label="Días de Vencimiento"
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
                      isDisabled={isSaving}
                    />
                  </div>
                  <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                    <Switch
                      isSelected={formData.DescuentaStock}
                      onValueChange={(value) =>
                        setFormData({ ...formData, DescuentaStock: value })
                      }
                      isDisabled={isSaving}
                    >
                      <span className="text-sm text-slate-700">
                        Descuenta Stock
                      </span>
                    </Switch>
                    <Switch
                      isSelected={formData.PermiteStockNegativo}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          PermiteStockNegativo: value,
                        })
                      }
                      isDisabled={isSaving}
                    >
                      <span className="text-sm text-slate-700">
                        Permite Stock Negativo
                      </span>
                    </Switch>
                  </div>
                </>
              )}

              {/* ── PROMOCIONES ──────────────────────────────────────── */}
              {activeSection === "promociones" && (
                <>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Promociones por Cantidad
                    </p>
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-[#67afc3]/10 text-[#67afc3] font-semibold h-8 rounded-lg"
                      startContent={<PlusIcon size={14} />}
                      onPress={() => {
                        setFormData((prev) => ({
                          ...prev,
                          PromocionesCantidad: [
                            ...(prev.PromocionesCantidad || []),
                            { Cantidad: 2, DescuentoPorcentaje: 0, EstaActiva: true },
                          ],
                        }));
                      }}
                    >
                      Añadir Escala
                    </Button>
                  </div>

                  {(formData.PromocionesCantidad || []).length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Percent
                        size={32}
                        className="mx-auto text-slate-300 mb-3"
                      />
                      <p className="text-sm text-slate-500 font-medium">
                        No hay promociones configuradas
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Añadí escalas para aplicar descuentos por volumen
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(formData.PromocionesCantidad || []).map(
                        (promo, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-3 items-end bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group"
                          >
                            <div className="flex-1 w-full">
                              <NumberInput
                                label="A partir de (cantidad)"
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
                                minValue={2}
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
                            <div className="flex items-center gap-2 pb-1">
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
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── CONFIGURACIÓN ────────────────────────────────── */}
              {activeSection === "configuracion" && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                    Configuración
                  </p>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Límites de Venta
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Switch
                        isSelected={formData.ActivarLimiteVenta}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            ActivarLimiteVenta: value,
                          })
                        }
                        isDisabled={isSaving}
                      >
                        <span className="text-sm text-slate-700">
                          Activar Límite de Venta
                        </span>
                      </Switch>
                      {formData.ActivarLimiteVenta && (
                        <NumberInput
                          label="Límite"
                          classNames={inputClassNames}
                          placeholder="0.00"
                          value={Number(formData.LimiteVenta) || 0}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              LimiteVenta: Number(value),
                            })
                          }
                          className="max-w-xs"
                          isDisabled={isSaving}
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      <Switch
                        isSelected={formData.ActivarHoraVenta}
                        onValueChange={(value) =>
                          setFormData({ ...formData, ActivarHoraVenta: value })
                        }
                        isDisabled={isSaving}
                      >
                        <span className="text-sm text-slate-700">
                          Activar Horario de Venta
                        </span>
                      </Switch>
                      {formData.ActivarHoraVenta && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <Input
                            label="Hora Desde"
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
                            label="Hora Hasta"
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

                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Estado del Producto
                    </p>
                    <Switch
                      isSelected={!formData.EstaEliminado}
                      onValueChange={(value) =>
                        setFormData({ ...formData, EstaEliminado: !value })
                      }
                      color={formData.EstaEliminado ? "danger" : "success"}
                      isDisabled={isSaving}
                    >
                      <span
                        className={`text-sm font-medium ${
                          formData.EstaEliminado
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formData.EstaEliminado
                          ? "Producto Inactivo"
                          : "Producto Activo"}
                      </span>
                    </Switch>
                  </div>
                </>
              )}
            </div>
          </ModalBody>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <ModalFooter className="flex items-center justify-between py-3.5 px-5 border-t border-slate-100 flex-none bg-white gap-3">
            <Button
              variant="light"
              onPress={onClose}
              isDisabled={isSaving}
              className="font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl h-10 px-5"
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSubmit}
              isLoading={isSaving}
              className="bg-[#67afc3] hover:bg-[#4899b0] text-white font-bold rounded-xl shadow-md shadow-[#67afc3]/30 h-10 px-6"
            >
              {isEdit ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
    </>
  );
}
