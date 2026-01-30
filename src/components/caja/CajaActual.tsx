import { useCaja } from "@/hooks/useCaja";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import {
  Eye,
  FileText,
  Lock,
  Plus,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Unlock,
} from "lucide-react";
import React, { useState } from "react";
import { LoadingComponent } from "../loading/loading";

const TIPO_MOVIMIENTO = {
  ENTRADA: 1,
  SALIDA: 2,
};

const TIPO_PAGO = {
  EFECTIVO: 1,
  TARJETA: 2,
  CHEQUE: 3,
  CUENTA_CORRIENTE: 4,
  TRANSFERENCIA: 5,
};

export default function CajaActual() {
  const {
    cajaActual,
    conceptosGasto,
    isLoading,
    isFetching,
    isOpening,
    isAddingGasto,
    isAddingConcepto,
    abrirCaja,
    agregarGasto,
    agregarConceptoGasto,
    refetch,
    isCajaAbierta,
    fetchDetalleComprobante, // We need to add this to hook
  } = useCaja({
    enableCaja: true,
    enableConceptos: true,
    enableResumen: true,
  });

  const [montoInicial, setMontoInicial] = useState("");
  const {
    isOpen: isAbrirOpen,
    onOpen: onAbrirOpen,
    onOpenChange: onAbrirChange,
  } = useDisclosure();

  // Gastos
  const {
    isOpen: isGastoOpen,
    onOpen: onGastoOpen,
    onOpenChange: onGastoChange,
  } = useDisclosure();
  const [nuevoGasto, setNuevoGasto] = useState({
    conceptoId: "",
    descripcion: "",
    monto: "",
  });

  // Nuevo concepto
  const {
    isOpen: isConceptoOpen,
    onOpen: onConceptoOpen,
    onOpenChange: onConceptoChange,
  } = useDisclosure();
  const [nuevoConcepto, setNuevoConcepto] = useState("");

  const handleAgregarConcepto = async () => {
    if (!nuevoConcepto) return;
    try {
      await agregarConceptoGasto(nuevoConcepto);
      onConceptoChange();
      setNuevoConcepto("");
      addToast({ title: "Concepto creado", color: "success" });
    } catch (err) {
      addToast({
        title: "Error",
        description: "No se pudo crear el concepto",
        color: "danger",
      });
    }
  };

  // Detalle Comprobante Modal
  const {
    isOpen: isTicketOpen,
    onOpen: onTicketOpen,
    onOpenChange: onTicketChange,
  } = useDisclosure();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  const movimientos = cajaActual?.Movimiento || [];
  const gastos = cajaActual?.Gasto || [];

  const handleAbrirCaja = async () => {
    if (!montoInicial || Number(montoInicial) < 0) return;
    try {
      await abrirCaja(Number(montoInicial));
      onAbrirChange();
      setMontoInicial("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAgregarGasto = async () => {
    try {
      await agregarGasto({
        conceptoId: Number(nuevoGasto.conceptoId),
        descripcion: nuevoGasto.descripcion,
        monto: Number(nuevoGasto.monto),
      });
      onGastoChange();
      setNuevoGasto({ conceptoId: "", descripcion: "", monto: "" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewTicket = async (comprobanteId: number) => {
    setIsLoadingTicket(true);
    setSelectedTicket(null);
    onTicketOpen();
    try {
      if (fetchDetalleComprobante) {
        const data = await fetchDetalleComprobante(comprobanteId);
        setSelectedTicket(data);
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      addToast({
        title: "Error",
        description: "No se pudo obtener el detalle del comprobante",
        color: "danger",
      });
    } finally {
      setIsLoadingTicket(false);
    }
  };

  const formatMoney = (val: number) =>
    val.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        {/* <Spinner size="lg" /> */}
        <LoadingComponent message="Cargando caja..." />
      </div>
    );
  }

  // Caja Cerrada State
  if (!isCajaAbierta || !cajaActual) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 h-full min-h-[500px] text-gray-500">
        <Lock className="w-16 h-16 text-gray-300" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            La caja está cerrada
          </h2>
          <p className="text-sm">
            Debes abrir la caja para comenzar a registrar operaciones.
          </p>
        </div>
        <Button
          color="primary"
          endContent={<Unlock className="w-4 h-4" />}
          onPress={onAbrirOpen}
        >
          Abrir Caja
        </Button>

        <Modal isOpen={isAbrirOpen} onOpenChange={onAbrirChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Apertura de Caja</ModalHeader>
                <ModalBody>
                  <Input
                    label="Monto Inicial"
                    placeholder="0.00"
                    type="number"
                    value={montoInicial}
                    onValueChange={setMontoInicial}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">$</span>
                      </div>
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Ingrese el dinero en efectivo disponible al inicio del
                    turno.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" color="danger" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleAbrirCaja}
                    isLoading={isOpening}
                  >
                    Abrir Caja
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Entradas del dia */}
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp size={20} className="text-green-500" />
        Entradas del dia
      </h1>
      <div className="flex flex-row gap-4">
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Efectivo</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalEntradaEfectivo)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Cuenta Corriente
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalEntradaCtaCte)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Transferencia</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalEntradaTransf)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tarjeta</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalEntradaTarjeta)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Cheque</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalEntradaCheque)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Salidas del dia */}
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <TrendingDown size={20} className="text-red-500" />
        Salidas del dia
      </h1>
      <div className="flex flex-row gap-4">
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Efectivo</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalSalidaEfectivo)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Cuenta Corriente
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalSalidaCtaCte)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Transferencia</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalSalidaTransf)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tarjeta</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalSalidaTarjeta)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-none shadow-sm w-full">
          <CardBody className="flex flex-row items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Cheque</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatMoney(cajaActual.TotalSalidaCheque)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Movements Table Section */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} />
              Movimientos
            </h3>
            <Button
              size="sm"
              variant="flat"
              startContent={
                <RefreshCcw
                  size={16}
                  className={isFetching ? "animate-spin" : ""}
                />
              }
              onPress={() => refetch()}
            >
              Actualizar
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table
              aria-label="Movimientos de caja"
              removeWrapper
              classNames={{
                th: "bg-gray-50 text-gray-500 font-medium",
                td: "py-3",
              }}
            >
              <TableHeader>
                <TableColumn>FECHA</TableColumn>
                <TableColumn>DESCRIPCIÓN</TableColumn>
                <TableColumn>TIPO</TableColumn>
                <TableColumn align="end">MONTO</TableColumn>
                <TableColumn align="center">ACCIONES</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No hay movimientos registrados.">
                {movimientos.map((mov) => (
                  <TableRow key={mov.Id}>
                    <TableCell>{formatDate(mov.Fecha)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {mov.Descripcion}
                        </span>
                        {mov.Comprobante && (
                          <span className="text-xs text-gray-400">
                            Comp. #{mov.Comprobante.Numero}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA
                            ? "success"
                            : "danger"
                        }
                      >
                        {mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA
                          ? "Entrada"
                          : "Salida"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA ? "text-success" : "text-danger"}`}
                      >
                        {mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA
                          ? "+"
                          : "-"}
                        {formatMoney(mov.Monto)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {mov.ComprobanteId ? (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleViewTicket(mov.ComprobanteId)}
                        >
                          <Eye size={18} className="text-gray-500" />
                        </Button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Expenses Side Section */}
        <div className="w-full lg:w-[350px] flex flex-col gap-4">
          <div className="flex justify-between items-center ">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={20} className="text-rose-500" />
              Gastos
            </h3>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<Plus size={16} />}
              onPress={onGastoOpen}
            >
              Nuevo
            </Button>
          </div>

          <div className="flex flex-col gap-3 h-full">
            {gastos.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 h-full">
                <p className="text-sm">No hay gastos registrados</p>
              </div>
            ) : (
              gastos.map((g) => (
                <div
                  key={g.Id}
                  className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">{g.Descripcion}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-xs text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                        {g.ConceptoGastos?.Descripcion || "Gasto"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(g.Fecha)}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-rose-600">
                    -{formatMoney(g.Monto)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Nuevo Gasto */}
      <Modal isOpen={isGastoOpen} onOpenChange={onGastoChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Registrar Gasto</ModalHeader>
              <ModalBody>
                <div className="flex gap-2 items-end">
                  <Select
                    label="Concepto"
                    placeholder="Seleccione un concepto"
                    selectedKeys={
                      nuevoGasto.conceptoId ? [nuevoGasto.conceptoId] : []
                    }
                    onChange={(e) =>
                      setNuevoGasto({
                        ...nuevoGasto,
                        conceptoId: e.target.value,
                      })
                    }
                    className="flex-1"
                  >
                    {conceptosGasto?.map((c) => (
                      <SelectItem key={c.Id.toString()}>
                        {c.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                  <Button
                    isIconOnly
                    color="primary"
                    variant="flat"
                    onPress={onConceptoOpen}
                  >
                    <Plus size={20} />
                  </Button>
                </div>
                <Input
                  label="Descripción"
                  placeholder="Detalle del gasto"
                  value={nuevoGasto.descripcion}
                  onValueChange={(val) =>
                    setNuevoGasto({ ...nuevoGasto, descripcion: val })
                  }
                />
                <Input
                  label="Monto"
                  type="number"
                  placeholder="0.00"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                  value={nuevoGasto.monto}
                  onValueChange={(val) =>
                    setNuevoGasto({ ...nuevoGasto, monto: val })
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" color="danger" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleAgregarGasto}
                  isLoading={isAddingGasto}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Nuevo Concepto */}
      <Modal isOpen={isConceptoOpen} onOpenChange={onConceptoChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Nuevo Concepto de Gasto</ModalHeader>
              <ModalBody>
                <Input
                  label="Descripción"
                  placeholder="Ej: Limpieza, Insumos..."
                  value={nuevoConcepto}
                  onValueChange={setNuevoConcepto}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleAgregarConcepto}
                  isLoading={isAddingConcepto}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={isTicketOpen}
        onOpenChange={onTicketChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Detalle del Comprobante{" "}
                {selectedTicket ? `#${selectedTicket.Numero}` : ""}
              </ModalHeader>
              <ModalBody>
                {isLoadingTicket ? (
                  <div className="flex justify-center py-10">
                    <LoadingComponent message="Cargando comprobante..." />
                  </div>
                ) : selectedTicket ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                      <div>
                        <span className="text-gray-500">Fecha:</span>
                        <p className="font-medium">
                          {formatDate(selectedTicket.Fecha)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Cliente:</span>
                        <p className="font-medium text-capitalize">
                          {
                            // Handle various client relation paths or generic name
                            selectedTicket?.cliente?.Nombre
                              ? `${selectedTicket?.cliente?.Nombre} ${selectedTicket?.cliente?.Apellido}`
                              : "Consumidor Final"
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-bold text-lg">
                          {formatMoney(selectedTicket.Total)}
                        </p>
                      </div>
                    </div>

                    {/* Items / Lines */}
                    {selectedTicket.DetalleComprobante &&
                      selectedTicket.DetalleComprobante.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Items</h4>
                          <Table
                            aria-label="Items del comprobante"
                            removeWrapper
                            classNames={{ th: "text-xs", td: "text-xs py-1" }}
                          >
                            <TableHeader>
                              <TableColumn>CANT</TableColumn>
                              <TableColumn>DESCRIPCIÓN</TableColumn>
                              <TableColumn align="end">UNITARIO</TableColumn>
                              <TableColumn align="end">TOTAL</TableColumn>
                            </TableHeader>
                            <TableBody>
                              {selectedTicket.DetalleComprobante.map(
                                (item: any) => (
                                  <TableRow key={item.Id}>
                                    <TableCell>{item.Cantidad}</TableCell>
                                    <TableCell>{item.Descripcion}</TableCell>
                                    <TableCell>
                                      {formatMoney(item.Precio)}
                                    </TableCell>
                                    <TableCell>
                                      {formatMoney(item.SubTotal)}
                                    </TableCell>
                                  </TableRow>
                                ),
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                    {/* Payments */}
                    {selectedTicket.FormaPago &&
                      selectedTicket.FormaPago.length > 0 && (
                        <div className="mt-2">
                          <h4 className="font-semibold mb-2">Formas de Pago</h4>
                          <div className="flex flex-col gap-2">
                            {selectedTicket.FormaPago.map((fp: any) => (
                              <div
                                key={fp.Id}
                                className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 pb-1 last:border-0"
                              >
                                <span className="text-gray-600">
                                  {Object.keys(TIPO_PAGO).find(
                                    (key) =>
                                      TIPO_PAGO[
                                        key as keyof typeof TIPO_PAGO
                                      ] === fp.TipoPago,
                                  ) || "Otro"}
                                </span>
                                <span className="font-medium">
                                  {formatMoney(fp.Monto)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    No se encontró información del comprobante.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="flat" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
