"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Switch,
  Select,
  SelectItem,
  Chip,
  Tooltip,
  useDisclosure,
  addToast,
} from "@heroui/react";

// Tipos para el producto basados en el modelo Articulo de Prisma
interface Producto {
  Id: number;
  MarcaId: number;
  RubroId: number;
  UnidadMedidaId: number;
  IvaId: number;
  PrecioId: number;
  Codigo: number;
  CodigoBarra: string;
  Abreviatura?: string;
  Descripcion: string;
  Detalle?: string;
  Ubicacion?: string;
  PrecioCosto: number;
  PorcentajeGanancia: number;
  Foto?: string; // Base64 o URL
  ActivarLimiteVenta: boolean;
  LimiteVenta: number;
  ActivarHoraVenta: boolean;
  HoraLimiteVentaDesde: string;
  HoraLimiteVentaHasta: string;
  PermiteStockNegativo: boolean;
  DescuentaStock: boolean;
  StockMinimo: number;
  VencimientoDias: number;
  TipoVenta: number;
  EstaEliminado: boolean;
}

// Datos de ejemplo para los selects (estos deberían venir de la API)
const marcas = [
  { id: 1, nombre: "Marca 1" },
  { id: 2, nombre: "Marca 2" },
  { id: 3, nombre: "Marca 3" },
];

const rubros = [
  { id: 1, nombre: "Rubro 1" },
  { id: 2, nombre: "Rubro 2" },
  { id: 3, nombre: "Rubro 3" },
];

const unidadesMedida = [
  { id: 1, nombre: "Unidad" },
  { id: 2, nombre: "Kilogramo" },
  { id: 3, nombre: "Litro" },
];

const ivas = [
  { id: 1, nombre: "21%", porcentaje: 21 },
  { id: 2, nombre: "10.5%", porcentaje: 10.5 },
  { id: 3, nombre: "0%", porcentaje: 0 },
];

const tiposVenta = [
  { id: 0, nombre: "Normal" },
  { id: 1, nombre: "Por Peso" },
  { id: 2, nombre: "Por Unidad" },
];

export default function ProductoCRUD() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Producto>>({
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
    PrecioCosto: 0,
    PorcentajeGanancia: 0,
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
  });

  // Abrir modal para crear
  const handleCrear = () => {
    setModoEdicion(false);
    setProductoSeleccionado(null);
    setFormData({
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
      PrecioCosto: 0,
      PorcentajeGanancia: 0,
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
    });
    onOpen();
  };

  // Abrir modal para editar
  const handleEditar = (producto: Producto) => {
    setModoEdicion(true);
    setProductoSeleccionado(producto);
    setFormData(producto);
    onOpen();
  };

  // Guardar producto (crear o actualizar)
  const handleGuardar = async () => {
    try {
      // Validaciones básicas
      if (!formData.Descripcion || formData.Descripcion.trim() === "") {
        addToast({
          title: "Error",
          description: "La descripción es obligatoria",
          color: "danger",
        });

        return;
      }

      if (!formData.CodigoBarra || formData.CodigoBarra.trim() === "") {
        addToast({
          title: "Error",
          description: "El código de barras es obligatorio",
          color: "danger",
        });
        return;
      }

      // Aquí iría la llamada a la API
      if (modoEdicion && productoSeleccionado) {
        // Actualizar
        addToast({
          title: "Error",
          description: "Producto actualizado correctamente",
          color: "success",
        });
        console.log("Actualizar producto:", formData);
      } else {
        // Crear
        addToast({
          title: "Error",
          description: "Producto creado correctamente",
          color: "success",
        });
        console.log("Crear producto:", formData);
      }

      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al guardar el producto",
        color: "danger",
      });
      console.error(error);
    }
  };

  // Eliminar producto
  const handleEliminar = async (id: number) => {
    try {
      // Aquí iría la llamada a la API
      addToast({
        title: "Error",
        description: "Producto eliminado correctamente",
        color: "success",
      });
      console.log("Eliminar producto:", id);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Error al eliminar el producto",
        color: "danger",
      });
      console.error(error);
    }
  };

  // Calcular precio de venta
  const calcularPrecioVenta = () => {
    if (formData.PrecioCosto && formData.PorcentajeGanancia) {
      const precioVenta =
        formData.PrecioCosto * (1 + formData.PorcentajeGanancia / 100);
      return precioVenta.toFixed(2);
    }
    return "0.00";
  };

  return (
    <div className="w-full space-y-4">
      {/* Header con botón crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Productos
          </h2>
          <p className="text-gray-600 mt-1">
            Administra tu catálogo de productos
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          onPress={handleCrear}
          className="font-semibold"
        >
          + Nuevo Producto
        </Button>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table aria-label="Tabla de productos">
          <TableHeader>
            <TableColumn>CÓDIGO</TableColumn>
            <TableColumn>CÓDIGO BARRA</TableColumn>
            <TableColumn>DESCRIPCIÓN</TableColumn>
            <TableColumn>PRECIO COSTO</TableColumn>
            <TableColumn>% GANANCIA</TableColumn>
            <TableColumn>STOCK MÍNIMO</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No hay productos registrados">
            {productos.map((producto) => (
              <TableRow key={producto.Id}>
                <TableCell>{producto.Codigo}</TableCell>
                <TableCell>{producto.CodigoBarra}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold">{producto.Descripcion}</p>
                    {producto.Abreviatura && (
                      <p className="text-xs text-gray-500">
                        {producto.Abreviatura}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>${producto.PrecioCosto.toFixed(2)}</TableCell>
                <TableCell>{producto.PorcentajeGanancia}%</TableCell>
                <TableCell>{producto.StockMinimo}</TableCell>
                <TableCell>
                  <Chip
                    color={producto.EstaEliminado ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {producto.EstaEliminado ? "Inactivo" : "Activo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditar(producto)}
                      >
                        ✏️
                      </Button>
                    </Tooltip>
                    <Tooltip content="Eliminar" color="danger">
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => handleEliminar(producto.Id)}
                      >
                        🗑️
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal para crear/editar */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
        backdrop="opaque"
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
          <ModalBody className="bg-white">
            <div className="space-y-6">
              {/* Sección: Información Básica */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  📋 Información Básica
                </h4>
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
                  />
                  <Input
                    label="Código de Barras"
                    placeholder="Ingrese el código de barras"
                    value={formData.CodigoBarra || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, CodigoBarra: e.target.value })
                    }
                    isRequired
                  />
                  <Input
                    label="Abreviatura"
                    placeholder="Ej: PROD-001"
                    value={formData.Abreviatura || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, Abreviatura: e.target.value })
                    }
                  />
                  <Input
                    label="Descripción"
                    placeholder="Nombre del producto"
                    value={formData.Descripcion || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, Descripcion: e.target.value })
                    }
                    isRequired
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
                />
                <Input
                  label="Ubicación"
                  placeholder="Ubicación en almacén"
                  value={formData.Ubicacion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Ubicacion: e.target.value })
                  }
                />
              </div>

              {/* Sección: Categorización */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  🏷️ Categorización
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Marca"
                    placeholder="Seleccione una marca"
                    selectedKeys={[formData.MarcaId?.toString() || "1"]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        MarcaId: parseInt(e.target.value) || 1,
                      })
                    }
                    isRequired
                  >
                    {marcas.map((marca) => (
                      <SelectItem key={marca.id.toString()}>
                        {marca.nombre}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Rubro"
                    placeholder="Seleccione un rubro"
                    selectedKeys={[formData.RubroId?.toString() || "1"]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        RubroId: parseInt(e.target.value) || 1,
                      })
                    }
                    isRequired
                  >
                    {rubros.map((rubro) => (
                      <SelectItem key={rubro.id.toString()}>
                        {rubro.nombre}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Unidad de Medida"
                    placeholder="Seleccione unidad"
                    selectedKeys={[formData.UnidadMedidaId?.toString() || "1"]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        UnidadMedidaId: parseInt(e.target.value) || 1,
                      })
                    }
                    isRequired
                  >
                    {unidadesMedida.map((unidad) => (
                      <SelectItem key={unidad.id.toString()}>
                        {unidad.nombre}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="IVA"
                    placeholder="Seleccione IVA"
                    selectedKeys={[formData.IvaId?.toString() || "1"]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        IvaId: parseInt(e.target.value) || 1,
                      })
                    }
                    isRequired
                  >
                    {ivas.map((iva) => (
                      <SelectItem key={iva.id.toString()}>
                        {iva.nombre}
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
                        TipoVenta: parseInt(e.target.value) || 0,
                      })
                    }
                  >
                    {tiposVenta.map((tipo) => (
                      <SelectItem key={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Sección: Precios */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  💰 Precios y Rentabilidad
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Precio Costo"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    startContent={<span className="text-gray-500">$</span>}
                    value={formData.PrecioCosto?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        PrecioCosto: parseFloat(e.target.value) || 0,
                      })
                    }
                    isRequired
                  />
                  <Input
                    label="% Ganancia"
                    placeholder="0"
                    type="number"
                    step="0.01"
                    endContent={<span className="text-gray-500">%</span>}
                    value={formData.PorcentajeGanancia?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        PorcentajeGanancia: parseFloat(e.target.value) || 0,
                      })
                    }
                    isRequired
                  />
                  <Input
                    label="Precio de Venta"
                    placeholder="0.00"
                    type="text"
                    startContent={<span className="text-gray-500">$</span>}
                    value={calcularPrecioVenta()}
                    isReadOnly
                    classNames={{
                      input: "bg-gray-100 font-semibold text-green-600",
                    }}
                  />
                </div>
              </div>

              {/* Sección: Stock */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  📦 Gestión de Stock
                </h4>
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
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Switch
                    isSelected={formData.DescuentaStock}
                    onValueChange={(value) =>
                      setFormData({ ...formData, DescuentaStock: value })
                    }
                  >
                    Descuenta Stock
                  </Switch>
                  <Switch
                    isSelected={formData.PermiteStockNegativo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, PermiteStockNegativo: value })
                    }
                  >
                    Permite Stock Negativo
                  </Switch>
                </div>
              </div>

              {/* Sección: Límites de Venta */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  ⚠️ Límites de Venta
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      isSelected={formData.ActivarLimiteVenta}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ActivarLimiteVenta: value })
                      }
                    >
                      Activar Límite de Venta
                    </Switch>
                    {formData.ActivarLimiteVenta && (
                      <Input
                        label="Límite de Venta"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        value={formData.LimiteVenta?.toString() || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            LimiteVenta: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="max-w-xs"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Switch
                      isSelected={formData.ActivarHoraVenta}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ActivarHoraVenta: value })
                      }
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
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección: Estado */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  🔄 Estado
                </h4>
                <Switch
                  isSelected={!formData.EstaEliminado}
                  onValueChange={(value) =>
                    setFormData({ ...formData, EstaEliminado: !value })
                  }
                  color={formData.EstaEliminado ? "danger" : "success"}
                >
                  {formData.EstaEliminado
                    ? "Producto Inactivo"
                    : "Producto Activo"}
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="bg-white border-t border-gray-200">
            <Button color="danger" variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleGuardar}>
              {modoEdicion ? "Actualizar" : "Crear"} Producto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
