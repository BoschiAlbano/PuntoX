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
  Accordion,
  AccordionItem,
  Chip,
  addToast,
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
} from "lucide-react";
import MarcaGenericForm from "../marcas/MarcaForm";
import RubroGenericForm from "../rubros/RubroForm";
import UnidadMedidaGenericForm from "../unidad-medida/UnidadMedidaForm";
import { TiposVenta } from "../../../prisma/generated/prisma";
import { LoadingComponent } from "../loading/loading";
import { useCurrency } from "@/hooks/useCurrency";
import { getCurrencyFormatOptions } from "@/lib/utils/formatCurrency";

const inputClassNames = {
  inputWrapper:
    "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
};

// Detecta si los campos obligatorios (*) de cada sección están completos.
// Los chips pasan a "Completo" en tiempo real cuando el usuario carga la info.
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
  const precios =
    (formData.Precio?.PrecioPublico ?? 0) > 0 ||
    (formData.Precio?.PrecioPublico2 ?? 0) > 0;
  const stock = (formData.Stock ?? 0) > 0;
  return {
    general,
    categorizacion,
    precios,
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
  PrecioId: 0,
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
  Precio: {
    PorcentajeGanancia: 0,
    PorcentajeGanancia2: 0,
    PrecioPublico: 0,
    PrecioPublico2: 0,
    PrecioCosto: 0,
  },
  Stock: 0,
};

// Funciones de fetch para los selects
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

export default function ProductoForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Producto>) {
  const [formData, setFormData] = useState<Partial<Producto>>(defaultProducto);

  const queryClient = useQueryClient();
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
  const [isRubroModalOpen, setIsRubroModalOpen] = useState(false);
  const [isUnidadModalOpen, setIsUnidadModalOpen] = useState(false);

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

  // Queries para llenar los selects
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

  const { data: nextCodeData } = useQuery({
    queryKey: ["ultimo-codigo"],
    queryFn: fetchUltimoCodigo,
    enabled: !initialData && isOpen,
    refetchOnMount: "always",
  });

  // Query para obtener datos completos del producto en edición
  const { data: fullProduct, isLoading: isLoadingFullProduct } = useQuery({
    queryKey: ["producto-detail", initialData?.Id],
    queryFn: async () => {
      const res = await fetch(`/api/productos/${initialData?.Id}`);
      if (!res.ok) throw new Error("Error loading product");
      return res.json();
    },
    enabled: !!initialData?.Id && isOpen,
    staleTime: 0,
  });

  useEffect(() => {
    if (fullProduct) {
      // Si tenemos datos completos, los usamos
      setFormData(fullProduct);
    } else if (initialData) {
      // Si solo tenemos datos parciales (de la tabla), los usamos mientras carga
      setFormData(initialData);
    } else {
      setFormData(defaultProducto);
    }
  }, [initialData, fullProduct, isOpen]);

  useEffect(() => {
    if (!initialData && nextCodeData?.ultimoCodigo && isOpen) {
      setFormData((prev) => ({
        ...prev,
        Codigo: nextCodeData.ultimoCodigo,
      }));
    }
  }, [nextCodeData, initialData, isOpen]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isEdit = !!initialData;
  const sectionStatus = getSectionStatus(formData);

  const SectionTitle = ({
    icon: Icon,
    label,
    isComplete,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isComplete: boolean;
  }) => (
    <div className="flex items-center justify-between w-full gap-2 pr-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-[#67afc3] shrink-0" />
        <span>{label}</span>
      </div>
      <Chip
        size="sm"
        variant="flat"
        className={
          isComplete
            ? "bg-[#90c472]/15 text-[#90c472] border-0 shrink-0"
            : "bg-[#f59e0b]/15 text-[#f59e0b] border-0 shrink-0"
        }
      >
        {isComplete ? "Completo" : "Pendiente"}
      </Chip>
    </div>
  );

  const updatePrecio = (field: string, value: number) => {
    setFormData((prev) => {
      const currentPrecio = prev.Precio || { ...defaultProducto.Precio };
      const newPrecio = { ...currentPrecio, [field]: value };
      const costo =
        field === "PrecioCosto" ? value : currentPrecio.PrecioCosto || 0;

      // Cálculo para Precio 1 (Principal)
      if (field === "PrecioCosto" || field === "PorcentajeGanancia") {
        const ganancia =
          field === "PorcentajeGanancia"
            ? value
            : currentPrecio.PorcentajeGanancia || 0;
        newPrecio.PrecioPublico = parseFloat(
          (costo * (1 + ganancia / 100)).toFixed(2),
        );
      }

      // Cálculo Inverso para Precio 1: Si cambio Precio Publico, actualizo Porcentaje Ganancia
      if (field === "PrecioPublico") {
        if (costo > 0) {
          newPrecio.PorcentajeGanancia = parseFloat(
            ((value / costo - 1) * 100).toFixed(2),
          );
        }
      }

      // Cálculo para Precio 2 (Alternativo)
      if (field === "PrecioCosto" || field === "PorcentajeGanancia2") {
        const ganancia2 =
          field === "PorcentajeGanancia2"
            ? value
            : currentPrecio.PorcentajeGanancia2 || 0;
        newPrecio.PrecioPublico2 = parseFloat(
          (costo * (1 + ganancia2 / 100)).toFixed(2),
        );
      }

      // Cálculo Inverso para Precio 2: Si cambio Precio Publico 2, actualizo Porcentaje Ganancia 2
      if (field === "PrecioPublico2") {
        if (costo > 0) {
          newPrecio.PorcentajeGanancia2 = parseFloat(
            ((value / costo - 1) * 100).toFixed(2),
          );
        }
      }

      // Si cambió el costo, recalculamos ambos precios públicos usando los porcentajes actuales
      if (field === "PrecioCosto") {
        const ganancia1 = currentPrecio.PorcentajeGanancia || 0;
        const ganancia2 = currentPrecio.PorcentajeGanancia2 || 0;
        newPrecio.PrecioPublico = parseFloat(
          (value * (1 + ganancia1 / 100)).toFixed(2),
        );
        newPrecio.PrecioPublico2 = parseFloat(
          (value * (1 + ganancia2 / 100)).toFixed(2),
        );
      }

      return { ...prev, Precio: newPrecio };
    });
  };

  const handleExportExcel = () => {};

  const handleImportExcel = () => {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="center"
      backdrop="opaque"
      isDismissable={!isSaving}
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "font-sans bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-[#e5e7eb] max-w-[820px] max-h-[90vh] overflow-hidden",
        header:
          "border-t-[3px] border-t-[#67afc3] border-b border-[#e5e7eb] bg-[#67afc3]/5 rounded-t-2xl",
        body: "py-0 overflow-y-auto overflow-x-hidden",
        footer: "border-t border-[#e5e7eb] bg-[#f8fafc] rounded-b-2xl",
        closeButton:
          "hover:bg-[#67afc3]/10 hover:text-[#67afc3] rounded-full p-1.5 transition-colors text-[#6b7280]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 py-6 px-6">
          <h3 className="text-[28px] font-bold text-[#0f172a] leading-tight">
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </h3>
          {!isEdit && (
            <p className="text-sm text-[#6b7280] mt-1">
              Completa la información del producto
            </p>
          )}
        </ModalHeader>
        <ModalBody className="p-0 relative">
          {isLoadingFullProduct && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50">
              <LoadingComponent message="Cargando detalles..." />
            </div>
          )}
          <div className="px-6 py-6">
            <Accordion
              aria-label="Opciones del producto"
              defaultSelectedKeys={["general"]}
              selectionMode="single"
              variant="bordered"
              motionProps={{
                transition: { duration: 0.18, ease: "easeInOut" },
              }}
              className="gap-3 overflow-visible"
            >
              <AccordionItem
                key="general"
                aria-label="Información general"
                title={
                  <SectionTitle
                    icon={FileText}
                    label="Información general"
                    isComplete={sectionStatus.general}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Código"
                      placeholder="Ingrese el código"
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
                      isDisabled={isLoadingFullProduct}
                      classNames={inputClassNames}
                    />
                    <Input
                      label="Código de Barras"
                      placeholder="Ingrese el código de barras"
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
                    classNames={{
                      ...inputClassNames,
                      input: "resize-none",
                    }}
                  />
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
              </AccordionItem>

              <AccordionItem
                key="categorizacion"
                aria-label="Categorización"
                title={
                  <SectionTitle
                    icon={Tags}
                    label="Categorización"
                    isComplete={sectionStatus.categorizacion}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Select
                        label="Marca"
                        placeholder="Seleccione una marca"
                        selectedKeys={
                          formData.MarcaId ? [formData.MarcaId.toString()] : []
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            MarcaId: parseInt(e.target.value),
                          })
                        }
                        isRequired
                        isDisabled={isSaving}
                      >
                        {isLoadingMarcas ? (
                          <SelectItem key="0" textValue="Cargando...">
                            Cargando...
                          </SelectItem>
                        ) : (
                          marcas?.map((marca: any) => (
                            <SelectItem
                              key={marca.Id.toString()}
                              textValue={marca.Descripcion}
                            >
                              {marca.Descripcion}
                            </SelectItem>
                          ))
                        )}
                      </Select>
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={() => setIsMarcaModalOpen(true)}
                        className="h-full min-w-9 bg-[#67afc3]/15 text-[#67afc3] hover:bg-[#67afc3]/25"
                      >
                        <PlusIcon />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        label="Rubro"
                        placeholder="Seleccione un rubro"
                        selectedKeys={
                          formData.RubroId ? [formData.RubroId.toString()] : []
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            RubroId: parseInt(e.target.value),
                          })
                        }
                        isRequired
                        isDisabled={isSaving}
                      >
                        {isLoadingRubros ? (
                          <SelectItem key="0" textValue="Cargando...">
                            Cargando...
                          </SelectItem>
                        ) : (
                          rubros?.map((rubro: any) => (
                            <SelectItem
                              key={rubro.Id.toString()}
                              textValue={rubro.Descripcion}
                            >
                              {rubro.Descripcion}
                            </SelectItem>
                          ))
                        )}
                      </Select>
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={() => setIsRubroModalOpen(true)}
                        className="h-full min-w-9 bg-[#67afc3]/15 text-[#67afc3] hover:bg-[#67afc3]/25"
                      >
                        <PlusIcon />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        label="Unidad de Medida"
                        placeholder="Seleccione unidad"
                        selectedKeys={
                          formData.UnidadMedidaId
                            ? [formData.UnidadMedidaId.toString()]
                            : []
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            UnidadMedidaId: parseInt(e.target.value),
                          })
                        }
                        isRequired
                        isDisabled={isSaving}
                      >
                        {isLoadingUnidades ? (
                          <SelectItem key="0" textValue="Cargando...">
                            Cargando...
                          </SelectItem>
                        ) : (
                          unidades?.map((unidad: any) => (
                            <SelectItem
                              key={unidad.Id.toString()}
                              textValue={unidad.Descripcion}
                            >
                              {unidad.Descripcion}
                            </SelectItem>
                          ))
                        )}
                      </Select>

                      <Button
                        color="primary"
                        variant="flat"
                        onPress={() => setIsUnidadModalOpen(true)}
                        className="h-full min-w-9 bg-[#67afc3]/15 text-[#67afc3] hover:bg-[#67afc3]/25"
                      >
                        <PlusIcon />
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
                </div>
              </AccordionItem>

              <AccordionItem
                key="precios"
                aria-label="Precios"
                title={
                  <SectionTitle
                    icon={DollarSign}
                    label="Precios"
                    isComplete={sectionStatus.precios}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  {/* Costo Base */}
                  <div className="bg-[#f1f5f9] p-5 rounded-xl border border-[#e5e7eb] shadow-sm">
                    <NumberInput
                      label="Precio Costo"
                      classNames={inputClassNames}
                      placeholder="0,00"
                      value={Number(formData.Precio?.PrecioCosto) || 0}
                      onValueChange={(value) =>
                        updatePrecio("PrecioCosto", value)
                      }
                      isRequired
                      isDisabled={isSaving}
                      min={0}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Lista de Precios 1 */}
                    <div className="space-y-4 p-5 rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                      <h4 className="font-semibold text-[#0f172a] text-sm uppercase tracking-wide">
                        Lista Principal
                      </h4>
                      <NumberInput
                        label="% Ganancia"
                        placeholder="0"
                        value={
                          Number(formData?.Precio?.PorcentajeGanancia) || 0
                        }
                        onValueChange={(value) =>
                          updatePrecio("PorcentajeGanancia", value)
                        }
                        isRequired
                        isDisabled={isSaving}
                        classNames={inputClassNames}
                      />
                      <NumberInput
                        label="Precio de Venta ($)"
                        placeholder="0.00"
                        value={formData?.Precio?.PrecioPublico || 0}
                        onValueChange={(value) =>
                          updatePrecio("PrecioPublico", value)
                        }
                        isDisabled={isSaving}
                        classNames={{
                          input: "font-bold text-green-600",
                        }}
                      />
                    </div>

                    {/* Lista de Precios 2 */}
                    <div className="space-y-4 p-5 rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                      <h4 className="font-semibold text-[#0f172a] text-sm uppercase tracking-wide">
                        Lista Secundaria
                      </h4>
                      <NumberInput
                        label="% Ganancia"
                        placeholder="0"
                        value={
                          Number(formData?.Precio?.PorcentajeGanancia2) || 0
                        }
                        onValueChange={(value) =>
                          updatePrecio("PorcentajeGanancia2", value)
                        }
                        isRequired
                        isDisabled={isSaving}
                        classNames={inputClassNames}
                      />
                      <NumberInput
                        label="Precio de Venta ($)"
                        placeholder="0.00"
                        value={formData?.Precio?.PrecioPublico2 || 0}
                        onValueChange={(value) =>
                          updatePrecio("PrecioPublico2", value)
                        }
                        isDisabled={isSaving}
                        classNames={{
                          input: "font-bold text-blue-600",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="stock"
                aria-label="Stock"
                title={
                  <SectionTitle
                    icon={Package}
                    label="Stock"
                    isComplete={sectionStatus.stock}
                  />
                }
              >
                <div className="space-y-5 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border border-[#e5e7eb] bg-[#f8fafc]">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border border-[#e5e7eb] bg-white">
                    <Switch
                      isSelected={formData.DescuentaStock}
                      onValueChange={(value) =>
                        setFormData({ ...formData, DescuentaStock: value })
                      }
                      isDisabled={isSaving}
                    >
                      Descuenta Stock
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
                      Permite Stock Negativo
                    </Switch>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                key="configuracion"
                aria-label="Configuración"
                title={
                  <SectionTitle
                    icon={Settings}
                    label="Configuración"
                    isComplete={sectionStatus.configuracion}
                  />
                }
              >
                <div className="space-y-6 pt-5">
                  <div className="p-5 rounded-xl border border-[#e5e7eb] bg-[#f8fafc]">
                    <h4 className="text-sm font-semibold text-[#0f172a] uppercase tracking-wide mb-4">
                      Límites de Venta
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
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
                          Activar Límite de Venta
                        </Switch>
                        {formData.ActivarLimiteVenta && (
                          <NumberInput
                            label="Límite"
                            classNames={inputClassNames}
                            placeholder="0.00"
                            value={Number(formData.LimiteVenta) || Number(0)}
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

                      <div className="space-y-2">
                        <Switch
                          isSelected={formData.ActivarHoraVenta}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              ActivarHoraVenta: value,
                            })
                          }
                          isDisabled={isSaving}
                        >
                          Activar Horario de Venta
                        </Switch>
                        {formData.ActivarHoraVenta && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
                  </div>

                  <div className="p-5 rounded-xl border border-[#e5e7eb] bg-white">
                    <h4 className="text-sm font-semibold text-[#0f172a] uppercase tracking-wide mb-4">
                      Estado
                    </h4>
                    <Switch
                      isSelected={!formData.EstaEliminado}
                      onValueChange={(value) =>
                        setFormData({ ...formData, EstaEliminado: !value })
                      }
                      color={formData.EstaEliminado ? "danger" : "success"}
                      isDisabled={isSaving}
                    >
                      {formData.EstaEliminado
                        ? "Producto Inactivo"
                        : "Producto Activo"}
                    </Switch>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
        </ModalBody>
        <ModalFooter className="py-5 px-6 gap-3 border-t border-[#e5e7eb]">
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
            className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
          >
            {isEdit ? "Actualizar" : "Crear producto"}
          </Button>
        </ModalFooter>
      </ModalContent>

      <Modal
        isOpen={isMarcaModalOpen}
        onClose={() => setIsMarcaModalOpen(false)}
        size="2xl"
        backdrop="opaque"
        isDismissable={!isSaving}
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white",
        }}
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
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white",
        }}
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
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white",
        }}
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
    </Modal>
  );
}
