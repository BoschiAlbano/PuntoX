"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Spinner,
  Badge,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  FileText,
  Receipt,
  Package,
  CreditCard,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Percent,
  Calculator,
  TrendingUp,
  Box,
  Keyboard,
} from "lucide-react";

// Constantes
const TIPO_COMPROBANTE = {
  FACTURA: 1,
  PRESUPUESTO: 2,
  REMITO: 3,
};

const TIPO_PAGO = {
  EFECTIVO: 1,
  TARJETA: 2,
  CHEQUE: 3,
  CUENTA_CORRIENTE: 4,
  TRANSFERENCIA: 5,
};

// Cliente Consumidor Final por defecto
const CLIENTE_CONSUMIDOR_FINAL: Cliente = {
  id: 0,
  nombre: "Consumidor",
  apellido: "Final",
  nombreCompleto: "Consumidor Final",
  activarCtaCte: false,
};

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  activarCtaCte: boolean;
};

type Producto = {
  Id: number;
  Codigo: number;
  CodigoBarra: string;
  Descripcion: string;
  Precio: {
    PrecioPublico: number;
    PrecioCosto: number;
  };
  Iva: {
    Id: number;
    Porcentaje: number;
  };
  Stock: Array<{
    Cantidad: number;
  }>;
  DescuentaStock: boolean;
  PermiteStockNegativo: boolean;
};

type PuestoTrabajo = {
  id: number;
  codigo: number;
  descripcion: string | null;
};

type Tarjeta = {
  id: number;
  descripcion: string;
};

type DetalleVenta = {
  articuloId: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  iva: number;
  subtotal: number;
  costo: number;
  stockDisponible: number;
  porcentajeIva: number;
};

type FormaPagoVenta = {
  tipoPago: number;
  monto: number;
  tarjetaId?: number;
  numeroTarjeta?: string;
  cuponPago?: string;
  cantidadCuotas?: number;
};

export default function Ventas() {
  // Estados principales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [puestosTrabajo, setPuestosTrabajo] = useState<PuestoTrabajo[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del formulario
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(
    CLIENTE_CONSUMIDOR_FINAL
  );
  const [tipoComprobante, setTipoComprobante] = useState<number>(TIPO_COMPROBANTE.FACTURA);
  const [puestoTrabajoSeleccionado, setPuestoTrabajoSeleccionado] = useState<string>("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [descuento, setDescuento] = useState<number>(0);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(0);

  // Estados del carrito
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPagoVenta[]>([]);

  // Estados de modales
  const [openModalFormaPago, setOpenModalFormaPago] = useState(false);
  const [openModalVistaPrevia, setOpenModalVistaPrevia] = useState(false);
  const [formaPagoActual, setFormaPagoActual] = useState<Partial<FormaPagoVenta>>({
    tipoPago: TIPO_PAGO.EFECTIVO,
    monto: 0,
  });

  // Referencias para atajos de teclado
  const busquedaProductoRef = useRef<HTMLInputElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [clientesRes, productosRes, puestosRes, tarjetasRes] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/productos"),
        fetch("/api/puestos-trabajo"),
        fetch("/api/tarjetas"),
      ]);

      if (clientesRes.ok) {
        const { clientes } = await clientesRes.json();
        setClientes(clientes);
      }

      if (productosRes.ok) {
        const { productos } = await productosRes.json();
        setProductos(productos);
      }

      if (puestosRes.ok) {
        const { puestos } = await puestosRes.json();
        setPuestosTrabajo(puestos);
        // Seleccionar el primer puesto por defecto si es factura
        if (puestos.length > 0 && tipoComprobante === TIPO_COMPROBANTE.FACTURA) {
          setPuestoTrabajoSeleccionado(puestos[0].id.toString());
        }
      }

      if (tarjetasRes.ok) {
        const { tarjetas } = await tarjetasRes.json();
        setTarjetas(tarjetas);
      }
    } catch (error) {
      console.error("Error cargando datos", error);
      addToast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return [];
    const busqueda = busquedaCliente.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombreCompleto.toLowerCase().includes(busqueda) ||
        c.nombre.toLowerCase().includes(busqueda) ||
        c.apellido.toLowerCase().includes(busqueda)
    );
  }, [clientes, busquedaCliente]);

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return [];
    const busqueda = busquedaProducto.toLowerCase();
    return productos
      .filter(
        (p) =>
          p.Descripcion.toLowerCase().includes(busqueda) ||
          p.CodigoBarra.includes(busqueda) ||
          p.Codigo.toString().includes(busqueda)
      )
      .slice(0, 15);
  }, [productos, busquedaProducto]);

  // Atajos de teclado (después de definir productosFiltrados)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para buscar producto
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        busquedaProductoRef.current?.focus();
      }
      // Enter en búsqueda de producto para agregar el primero
      if (e.key === "Enter" && document.activeElement === busquedaProductoRef.current) {
        if (productosFiltrados.length > 0) {
          const producto = productosFiltrados[0];
          const stockTotal = producto.Stock.reduce(
            (sum, s) => sum + Number(s.Cantidad),
            0
          );
          const precioVenta = Number(producto.Precio.PrecioPublico);
          const porcentajeIva = Number(producto.Iva.Porcentaje);
          const cantidad = 1;
          const subtotal = precioVenta * cantidad;
          const precioSinIva = subtotal / (1 + porcentajeIva / 100);
          const iva = subtotal - precioSinIva;

          const nuevoDetalle: DetalleVenta = {
            articuloId: Number(producto.Id),
            codigo: producto.Codigo.toString(),
            descripcion: producto.Descripcion,
            cantidad,
            precio: precioVenta,
            iva,
            subtotal,
            costo: Number(producto.Precio.PrecioCosto),
            stockDisponible: stockTotal,
            porcentajeIva,
          };

          setDetalles((prev) => [...prev, nuevoDetalle]);
          setBusquedaProducto("");
          addToast({
            title: "✓ Producto agregado",
            description: producto.Descripcion,
            color: "success",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [productosFiltrados]);

  // Agregar producto al carrito
  const agregarProducto = (producto: Producto) => {
    const stockTotal = producto.Stock.reduce(
      (sum, s) => sum + Number(s.Cantidad),
      0
    );

    const precioVenta = Number(producto.Precio.PrecioPublico);
    const porcentajeIva = Number(producto.Iva.Porcentaje);
    const cantidad = 1;
    const subtotal = precioVenta * cantidad;
    const precioSinIva = subtotal / (1 + porcentajeIva / 100);
    const iva = subtotal - precioSinIva;

    const nuevoDetalle: DetalleVenta = {
      articuloId: Number(producto.Id),
      codigo: producto.Codigo.toString(),
      descripcion: producto.Descripcion,
      cantidad,
      precio: precioVenta,
      iva,
      subtotal,
      costo: Number(producto.Precio.PrecioCosto),
      stockDisponible: stockTotal,
      porcentajeIva,
    };

    setDetalles([...detalles, nuevoDetalle]);
    setBusquedaProducto("");
    addToast({
      title: "✓ Producto agregado",
      description: producto.Descripcion,
      color: "success",
    });
  };

  // Actualizar cantidad de un detalle
  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) return;

    const nuevosDetalles = [...detalles];
    const detalle = nuevosDetalles[index];

    // Validar stock
    if (detalle.cantidad < nuevaCantidad && detalle.stockDisponible < nuevaCantidad) {
      addToast({
        title: "Stock insuficiente",
        description: `Stock disponible: ${detalle.stockDisponible}`,
        color: "warning",
      });
      return;
    }

    detalle.cantidad = nuevaCantidad;
    detalle.subtotal = detalle.precio * nuevaCantidad;
    const precioSinIva = detalle.subtotal / (1 + detalle.porcentajeIva / 100);
    detalle.iva = detalle.subtotal - precioSinIva;

    setDetalles(nuevosDetalles);
  };

  // Eliminar detalle
  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  // Calcular totales
  const totales = useMemo(() => {
    const subtotal = detalles.reduce((sum, d) => sum + d.subtotal, 0);
    const ivaTotal = detalles.reduce((sum, d) => sum + d.iva, 0);
    
    // Calcular descuento
    let descuentoCalculado = descuento;
    if (descuentoPorcentaje > 0 && subtotal > 0) {
      descuentoCalculado = (subtotal * descuentoPorcentaje) / 100;
      setDescuento(descuentoCalculado);
    }
    
    const subtotalConDescuento = subtotal - descuentoCalculado;
    const totalFormasPago = formasPago.reduce((sum, fp) => sum + fp.monto, 0);
    
    return {
      subtotal,
      ivaTotal,
      descuento: descuentoCalculado,
      total: subtotalConDescuento,
      totalFormasPago,
      diferencia: subtotalConDescuento - totalFormasPago,
      items: detalles.length,
    };
  }, [detalles, descuento, descuentoPorcentaje, formasPago]);

  // Agregar forma de pago
  const agregarFormaPago = () => {
    if (!formaPagoActual.monto || formaPagoActual.monto <= 0) {
      addToast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        color: "danger",
      });
      return;
    }

    // Validar cuenta corriente
    if (
      formaPagoActual.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE &&
      (!clienteSeleccionado || clienteSeleccionado.id === 0)
    ) {
      addToast({
        title: "Error",
        description: "Debe seleccionar un cliente para usar Cuenta Corriente",
        color: "danger",
      });
      return;
    }

    // Asignar clienteId automáticamente si es cuenta corriente
    const formaPagoCompleta: FormaPagoVenta = {
      ...formaPagoActual,
      clienteId:
        formaPagoActual.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE &&
        clienteSeleccionado &&
        clienteSeleccionado.id !== 0
          ? clienteSeleccionado.id
          : formaPagoActual.clienteId,
    } as FormaPagoVenta;

    setFormasPago([...formasPago, formaPagoCompleta]);
    const montoRestante = totales.total - (totales.totalFormasPago + formaPagoActual.monto!);
    setFormaPagoActual({
      tipoPago: TIPO_PAGO.EFECTIVO,
      monto: montoRestante > 0 ? montoRestante : 0,
    });
    setOpenModalFormaPago(false);
  };

  // Eliminar forma de pago
  const eliminarFormaPago = (index: number) => {
    setFormasPago(formasPago.filter((_, i) => i !== index));
  };

  // Agregar forma de pago rápida (efectivo con monto restante)
  const agregarEfectivoRestante = () => {
    const montoRestante = totales.total - totales.totalFormasPago;
    if (montoRestante > 0) {
      setFormasPago([
        ...formasPago,
        {
          tipoPago: TIPO_PAGO.EFECTIVO,
          monto: montoRestante,
        },
      ]);
      addToast({
        title: "✓ Pago agregado",
        description: `Efectivo: $${montoRestante.toFixed(2)}`,
        color: "success",
      });
    }
  };

  // Validar si se puede finalizar
  const puedeFinalizar = useMemo(() => {
    return (
      clienteSeleccionado &&
      detalles.length > 0 &&
      formasPago.length > 0 &&
      Math.abs(totales.diferencia) <= 0.01 &&
      (tipoComprobante !== TIPO_COMPROBANTE.FACTURA || puestoTrabajoSeleccionado)
    );
  }, [
    clienteSeleccionado,
    detalles,
    formasPago,
    totales.diferencia,
    tipoComprobante,
    puestoTrabajoSeleccionado,
  ]);

  // Guardar venta
  const guardarVenta = async () => {
    if (!clienteSeleccionado) {
      addToast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        color: "danger",
      });
      return;
    }

    if (detalles.length === 0) {
      addToast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        color: "danger",
      });
      return;
    }

    if (tipoComprobante === TIPO_COMPROBANTE.FACTURA && !puestoTrabajoSeleccionado) {
      addToast({
        title: "Error",
        description: "Debe seleccionar un puesto de trabajo para facturas",
        color: "danger",
      });
      return;
    }

    if (formasPago.length === 0) {
      addToast({
        title: "Error",
        description: "Debe agregar al menos una forma de pago",
        color: "danger",
      });
      return;
    }

    if (Math.abs(totales.diferencia) > 0.01) {
      addToast({
        title: "Error",
        description: `El total de formas de pago no coincide con el total de la venta. Diferencia: $${totales.diferencia.toFixed(2)}`,
        color: "danger",
      });
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        tipoComprobante,
        clienteId: clienteSeleccionado.id === 0 ? null : clienteSeleccionado.id, // Consumidor Final tiene id 0
        puestoTrabajoId:
          tipoComprobante === TIPO_COMPROBANTE.FACTURA
            ? Number(puestoTrabajoSeleccionado)
            : undefined,
        descuento: totales.descuento,
        detalles: detalles.map((d) => ({
          articuloId: d.articuloId,
          codigo: d.codigo,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precio: d.precio,
          iva: d.iva,
          subtotal: d.subtotal,
          costo: d.costo,
        })),
        formasPago: formasPago.map((fp) => ({
          tipoPago: fp.tipoPago,
          monto: fp.monto,
          tarjetaId: fp.tipoPago === TIPO_PAGO.TARJETA ? fp.tarjetaId : undefined,
          numeroTarjeta: fp.numeroTarjeta,
          cuponPago: fp.cuponPago,
          cantidadCuotas: fp.cantidadCuotas,
          clienteId:
            fp.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE && clienteSeleccionado?.id !== 0
              ? clienteSeleccionado.id
              : undefined,
          chequeId: fp.tipoPago === TIPO_PAGO.CHEQUE ? fp.chequeId : undefined,
        })),
      };

      const res = await fetch("/api/comprobantes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la venta");
      }

      addToast({
        title: "✓ Venta finalizada",
        description: `Comprobante #${data.comprobante.numero} creado exitosamente`,
        color: "success",
      });

      // Limpiar formulario
      setClienteSeleccionado(CLIENTE_CONSUMIDOR_FINAL);
      setDetalles([]);
      setFormasPago([]);
      setDescuento(0);
      setDescuentoPorcentaje(0);
      setPuestoTrabajoSeleccionado(
        puestosTrabajo.length > 0 && tipoComprobante === TIPO_COMPROBANTE.FACTURA
          ? puestosTrabajo[0].id.toString()
          : ""
      );
      setBusquedaProducto("");
    } catch (error: any) {
      console.error("Error guardando venta", error);
      addToast({
        title: "Error",
        description: error.message || "No se pudo guardar la venta",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener nombre del tipo de comprobante
  const nombreTipoComprobante = useMemo(() => {
    switch (tipoComprobante) {
      case TIPO_COMPROBANTE.FACTURA:
        return "Factura";
      case TIPO_COMPROBANTE.PRESUPUESTO:
        return "Presupuesto";
      case TIPO_COMPROBANTE.REMITO:
        return "Remito";
      default:
        return "Comprobante";
    }
  }, [tipoComprobante]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header mejorado */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            Nueva Venta
          </h1>
          <p className="text-gray-600 mt-2">
            Registra una nueva venta o comprobante
          </p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Vista previa del comprobante (Ctrl+P)">
            <Button
              variant="flat"
              onPress={() => setOpenModalVistaPrevia(true)}
              isDisabled={detalles.length === 0}
            >
              <FileText className="w-4 h-4" />
              Vista Previa
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Cliente y productos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de cliente y tipo de comprobante */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Datos de la venta
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Tipo de comprobante"
                  selectedKeys={[tipoComprobante.toString()]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setTipoComprobante(Number(selected));
                    if (Number(selected) !== TIPO_COMPROBANTE.FACTURA) {
                      setPuestoTrabajoSeleccionado("");
                    } else if (puestosTrabajo.length > 0) {
                      setPuestoTrabajoSeleccionado(puestosTrabajo[0].id.toString());
                    }
                  }}
                >
                  <SelectItem key="1" value="1">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Factura
                    </div>
                  </SelectItem>
                  <SelectItem key="2" value="2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Presupuesto
                    </div>
                  </SelectItem>
                  <SelectItem key="3" value="3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Remito
                    </div>
                  </SelectItem>
                </Select>

                {tipoComprobante === TIPO_COMPROBANTE.FACTURA && (
                  <Select
                    label="Puesto de trabajo"
                    selectedKeys={
                      puestoTrabajoSeleccionado ? [puestoTrabajoSeleccionado] : []
                    }
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setPuestoTrabajoSeleccionado(selected);
                    }}
                  >
                    {puestosTrabajo.map((puesto) => (
                      <SelectItem key={puesto.id.toString()} value={puesto.id.toString()}>
                        {puesto.descripcion || `Puesto ${puesto.codigo}`}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Cliente</label>
                  {clienteSeleccionado && clienteSeleccionado.id !== 0 && (
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setClienteSeleccionado(CLIENTE_CONSUMIDOR_FINAL)}
                    >
                      Cambiar
                    </Button>
                  )}
                </div>
                {clienteSeleccionado?.id === 0 ? (
                  <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      <span className="font-medium text-primary">
                        {clienteSeleccionado.nombreCompleto}
                      </span>
                      <Chip size="sm" color="primary" variant="flat">
                        Por defecto
                      </Chip>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setBusquedaCliente("")}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    placeholder="Buscar cliente..."
                    value={busquedaCliente}
                    onChange={(e) => setBusquedaCliente(e.target.value)}
                    startContent={<Search className="w-4 h-4" />}
                    endContent={
                      clienteSeleccionado && (
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => setClienteSeleccionado(CLIENTE_CONSUMIDOR_FINAL)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )
                    }
                  />
                )}
                {busquedaCliente && clientesFiltrados.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto shadow-lg bg-white">
                    {clientesFiltrados.slice(0, 10).map((cliente) => (
                      <div
                        key={cliente.id}
                        className="p-3 hover:bg-primary-50 cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => {
                          setClienteSeleccionado(cliente);
                          setBusquedaCliente("");
                        }}
                      >
                        <div className="font-medium">{cliente.nombreCompleto}</div>
                        {cliente.activarCtaCte && (
                          <Chip size="sm" color="success" variant="flat" className="mt-1">
                            Cuenta Corriente
                          </Chip>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Búsqueda y selección de productos */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-success-50 to-success-100">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Box className="w-5 h-5" />
                Productos
                <Chip size="sm" variant="flat" color="success">
                  {productos.length} disponibles
                </Chip>
              </h2>
            </CardHeader>
            <CardBody>
              <div className="relative">
                <Input
                  ref={busquedaProductoRef}
                  label="Buscar producto"
                  placeholder="Código, código de barras, descripción... (Ctrl+K)"
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  startContent={<Search className="w-4 h-4" />}
                  endContent={
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Keyboard className="w-3 h-3" />
                      <span>Ctrl+K</span>
                    </div>
                  }
                />
              </div>
              {busquedaProducto && productosFiltrados.length > 0 && (
                <div className="mt-4 border rounded-lg max-h-80 overflow-y-auto shadow-lg bg-white">
                  {productosFiltrados.map((producto) => {
                    const stockTotal = producto.Stock.reduce(
                      (sum, s) => sum + Number(s.Cantidad),
                      0
                    );
                    const precio = Number(producto.Precio.PrecioPublico);
                    const porcentajeIva = Number(producto.Iva.Porcentaje);
                    const stockBajo = stockTotal < 10;
                    const sinStock = stockTotal === 0 && !producto.PermiteStockNegativo;

                    return (
                      <div
                        key={producto.Id}
                        className={`p-3 border-b hover:bg-success-50 cursor-pointer transition-all ${
                          sinStock ? "opacity-50" : ""
                        }`}
                        onClick={() => !sinStock && agregarProducto(producto)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {producto.Descripcion}
                              {stockBajo && (
                                <Chip size="sm" color="warning" variant="flat">
                                  Stock bajo
                                </Chip>
                              )}
                              {sinStock && (
                                <Chip size="sm" color="danger" variant="flat">
                                  Sin stock
                                </Chip>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                              <span>Código: {producto.Codigo}</span>
                              <span className="flex items-center gap-1">
                                <Box className="w-3 h-3" />
                                {stockTotal} unidades
                              </span>
                              <span className="font-semibold text-success-600">
                                ${precio.toFixed(2)}
                              </span>
                              <span className="text-xs">IVA {porcentajeIva}%</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            color="success"
                            isDisabled={sinStock}
                            onPress={() => agregarProducto(producto)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {busquedaProducto && productosFiltrados.length === 0 && (
                <div className="mt-4 p-4 text-center text-gray-500 border rounded-lg">
                  No se encontraron productos
                </div>
              )}
            </CardBody>
          </Card>

          {/* Carrito de productos */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-warning-50 to-warning-100">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito
                <Badge
                  content={detalles.length}
                  color="warning"
                  size="lg"
                  isInvisible={detalles.length === 0}
                >
                  <div />
                </Badge>
              </h2>
            </CardHeader>
            <CardBody>
              {detalles.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">El carrito está vacío</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Busca productos y agrégalos al carrito
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detalles.map((detalle, index) => {
                    const producto = productos.find(
                      (p) => Number(p.Id) === detalle.articuloId
                    );
                    const stockBajo = detalle.stockDisponible < detalle.cantidad * 2;

                    return (
                      <div
                        key={index}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {detalle.descripcion}
                              {stockBajo && (
                                <Chip size="sm" color="warning" variant="flat">
                                  Stock: {detalle.stockDisponible}
                                </Chip>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Código: {detalle.codigo} | IVA {detalle.porcentajeIva}%
                            </div>
                          </div>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => eliminarDetalle(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              isIconOnly
                              variant="flat"
                              onPress={() => actualizarCantidad(index, detalle.cantidad - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-16 text-center font-semibold text-lg">
                              {detalle.cantidad}
                            </span>
                            <Button
                              size="sm"
                              isIconOnly
                              variant="flat"
                              color="primary"
                              onPress={() => actualizarCantidad(index, detalle.cantidad + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              ${detalle.precio.toFixed(2)} c/u
                            </div>
                            <div className="font-bold text-lg">
                              ${detalle.subtotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Columna derecha: Totales y formas de pago */}
        <div className="space-y-6">
          {/* Resumen de venta mejorado */}
          <Card className="shadow-lg border-2 border-primary-200">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Resumen de Venta
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items:</span>
                  <Badge content={totales.items} color="primary" size="lg">
                    <Box className="w-5 h-5" />
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">${totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">IVA:</span>
                  <Chip size="sm" color="success" variant="flat">
                    ${totales.ivaTotal.toFixed(2)}
                  </Chip>
                </div>
                <Divider />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      Descuento:
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        size="sm"
                        value={descuentoPorcentaje.toString()}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setDescuentoPorcentaje(val);
                          if (val > 0) {
                            setDescuento((totales.subtotal * val) / 100);
                          } else {
                            setDescuento(0);
                          }
                        }}
                        className="w-20"
                        min="0"
                        max="100"
                        endContent="%"
                      />
                      <Input
                        type="number"
                        size="sm"
                        value={descuento.toString()}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setDescuento(val);
                          if (totales.subtotal > 0) {
                            setDescuentoPorcentaje((val / totales.subtotal) * 100);
                          }
                        }}
                        className="w-24"
                        min="0"
                        startContent="$"
                      />
                    </div>
                  </div>
                  {totales.descuento > 0 && (
                    <div className="flex justify-between text-danger-600">
                      <span>Descuento aplicado:</span>
                      <span className="font-semibold">-${totales.descuento.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Divider />
                <div className="flex justify-between items-center bg-primary-50 p-3 rounded-lg">
                  <span className="text-lg font-bold text-primary-700">Total:</span>
                  <span className="text-2xl font-bold text-primary-700">
                    ${totales.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Formas de pago mejoradas */}
          <Card className="shadow-md">
            <CardHeader className="flex justify-between items-center bg-gradient-to-r from-success-50 to-success-100">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Formas de pago
              </h2>
              <div className="flex gap-2">
                {totales.diferencia > 0 && (
                  <Tooltip content="Agregar efectivo por el monto restante">
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={agregarEfectivoRestante}
                    >
                      <Zap className="w-4 h-4" />
                      Restante
                    </Button>
                  </Tooltip>
                )}
                <Button
                  size="sm"
                  color="primary"
                  onPress={() => {
                    const montoRestante = totales.total - totales.totalFormasPago;
                    setFormaPagoActual({
                      tipoPago: TIPO_PAGO.EFECTIVO,
                      monto: montoRestante > 0 ? montoRestante : 0,
                    });
                    setOpenModalFormaPago(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {formasPago.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No hay formas de pago</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formasPago.map((fp, index) => {
                    const tipoPagoNombre =
                      fp.tipoPago === TIPO_PAGO.EFECTIVO
                        ? "Efectivo"
                        : fp.tipoPago === TIPO_PAGO.TARJETA
                        ? "Tarjeta"
                        : fp.tipoPago === TIPO_PAGO.CHEQUE
                        ? "Cheque"
                        : fp.tipoPago === TIPO_PAGO.CUENTA_CORRIENTE
                        ? "Cuenta Corriente"
                        : "Transferencia";

                    const icono =
                      fp.tipoPago === TIPO_PAGO.EFECTIVO ? (
                        <DollarSign className="w-4 h-4" />
                      ) : fp.tipoPago === TIPO_PAGO.TARJETA ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Receipt className="w-4 h-4" />
                      );

                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2">
                          {icono}
                          <div>
                            <div className="font-medium">{tipoPagoNombre}</div>
                            {fp.tipoPago === TIPO_PAGO.TARJETA && fp.cantidadCuotas && (
                              <div className="text-xs text-gray-500">
                                {fp.cantidadCuotas} cuotas
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">${fp.monto.toFixed(2)}</span>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => eliminarFormaPago(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Divider className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total pagos:</span>
                  <span className="font-bold text-lg">${totales.totalFormasPago.toFixed(2)}</span>
                </div>
                {Math.abs(totales.diferencia) > 0.01 && (
                  <div
                    className={`p-2 rounded-lg flex items-center justify-between ${
                      totales.diferencia > 0
                        ? "bg-warning-50 border border-warning-200"
                        : "bg-danger-50 border border-danger-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {totales.diferencia > 0 ? (
                        <AlertCircle className="w-4 h-4 text-warning-600" />
                      ) : (
                        <X className="w-4 h-4 text-danger-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          totales.diferencia > 0 ? "text-warning-700" : "text-danger-700"
                        }`}
                      >
                        Diferencia:
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        totales.diferencia > 0 ? "text-warning-700" : "text-danger-700"
                      }`}
                    >
                      ${Math.abs(totales.diferencia).toFixed(2)}
                    </span>
                  </div>
                )}
                {Math.abs(totales.diferencia) <= 0.01 && formasPago.length > 0 && (
                  <div className="p-2 rounded-lg bg-success-50 border border-success-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success-600" />
                    <span className="text-sm font-medium text-success-700">
                      Pagos completos
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Botón finalizar venta mejorado */}
          <Button
            color={puedeFinalizar ? "success" : "default"}
            size="lg"
            className="w-full h-14 text-lg font-bold shadow-lg"
            onPress={guardarVenta}
            isLoading={isSaving}
            isDisabled={!puedeFinalizar}
            startContent={
              !isSaving && (
                <CheckCircle2 className="w-6 h-6" />
              )
            }
          >
            {isSaving ? (
              "Procesando..."
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Finalizar Venta
              </>
            )}
          </Button>

          {/* Indicadores de estado */}
          {!puedeFinalizar && (
            <Card className="border-warning-200 bg-warning-50">
              <CardBody className="p-3">
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-warning-600 mt-0.5" />
                  <div className="text-warning-700">
                    {!clienteSeleccionado && "• Selecciona un cliente\n"}
                    {detalles.length === 0 && "• Agrega productos al carrito\n"}
                    {formasPago.length === 0 && "• Agrega formas de pago\n"}
                    {Math.abs(totales.diferencia) > 0.01 &&
                      "• Completa el total de pagos\n"}
                    {tipoComprobante === TIPO_COMPROBANTE.FACTURA &&
                      !puestoTrabajoSeleccionado &&
                      "• Selecciona un puesto de trabajo"}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Modal para agregar forma de pago */}
      <Modal
        isOpen={openModalFormaPago}
        onClose={() => setOpenModalFormaPago(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Agregar forma de pago</ModalHeader>
          <ModalBody className="space-y-4">
            <Select
              label="Tipo de pago"
              selectedKeys={[formaPagoActual.tipoPago?.toString() || ""]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormaPagoActual({
                  ...formaPagoActual,
                  tipoPago: Number(selected),
                });
              }}
            >
              <SelectItem key="1" value="1">
                Efectivo
              </SelectItem>
              <SelectItem key="2" value="2">
                Tarjeta
              </SelectItem>
              <SelectItem key="3" value="3">
                Cheque
              </SelectItem>
              <SelectItem key="4" value="4">
                Cuenta Corriente
              </SelectItem>
              <SelectItem key="5" value="5">
                Transferencia
              </SelectItem>
            </Select>

            {formaPagoActual.tipoPago === TIPO_PAGO.TARJETA && (
              <>
                <Select
                  label="Tarjeta"
                  selectedKeys={
                    formaPagoActual.tarjetaId
                      ? [formaPagoActual.tarjetaId.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormaPagoActual({
                      ...formaPagoActual,
                      tarjetaId: Number(selected),
                    });
                  }}
                >
                  {tarjetas.map((tarjeta) => (
                    <SelectItem
                      key={tarjeta.id.toString()}
                      value={tarjeta.id.toString()}
                    >
                      {tarjeta.descripcion}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  label="Número de tarjeta"
                  value={formaPagoActual.numeroTarjeta || ""}
                  onChange={(e) =>
                    setFormaPagoActual({
                      ...formaPagoActual,
                      numeroTarjeta: e.target.value,
                    })
                  }
                />
                <Input
                  label="Cupón de pago"
                  value={formaPagoActual.cuponPago || ""}
                  onChange={(e) =>
                    setFormaPagoActual({
                      ...formaPagoActual,
                      cuponPago: e.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  label="Cantidad de cuotas"
                  value={formaPagoActual.cantidadCuotas?.toString() || "1"}
                  onChange={(e) =>
                    setFormaPagoActual({
                      ...formaPagoActual,
                      cantidadCuotas: Number(e.target.value) || 1,
                    })
                  }
                  min="1"
                />
              </>
            )}

            <Input
              type="number"
              label="Monto"
              value={formaPagoActual.monto?.toString() || "0"}
              onChange={(e) =>
                setFormaPagoActual({
                  ...formaPagoActual,
                  monto: Number(e.target.value) || 0,
                })
              }
              min="0"
              step="0.01"
              startContent="$"
            />
            {totales.total > 0 && (
              <div className="text-sm text-gray-500">
                Monto restante: ${(totales.total - totales.totalFormasPago).toFixed(2)}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setOpenModalFormaPago(false)}
            >
              Cancelar
            </Button>
            <Button color="primary" onPress={agregarFormaPago}>
              Agregar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal vista previa */}
      <Modal
        isOpen={openModalVistaPrevia}
        onClose={() => setOpenModalVistaPrevia(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Vista Previa del Comprobante</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold">{nombreTipoComprobante}</h3>
                <p className="text-gray-500">Vista previa</p>
              </div>
              <div>
                <p className="font-semibold">Cliente:</p>
                <p>{clienteSeleccionado?.nombreCompleto || "No seleccionado"}</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Productos:</p>
                <div className="space-y-2">
                  {detalles.map((d, i) => (
                    <div key={i} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{d.descripcion}</p>
                        <p className="text-sm text-gray-500">
                          {d.cantidad} x ${d.precio.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">${d.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Divider />
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totales.subtotal.toFixed(2)}</span>
                </div>
                {totales.descuento > 0 && (
                  <div className="flex justify-between text-danger">
                    <span>Descuento:</span>
                    <span>-${totales.descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${totales.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setOpenModalVistaPrevia(false)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
