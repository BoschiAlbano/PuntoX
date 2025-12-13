"use client";

import { useState } from "react";
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
  Spinner,
  NumberInput,
} from "@heroui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Tipos
import { Producto } from "@/lib/validations/producto.schema";
import { Iva } from "@/lib/validations/iva.schema";
import { UnidadMedida } from "@/lib/validations/unidad-medida.schema";
import { Rubro } from "@/lib/validations/rubro.schema";
import { Marca } from "@/lib/validations/marca.schema";
import { tiposVenta } from "@/lib/validations/tiposVenta.schema";

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// Funciones fetch
import { productoListAdapter } from "@/lib/adapters/producto.adapter";

const fetchProductos = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Producto[]> => {
  const response = await fetch("/api/productos", { signal });
  if (!response.ok) throw new Error("Error al cargar productos");
  const data = await response.json();
  return productoListAdapter(data?.productos);
};

const fetchMarcas = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Marca[]> => {
  const response = await fetch("/api/marcas", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.marcas) ? data.marcas : [];
};

const fetchRubros = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Rubro[]> => {
  const response = await fetch("/api/rubros", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.rubros) ? data.rubros : [];
};

const fetchUnidades = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<UnidadMedida[]> => {
  const response = await fetch("/api/unidades-medida", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.unidades) ? data.unidades : [];
};

const fetchIvas = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Iva[]> => {
  const response = await fetch("/api/ivas", { signal });
  if (!response.ok) throw new Error("Error");
  const data = await response.json();
  return Array.isArray(data?.ivas) ? data.ivas : [];
};

export default function ProductoCRUD() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(
    null
  );
  const [modoEdicion, setModoEdicion] = useState(false);

  // Queries de datos auxiliares
  const { data: marcas = [] } = useQuery({
    queryKey: ["marcas"],
    queryFn: fetchMarcas,
    enabled: isOpen,
  });
  const { data: rubros = [] } = useQuery({
    queryKey: ["rubros"],
    queryFn: fetchRubros,
    enabled: isOpen,
  });
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-medida"],
    queryFn: fetchUnidades,
    enabled: isOpen,
  });

  const { data: ivas = [] } = useQuery({
    queryKey: ["ivas"],
    queryFn: fetchIvas,
    enabled: isOpen,
  });
  // Estado del formulario
  const [formData, setFormData] = useState<Producto>({
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
  });

  // Query para obtener productos
  const {
    data: productos = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["productos"],
    queryFn: fetchProductos,
  });

  // Mutación para crear/actualizar
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Producto>) => {
      // Validaciones básicas antes de enviar
      if (!data.Descripcion || data.Descripcion.trim() === "") {
        throw {
          error: "Error de validación",
          details: [
            { field: "Descripcion", message: "La descripción es obligatoria" },
          ],
        } as ApiError;
      }

      if (!data.CodigoBarra || data.CodigoBarra.trim() === "") {
        throw {
          error: "Error de validación",
          details: [
            {
              field: "CodigoBarra",
              message: "El código de barras es obligatorio",
            },
          ],
        } as ApiError;
      }

      const isEdit = modoEdicion && productoSeleccionado;
      const url = "/api/productos";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      addToast({
        title: "Éxito",
        description: `Producto ${
          modoEdicion ? "actualizado" : "creado"
        } correctamente`,
        color: "success",
      });
      onClose();
    },
    onError: (error: ApiError) => {
      if (error.details && error.details.length > 0) {
        error.details.forEach((detail) => {
          addToast({
            title: "Error de validación",
            description: detail.message,
            color: "danger",
          });
        });
      } else {
        addToast({
          title: "Error",
          description: error.error || "Error al guardar el producto",
          color: "danger",
        });
      }
    },
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Nota: Asegúrate de tener implementadaDELETE /api/productos
      const response = await fetch(`/api/productos/?Id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      addToast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
        color: "success",
      });
      onDeleteClose();
      setProductoAEliminar(null);
    },
    onError: (error: ApiError) => {
      addToast({
        title: "Error",
        description: error.error || "Error al eliminar el producto",
        color: "danger",
      });
    },
  });

  // Handlers
  const handleCrear = () => {
    setModoEdicion(false);
    setProductoSeleccionado(null);
    setFormData({
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
    });
    onOpen();
  };

  const handleEditar = (producto: Producto) => {
    setModoEdicion(true);
    setProductoSeleccionado(producto);
    setFormData(producto);
    onOpen();
  };

  const handleGuardar = () => {
    console.log(formData);
    saveMutation.mutate(formData);
  };

  const handleConfirmarEliminar = (producto: Producto) => {
    setProductoAEliminar(producto);
    onDeleteOpen();
  };

  const handleEliminar = () => {
    if (productoAEliminar) {
      deleteMutation.mutate(productoAEliminar.Id);
    }
  };

  // Calcular precio de venta

  function calcularPrecioVenta(): number {
    if (formData?.Precio?.PrecioCosto && formData?.Precio?.PorcentajeGanancia) {
      const precioVenta =
        formData.Precio.PrecioCosto *
        (1 + formData.Precio.PorcentajeGanancia / 100);
      formData.Precio.PrecioPublico = precioVenta;
      return parseFloat(precioVenta.toFixed(2));
    }
    return 0.0;
  }

  function calcularPrecioVenta2(): number {
    if (
      formData?.Precio?.PrecioCosto &&
      formData?.Precio?.PorcentajeGanancia2
    ) {
      const precioVenta2 =
        formData.Precio.PrecioCosto *
        (1 + formData.Precio.PorcentajeGanancia2 / 100);
      formData.Precio.PrecioPublico2 = precioVenta2;
      return parseFloat(precioVenta2.toFixed(2));
    }
    return 0.0;
  }

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

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
          isDisabled={isLoading}
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
          <TableBody
            emptyContent={
              isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : isError ? (
                <div className="text-danger flex justify-center py-4">
                  Error al cargar datos
                </div>
              ) : (
                "No hay productos registrados"
              )
            }
          >
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
                <TableCell>${producto.Precio.PrecioCosto}</TableCell>
                <TableCell>{producto.Precio.PorcentajeGanancia}%</TableCell>
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
                        isDisabled={isSaving}
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
                        onPress={() => handleConfirmarEliminar(producto)}
                        isDisabled={isSaving}
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

              {/* Sección: Categorización */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  🏷️ Categorización
                </h4>
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

              {/* Sección: Precios */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  💰 Precios y Rentabilidad
                </h4>
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
                      setFormData({
                        ...formData,
                        Precio: {
                          ...formData.Precio,
                          PrecioCosto: value,
                        },
                      });
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
                      setFormData({
                        ...formData,
                        Precio: {
                          ...formData.Precio,
                          PorcentajeGanancia: value,
                        },
                      });
                    }}
                    isRequired
                    isDisabled={isSaving}
                  />
                  <NumberInput
                    label="Precio de Venta"
                    placeholder="0.00"
                    type="number"
                    startContent={<span className="text-gray-500">$</span>}
                    value={calcularPrecioVenta()}
                    isReadOnly
                    isDisabled={isSaving}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Precio: {
                          ...formData.Precio,
                          PrecioPublico: parseFloat(e.toString()),
                        },
                      })
                    }
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
                      setFormData({
                        ...formData,
                        Precio: {
                          ...formData.Precio,
                          PorcentajeGanancia2: value,
                        },
                      });
                    }}
                    isRequired
                    isDisabled={isSaving}
                  />
                  <NumberInput
                    label="Precio de Venta"
                    placeholder="0.00"
                    type="number"
                    startContent={<span className="text-gray-500">$</span>}
                    value={calcularPrecioVenta2()}
                    isReadOnly
                    isDisabled={isSaving}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Precio: {
                          ...formData.Precio,
                          PrecioPublico2: parseFloat(e.toString()),
                        },
                      })
                    }
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
                  isDisabled={isSaving}
                >
                  {formData.EstaEliminado
                    ? "Producto Inactivo"
                    : "Producto Activo"}
                </Switch>
              </div>
            </div>
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
            <Button
              color="primary"
              onPress={handleGuardar}
              isLoading={isSaving}
            >
              {modoEdicion ? "Actualizar" : "Crear"} Producto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        size="sm"
        backdrop="opaque"
        isDismissable={!isSaving}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-danger">
              Confirmar eliminación
            </h3>
          </ModalHeader>
          <ModalBody>
            <p>
              ¿Estás seguro de que deseas eliminar el producto{" "}
              <strong>{productoAEliminar?.Descripcion}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onDeleteClose}
              isDisabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleEliminar}
              isLoading={isSaving}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
