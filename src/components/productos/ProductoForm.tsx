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
  Tabs,
  Tab,
  Spinner,
} from "@heroui/react";
import { Producto } from "@/lib/validations/producto.schema";
import { tiposVenta } from "@/lib/validations/tiposVenta.schema";
import { GenericFormProps } from "@/components/shared/GenericCrud";
import { useQuery } from "@tanstack/react-query";

const defaultProducto: Producto = {
  Id: 0,
  MarcaId: 1,
  RubroId: 1,
  UnidadMedidaId: 1,
  IvaId: 1,
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
  TipoVenta: 0,
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

const fetchUnidadesv = async () => {
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

export default function ProductoForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Producto>) {
  const [formData, setFormData] = useState<Partial<Producto>>(defaultProducto);

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
    queryFn: fetchUnidadesv,
  });
  const { data: ivas = [], isLoading: isLoadingIvas } = useQuery({
    queryKey: ["ivas-generic"],
    queryFn: fetchIvas,
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

  const handleSubmit = () => {
    console.log(formData);
    onSubmit(formData);
  };

  const isEdit = !!initialData;

  const updatePrecio = (field: string, value: number) => {
    const currentPrecio = formData.Precio || { ...defaultProducto.Precio };
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

    setFormData({ ...formData, Precio: newPrecio });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      backdrop="opaque"
      isDismissable={!isSaving}
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "bg-white",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-gray-200">
          <h3 className="text-xl font-bold">
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </h3>
        </ModalHeader>
        <ModalBody className="p-0 relative">
          {isLoadingFullProduct && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50">
              <Spinner label="Cargando detalles..." />
            </div>
          )}
          <div className="px-6 py-4">
            <Tabs
              aria-label="Opciones del producto"
              color="primary"
              variant="underlined"
              classNames={{
                tabList:
                  "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-[#22d3ee]",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-[#06b6d4]",
              }}
            >
              <Tab key="general" title="General">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Código"
                      placeholder="Ingrese el código"
                      type="number"
                      value={formData.Codigo?.toString() || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          Codigo: parseInt(e.target.value) || 0,
                        })
                      }
                      isRequired
                      isDisabled={isSaving}
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
                      isRequired
                      isDisabled={isSaving}
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
                    />
                  </div>
                  <Textarea
                    label="Detalle"
                    placeholder="Descripción detallada del producto"
                    value={formData.Detalle || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, Detalle: e.target.value })
                    }
                    minRows={3}
                    isDisabled={isSaving}
                  />
                  <Input
                    label="Ubicación"
                    placeholder="Ubicación en almacén"
                    value={formData.Ubicacion || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, Ubicacion: e.target.value })
                    }
                    isDisabled={isSaving}
                  />
                </div>
              </Tab>

              <Tab key="categorizacion" title="Categorización">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      selectedKeys={[formData.TipoVenta?.toString() || "0"]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          TipoVenta: parseInt(e.target.value),
                        })
                      }
                      isDisabled={isSaving}
                    >
                      {tiposVenta.map((tipo) => (
                        <SelectItem
                          key={tipo.id.toString()}
                          textValue={tipo.nombre}
                        >
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </Tab>

              <Tab key="precios" title="Precios">
                <div className="space-y-4 pt-4">
                  {/* Costo Base */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <NumberInput
                      label="Precio Costo ($)"
                      placeholder="0.00"
                      value={Number(formData.Precio?.PrecioCosto) || 0}
                      onValueChange={(value) =>
                        updatePrecio("PrecioCosto", value)
                      }
                      isRequired
                      isDisabled={isSaving}
                      min={0}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lista de Precios 1 */}
                    <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-700">
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
                    <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-700">
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
              </Tab>

              <Tab key="stock" title="Stock">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Stock Mínimo"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </Tab>

              <Tab key="configuracion" title="Configuración">
                <div className="space-y-4 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
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

                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
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
              </Tab>
            </Tabs>
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-gray-200">
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSaving}>
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
