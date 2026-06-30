"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  useDisclosure,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { RefreshCcw, CreditCard, Banknote, Wallet } from "lucide-react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import { LoadingComponent } from "../loading/loading";
import { useCtaCte, ClienteCtaCte, MovimientoCtaCte } from "@/hooks/useCtaCte";
import GenericTable, { Column } from "@/components/shared/GenericTable";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";

export default function CuentasCorrientesCRUD() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  // Auto-seleccionar cliente si viene desde la página de clientes
  useEffect(() => {
    const clienteIdParam = searchParams?.get("clienteId");
    const nombreParam = searchParams?.get("nombre");
    const dniParam = searchParams?.get("dni");
    if (clienteIdParam && nombreParam) {
      const [nombre, ...apellidoParts] = nombreParam.split(" ");
      const apellido = apellidoParts.join(" ");

      // Bloquear acceso al consumidor final
      if (
        nombre === consumidorFinalSchema.Nombre &&
        apellido === consumidorFinalSchema.Apellido
      ) {
        router.replace("/clientes");
        return;
      }

      setSelectedClient({
        Id: Number(clienteIdParam),
        Nombre: nombre,
        Apellido: apellido,
        Dni: dniParam ?? "",
        Mail: "",
      });
      setQuery(nombreParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const {
    data: movementsData,
    isLoading: isLoadingMovements,
    refetch: refetchMovements,
  } = useMovimientosCliente(selectedClient?.Id);
  const movements = movementsData || [];
  const reversedMovements = [...movements].reverse();

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
    setQuery(`${client.Nombre} ${client.Apellido}`);
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

  React.useEffect(() => {
    // Escucha teclado adicional si hiciera falta, actualmente manejado en el form principal
  }, []);

  const baseColumns: Column[] = [
    { uid: "fecha", name: "FECHA", align: "start" },
    { uid: "tipo", name: "TIPO", align: "start" },
    { uid: "detalles", name: "DETALLES", align: "start" },
    { uid: "debe", name: "DEBE", align: "center" },
    { uid: "haber", name: "HABER", align: "center" },
    { uid: "saldo", name: "SALDO", align: "center" },
  ];

  const renderTableCell = (item: MovimientoCtaCte, columnKey: React.Key) => {
    switch (columnKey) {
      case "fecha":
        return (
          <span className="whitespace-nowrap text-sm font-medium text-slate-700">
            {formatDate(item.fecha)}
          </span>
        );
      case "tipo":
        return (
          <Chip
            size="sm"
            className={
              item.debe > 0
                ? "bg-rose-100/50 text-rose-600 font-bold border border-rose-200/50 text-[10px]"
                : "bg-emerald-100/50 text-emerald-600 font-bold border border-emerald-200/50 text-[10px]"
            }
          >
            {item.tipo}
          </Chip>
        );
      case "detalles":
        return (
          <span
            className="whitespace-nowrap max-w-[200px] truncate block text-sm font-medium text-slate-700"
            title={item.detalles}
          >
            {item.detalles}
          </span>
        );
      case "debe":
        return (
          <span className="text-rose-500 font-semibold text-xs sm:text-sm">
            {item.debe > 0 ? formatCurrency(item.debe) : "-"}
          </span>
        );
      case "haber":
        return (
          <span className="text-emerald-500 font-semibold text-xs sm:text-sm">
            {item.haber > 0 ? formatCurrency(item.haber) : "-"}
          </span>
        );
      case "saldo":
        return (
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
            {formatCurrency(item.saldo)}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex-1 relative flex flex-col gap-4">
      <div
        className="flex-1 flex flex-col min-h-0 w-full px-0 sm:px-4 pb-4 focus:outline-none focus:ring-0"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        }}
      >
        <GenericTable
          data={reversedMovements.map((m) => ({ ...m, Id: m.id }))}
          columns={baseColumns}
          defaultVisibleUidsMobile={["debe", "haber", "saldo"]}
          renderCell={renderTableCell as any}
          isLoading={isLoadingMovements}
          isError={false}
          emptyText="Sin movimientos registrados"
          search={query}
          onSearchChange={(val) => {
            setQuery(val);
            if (selectedClient) setSelectedClient(null);
          }}
          searchPlaceholder="Buscar por nombre o DNI (Presione Entrar)..."
          page={1}
          onPageChange={() => {}}
          paginationMeta={{
            totalPages: 1,
            limit: 1000,
            total: reversedMovements.length,
            page: 1,
          }}
          onRefresh={selectedClient ? () => refetchMovements() : handleSearch}
          isRefreshing={selectedClient ? isLoadingMovements : isLoadingClients}
          onNewClick={selectedClient ? handleNewPago : undefined}
          newButtonText="Nuevo Pago"
        />
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
          closeButton:
            "hover:bg-slate-100 active:bg-slate-200 text-slate-400 mt-2 mr-2",
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
                <Button
                  variant="light"
                  onPress={onClose}
                  className="font-medium text-slate-500 hover:bg-slate-100 h-11 px-5 rounded-[10px]"
                >
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
