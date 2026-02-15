"use client";

import React, { useState } from "react";
import {
  NumberInput,
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
import { RefreshCcw, CreditCard, Banknote, Wallet } from "lucide-react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import { LoadingComponent } from "../loading/loading";
import { useCtaCte, ClienteCtaCte } from "@/hooks/useCtaCte";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency, getCurrencyFormatOptions } from "@/lib/utils/formatCurrency";

export default function CuentasCorrientesCRUD() {
  const currency = useCurrency();
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
  const [amount, setAmount] = useState<number>(0);
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
    setAmount(0);
    setPaymentMethod(String(TIPO_PAGO.EFECTIVO));
    onPaymentOpen();
  };

  const handleSavePayment = async () => {
    if (!selectedClient || amount <= 0) return;

    const montoNumber = amount;
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
        <div className=" group flex justify-between items-center gap-2 border-2 border-gray-300 rounded-xl p-1.5 bg-white transition-all duration-300 hover:border-[#67afc3] relative sm:w-auto w-[200px] h-[40px] overflow-hidden">
          <input
            placeholder={`Nombre, apellido o DNI`}
            className="outline-none pl-2 w-full bg-transparent text-gray-700 placeholder:text-gray-400 truncate"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            aria-label="Buscar en la tabla"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5 text-gray-500 transition-all duration-300 group-hover:text-[#67afc3] group-hover:scale-105 group-active:scale-95 group-focus:outline-none group-focus:ring-2 group-focus:ring-[#67afc3] group-focus:ring-offset-2"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Botón de actualizar */}
        <button
          className="p-2 rounded-lg border border-gray-300 bg-[#67afc3]/90 hover:bg-[#67afc3] hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 cursor-pointer w-[36px] h-[36px] aspect-square"
          title="Actualizar datos"
          aria-label="Actualizar datos de la tabla"
          onClick={handleSearch}
        >
          <RefreshCcw
            size={18}
            className={`text-white transition-transform ${
              isLoadingClients ? "animate-spin" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </section>

      {selectedClient && (
        <Card>
          <CardBody className="flex flex-row justify-between items-center gap-4">
            <User
              name={`${selectedClient.Nombre} ${selectedClient.Apellido}`}
              description={`DNI: ${selectedClient.Dni || "N/A"}`}
              avatarProps={{
                src: "",
                name:
                  (selectedClient.Nombre?.[0] || "") +
                  (selectedClient.Apellido?.[0] || ""),
              }}
            />
            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-500">Saldo Actual</span>
              <span
                className={`text-xl font-bold ${
                  (movements[movements.length - 1]?.saldo || 0) > 0
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {formatCurrency(movements[movements.length - 1]?.saldo || 0, currency)}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex-1 overflow-auto rounded-xl shadow-sm bg-white">
        <Table
          aria-label="Tabla de cuenta corriente"
          className="bg-white rounded-lg border-none"
          classNames={{
            wrapper:
              "bg-white h-full shadow-none rounded-xl border-none sm:p-4 p-1",
            th: "bg-[#67afc3]/90 text-white transition-colors duration-200 text-[13px] font-medium hover:!text-white hover:[&_*]:!text-white group",
            base: "bg-transparent h-full shadow-none rounded-xl border-none",
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
                    variant="flat"
                    color={item.debe > 0 ? "warning" : "success"}
                  >
                    {item.tipo}
                  </Chip>
                </TableCell>
                <TableCell>{item.detalles}</TableCell>
                <TableCell className="text-danger font-medium">
                  {item.debe > 0 ? formatCurrency(item.debe, currency) : "-"}
                </TableCell>
                <TableCell className="text-success font-medium">
                  {item.haber > 0 ? formatCurrency(item.haber, currency) : "-"}
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(item.saldo, currency)}
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
                        <User
                          name={`${client.Nombre} ${client.Apellido}`}
                          description={
                            <div className="flex gap-2">
                              <span>DNI: {client.Dni || "N/A"}</span>
                              {client.Mail && <span>• {client.Mail}</span>}
                            </div>
                          }
                          avatarProps={{
                            name:
                              (client.Nombre?.[0] || "") +
                              (client.Apellido?.[0] || ""),
                          }}
                        />
                        <Button size="sm" color="primary" variant="flat">
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
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Registrar Nuevo Pago
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <NumberInput
                      autoFocus
                      label="Monto a pagar"
                      placeholder="0,00"
                      value={amount}
                      onValueChange={(v) => setAmount(v)}
                      minValue={0}
                      formatOptions={getCurrencyFormatOptions(currency)}
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
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSavePayment}
                  isLoading={isRegistrandoPago}
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
