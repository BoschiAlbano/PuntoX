"use client";

import React, { useState } from "react";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  useDisclosure,
  Card,
  CardBody,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { RefreshCcw, CreditCard, Banknote, Wallet, Search } from "lucide-react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import { LoadingComponent } from "../loading/loading";
import { useCtaCte, ClienteCtaCte } from "@/hooks/useCtaCte";

export default function CuentasCorrientesCRUD() {
  const {
    useBuscarClientes,
    useMovimientosCliente,
    registrarPago,
    isRegistrandoPago,
  } = useCtaCte();

  const [query, setQuery] = useState("");
  const {
    data: clientsData,
    refetch: searchClients,
    isLoading: isLoadingClients,
  } = useBuscarClientes(query);
  const clients = clientsData || [];

  const [selectedClient, setSelectedClient] = useState<ClienteCtaCte | null>(
    null,
  );
  const { data: movementsData, isLoading: isLoadingMovements } =
    useMovimientosCliente(selectedClient?.Id);
  const movements = movementsData || [];

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Payment Modal State
  const {
    isOpen: isPaymentOpen,
    onOpen: onPaymentOpen,
    onOpenChange: onPaymentOpenChange,
  } = useDisclosure();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(
    String(TIPO_PAGO.EFECTIVO),
  );

  const handleSearch = async () => {
    if (!query) return;
    const { data } = await searchClients();
    if (data) {
      onOpen();
    }
  };

  const handleSelectClient = (client: ClienteCtaCte) => {
    setSelectedClient(client);
    onOpenChange();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNewPago = () => {
    setAmount("");
    setPaymentMethod(String(TIPO_PAGO.EFECTIVO));
    onPaymentOpen();
  };

  const handleSavePayment = async () => {
    if (!selectedClient || !amount) return;

    const montoNumber = parseFloat(amount);
    if (isNaN(montoNumber) || montoNumber <= 0) {
      addToast({
        title: "Error",
        description: "Por favor ingrese un monto válido",
        color: "danger",
      });
      return;
    }

    try {
      await registrarPago({
        clienteId: selectedClient.Id,
        monto: montoNumber,
        formasPago: [
          {
            tipoPago: Number(paymentMethod),
            monto: montoNumber,
          },
        ],
      });

      addToast({
        title: "Éxito",
        description: "Pago registrado exitosamente",
        color: "success",
      });
      onPaymentOpenChange(); // Close modal
    } catch (error: any) {
      console.error("Error registering payment:", error);
      addToast({
        title: "Error",
        description: error.message || "Error al registrar el pago",
        color: "danger",
      });
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col gap-4">
      <section className="w-full flex items-center sm:justify-end justify-start gap-2 sm:px-4 px-1">
        {/* Botón de Nuevo Pago */}
        <button
          onClick={handleNewPago}
          className=" px-4 h-[36px] rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-white cursor-pointer"
          aria-label="Nuevo Pago"
          disabled={!selectedClient}
        >
          Nuevo Pago
        </button>

        {/* Search */}
        <div className="group flex justify-between items-center gap-2 border border-slate-200 focus-within:border-[#67afc3]/40! rounded-xl p-1.5 bg-white transition-all shadow-sm hover:shadow relative sm:w-[300px] w-full h-11 overflow-hidden">
          <Search className="w-4 h-4 text-slate-400 ml-2 group-focus-within:text-[#67afc3] transition-colors" />
          <input
            placeholder="Buscar por nombre, DNI..."
            className="flex-1 outline-none min-w-0 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            aria-label="Buscar en la tabla"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#67afc3]/40 transition-all shadow-sm group disabled:opacity-50"
            title="Actualizar datos"
            aria-label="Actualizar datos de la tabla"
            onClick={handleSearch}
            disabled={isLoadingClients}
          >
            <RefreshCcw
              size={18}
              strokeWidth={2.5}
              className={`text-slate-500 group-hover:text-[#67afc3] transition-colors ${
                isLoadingClients ? "animate-spin text-[#67afc3]" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          
          <button
            onClick={handleNewPago}
            className="px-4 h-11 rounded-xl bg-[#67afc3] hover:bg-[#5a9db0] transition-colors disabled:opacity-50 hover:shadow shadow-sm disabled:shadow-none text-white font-semibold cursor-pointer shrink-0"
            aria-label="Nuevo Pago"
            disabled={!selectedClient}
          >
            Nuevo Pago
          </button>
        </div>
      </section>

      {selectedClient && (
        <Card className="bg-linear-to-r from-slate-50 to-white border border-slate-100 shadow-sm rounded-2xl mx-1 sm:mx-4">
          <CardBody className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {selectedClient.Nombre?.[0] || ""}
                {selectedClient.Apellido?.[0] || ""}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedClient.Nombre} {selectedClient.Apellido}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  DNI: {selectedClient.Dni || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end bg-white border border-slate-100 rounded-xl px-4 py-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Saldo Actual</span>
              <span
                className={`text-xl font-bold ${
                  (movements[movements.length - 1]?.saldo || 0) > 0
                    ? "text-red-500"
                    : "text-emerald-500"
                }`}
              >
                {formatCurrency(movements[movements.length - 1]?.saldo || 0)}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex-1 overflow-auto rounded-2xl border border-slate-100 shadow-sm bg-white mx-1 sm:mx-4 mb-4">
        <Table
          aria-label="Tabla de cuenta corriente"
          className="bg-white rounded-lg border-none"
          classNames={{
            wrapper:
              "bg-white h-full shadow-none rounded-2xl border-none sm:p-4 p-2",
            th: "bg-slate-50 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider h-11",
            base: "bg-transparent h-full shadow-none",
            td: "py-3.5 text-sm font-medium text-slate-600 border-b border-slate-50 last:border-none",
          }}
        >
          <TableHeader>
            <TableColumn>FECHA</TableColumn>
            <TableColumn>TIPO</TableColumn>
            <TableColumn>DETALLES</TableColumn>
            <TableColumn align="end">DEBE</TableColumn>
            <TableColumn align="end">HABER</TableColumn>
            <TableColumn align="end">SALDO</TableColumn>
          </TableHeader>
          <TableBody
            items={movements}
            isLoading={isLoadingMovements}
            loadingContent={
              <LoadingComponent message="Cargando movimientos..." />
            }
            emptyContent={"Sin movimientos registrados"}
          >
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.fecha)}</TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    className={
                      item.debe > 0
                        ? "bg-amber-100/50 text-amber-600 font-bold"
                        : "bg-emerald-100/50 text-emerald-600 font-bold"
                    }
                  >
                    {item.tipo}
                  </Chip>
                </TableCell>
                <TableCell>{item.detalles}</TableCell>
                <TableCell className="text-danger font-medium">
                  {item.debe > 0 ? formatCurrency(item.debe) : "-"}
                </TableCell>
                <TableCell className="text-success font-medium">
                  {item.haber > 0 ? formatCurrency(item.haber) : "-"}
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(item.saldo)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Seleccionar Cliente</ModalHeader>
              <ModalBody>
                {clients.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No se encontraron clientes.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                    {clients.map((client) => (
                      <div
                        key={client.Id}
                        className="flex justify-between items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border-b last:border-0"
                        onClick={() => {
                          handleSelectClient(client);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                            {client.Nombre?.[0] || ""}
                            {client.Apellido?.[0] || ""}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800 tracking-tight">
                              {client.Nombre} {client.Apellido}
                            </p>
                            <div className="flex gap-2 text-xs font-medium text-slate-500">
                              <span>DNI: {client.Dni || "N/A"}</span>
                              {client.Mail && <span>• {client.Mail}</span>}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" className="bg-slate-100 text-slate-600 font-semibold group-hover:bg-[#67afc3] group-hover:text-white transition-all shadow-sm">
                          Seleccionar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onOpenChange={onPaymentOpenChange}
        placement="center"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md",
          base: "font-sans bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-white/60 max-w-md",
          header: "border-b border-slate-100/60 pb-4 pt-6 px-6 sm:px-8",
          body: "py-6 px-6 sm:px-8",
          footer: "border-t border-slate-100/60 py-4 px-6 sm:px-8",
          closeButton: "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
               <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 shadow-sm">
                    <Banknote className="w-5 h-5 text-[#67afc3]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                      Registrar Pago
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Ingresa el monto a cobrar
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Monto a pagar
                    </label>
                    <Input
                      autoFocus
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onValueChange={setAmount}
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">$</span>
                        </div>
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Forma de Pago
                    </label>
                    <Select
                      selectedKeys={[paymentMethod]}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disallowEmptySelection
                      placeholder="Seleccione forma de pago"
                    >
                      <SelectItem
                        key={String(TIPO_PAGO.EFECTIVO)}
                        startContent={<Banknote size={18} />}
                      >
                        Efectivo
                      </SelectItem>
                      <SelectItem
                        key={String(TIPO_PAGO.TARJETA)}
                        startContent={<CreditCard size={18} />}
                      >
                        Tarjeta
                      </SelectItem>
                      <SelectItem
                        key={String(TIPO_PAGO.CHEQUE)}
                        startContent={<Wallet size={18} />}
                      >
                        Cheque
                      </SelectItem>
                      <SelectItem
                        key={String(TIPO_PAGO.TRANSFERENCIA)}
                        startContent={<RefreshCcw size={18} />}
                      >
                        Transferencia
                      </SelectItem>
                    </Select>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} className="font-medium text-slate-500 hover:bg-slate-100 h-11 px-5 rounded-[10px]">
                  Cancelar
                </Button>
                <Button
                  onPress={handleSavePayment}
                  isLoading={isRegistrandoPago}
                  className="bg-[#67afc3] hover:bg-[#5a9db0] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-all"
                >
                  Registrar Pago
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
