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
} from "@heroui/react";
import { Producto } from "@/lib/validations/producto.schema";
import { Marca } from "@/lib/validations/marca.schema";
import { Rubro } from "@/lib/validations/rubro.schema";
import { UnidadMedida } from "@/lib/validations/unidad-medida.schema";
import { Iva } from "@/lib/validations/iva.schema";
import { tiposVenta } from "@/lib/validations/tiposVenta.schema";

interface ProductoFormProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  onSubmit: (data: Producto) => void;
  isSaving: boolean;
  marcas: Marca[];
  rubros: Rubro[];
  unidades: UnidadMedida[];
  ivas: Iva[];
}

const defaultProducto: Producto = {
  Id: 0,
  MarcaId: 1,
  RubroId: 1,
  UnidadMedidaId: 1,
  IvaId: 1,
  PrecioId: 1,
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

export default function ProductoForm({
  isOpen,
  onClose,
  producto,
  onSubmit,
  isSaving,
  marcas,
  rubros,
  unidades,
  ivas,
}: ProductoFormProps) {
  const [formData, setFormData] = useState<Producto>(defaultProducto);
  const modoEdicion = !!producto;

  useEffect(() => {
    if (isOpen) {
      if (producto) {
        setFormData(producto);
      } else {
        setFormData(defaultProducto);
      }
    }
  }, [isOpen, producto]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  useEffect(() => {
    if (formData.Precio) {
      const p1 =
        formData.Precio.PrecioCosto *
        (1 + formData.Precio.PorcentajeGanancia / 100);
      const p2 =
        formData.Precio.PrecioCosto *
        (1 + formData.Precio.PorcentajeGanancia2 / 100);
    }
  }, [
    formData.Precio.PrecioCosto,
    formData.Precio.PorcentajeGanancia,
    formData.Precio.PorcentajeGanancia2,
  ]);

  const updatePrecio = (field: string, value: number) => {
    const newPrecio = { ...formData.Precio, [field]: value };

    // Auto-calc public prices
    if (field === "PrecioCosto" || field === "PorcentajeGanancia") {
      const costo = field === "PrecioCosto" ? value : newPrecio.PrecioCosto;
      const ganancia =
        field === "PorcentajeGanancia" ? value : newPrecio.PorcentajeGanancia;
      newPrecio.PrecioPublico = parseFloat(
        (costo * (1 + ganancia / 100)).toFixed(2)
      );
    }
    if (field === "PrecioCosto" || field === "PorcentajeGanancia2") {
      const costo = field === "PrecioCosto" ? value : newPrecio.PrecioCosto;
      const ganancia2 =
        field === "PorcentajeGanancia2" ? value : newPrecio.PorcentajeGanancia2;
      newPrecio.PrecioPublico2 = parseFloat(
        (costo * (1 + ganancia2 / 100)).toFixed(2)
      );
    }

    setFormData({ ...formData, Precio: newPrecio });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      backdrop="opaque"
      isDismissable={!isSaving}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "bg-white max-h-[90vh]",
        wrapper: "overflow-hidden",
      }}
    >
      <ModalContent className="bg-white">
        <ModalHeader className="flex flex-col gap-1 bg-white border-b border-gray-200">
          <h3 className="text-2xl font-bold">
            {modoEdicion ? "Editar Producto" : "Nuevo Producto"}
          </h3>
          <p className="text-sm text-gray-500 font-normal">
            {modoEdicion
              ? "Modifica los datos del producto"
              : "Completa los datos del nuevo producto"}
          </p>
        </ModalHeader>
        <ModalBody className="bg-white p-6">
          <Tabs
            aria-label="Opciones del producto"
            color="primary"
            variant="underlined"
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
                      setFormData({ ...formData, CodigoBarra: e.target.value })
                    }
                    isRequired
                    isDisabled={isSaving}
                  />
                  <Input
                    label="Abreviatura"
                    placeholder="Ej: PROD-001"
                    value={formData.Abreviatura || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, Abreviatura: e.target.value })
                    }
                    isDisabled={isSaving}
                  />
                  <Input
                    label="Descripción"
                    placeholder="Nombre del producto"
                    value={formData.Descripcion || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, Descripcion: e.target.value })
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
                    {marcas.map((marca) => (
                      <SelectItem key={marca.Id.toString()}>
                        {marca.Descripcion}
                      </SelectItem>
                    ))}
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
                    {rubros.map((rubro) => (
                      <SelectItem key={rubro.Id.toString()}>
                        {rubro.Descripcion}
                      </SelectItem>
                    ))}
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
                    {unidades.map((unidad) => (
                      <SelectItem key={unidad.Id.toString()}>
                        {unidad.Descripcion}
                      </SelectItem>
                    ))}
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
                    {ivas.map((iva) => (
                      <SelectItem key={iva.Id.toString()}>
                        {iva.Descripcion}
                      </SelectItem>
                    ))}
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
                      <SelectItem key={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </Tab>

            <Tab key="precios" title="Precios">
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NumberInput
                    label="Precio Costo"
                    placeholder="0.00"
                    type="number"
                    startContent={<span className="text-gray-500">$</span>}
                    value={Number(formData.Precio?.PrecioCosto) || 0}
                    onChange={(e: any) => {
                      const value =
                        typeof e === "number"
                          ? e
                          : parseFloat(e.target.value) || 0;
                      updatePrecio("PrecioCosto", value);
                    }}
                    isRequired
                    isDisabled={isSaving}
                  />
                  <NumberInput
                    label="% Ganancia"
                    placeholder="0"
                    type="number"
                    endContent={<span className="text-gray-500">%</span>}
                    value={Number(formData?.Precio?.PorcentajeGanancia) || 0}
                    onChange={(e: any) => {
                      const value =
                        typeof e === "number"
                          ? e
                          : parseFloat(e.target.value) || 0;
                      updatePrecio("PorcentajeGanancia", value);
                    }}
                    isRequired
                    isDisabled={isSaving}
                  />
                  <NumberInput
                    label="Precio de Venta"
                    placeholder="0.00"
                    type="number"
                    startContent={<span className="text-gray-500">$</span>}
                    value={formData.Precio.PrecioPublico}
                    isReadOnly
                    isDisabled={isSaving}
                    classNames={{
                      input: "bg-gray-100 font-semibold text-green-600",
                    }}
                  />

                  {/* Porcentaje de ganancia 2 y precio de venta 2 */}
                  <NumberInput
                    label="% Ganancia"
                    placeholder="0"
                    type="number"
                    endContent={<span className="text-gray-500">%</span>}
                    value={Number(formData?.Precio?.PorcentajeGanancia2) || 0}
                    onChange={(e: any) => {
                      const value =
                        typeof e === "number"
                          ? e
                          : parseFloat(e.target.value) || 0;
                      updatePrecio("PorcentajeGanancia2", value);
                    }}
                    isRequired
                    isDisabled={isSaving}
                  />
                  <NumberInput
                    label="Precio de Venta"
                    placeholder="0.00"
                    type="number"
                    startContent={<span className="text-gray-500">$</span>}
                    value={formData.Precio.PrecioPublico2}
                    isReadOnly
                    isDisabled={isSaving}
                    classNames={{
                      input: "bg-gray-100 font-semibold text-green-600",
                    }}
                  />
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
                    label="Stock"
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
                  ⚠️ Límites de Venta
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
                        label="Límite de Venta"
                        placeholder="0.00"
                        type="number"
                        value={Number(formData.LimiteVenta) || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            LimiteVenta: Number(e.toString()) || 0,
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
                    🔄 Estado
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
        </ModalBody>
        <ModalFooter className="bg-white border-t border-gray-200">
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSaving}>
            {modoEdicion ? "Actualizar" : "Crear"} Producto
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
