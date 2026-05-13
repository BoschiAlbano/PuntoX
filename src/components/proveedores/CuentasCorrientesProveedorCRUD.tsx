"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Card,
  CardBody,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { RefreshCcw, CreditCard, Banknote, Wallet } from "lucide-react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";
import {
  useCtaCteProveedor,
  ProveedorCtaCte,
  MovimientoCtaCteProveedor,
} from "@/hooks/useCtaCteProveedor";
import GenericTable, { Column } from "@/components/shared/GenericTable";

export default function CuentasCorrientesProveedorCRUD() {
  const searchParams = useSearchParams();
  const {
    useBuscarProveedores,
    useMovimientosProveedor,
    registrarPago,
    isRegistrandoPago,
  } = useCtaCteProveedor();

  const [query, setQuery] = useState("");
  const {
    data: proveedoresData,
    refetch: searchProveedores,
    isLoading: isLoadingProveedores,
  } = useBuscarProveedores(query);
  const proveedores = proveedoresData || [];

  const [selectedProveedor, setSelectedProveedor] =
    useState<ProveedorCtaCte | null>(null);

  // Auto-seleccionar proveedor si viene desde la página de proveedores
  useEffect(() => {
    const proveedorIdParam = searchParams.get("proveedorId");
    const nombreParam = searchParams.get("nombre");
    const cuitParam = searchParams.get("cuit");
    if (proveedorIdParam && nombreParam) {
      setSelectedProveedor({
        Id: Number(proveedorIdParam),
        RazonSocial: nombreParam,
        CUIT: cuitParam ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: movementsData, isLoading: isLoadingMovements } =
    useMovimientosProveedor(selectedProveedor?.Id);
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
    const { data } = await searchProveedores();
    if (data) {
      onOpen();
    }
  };

  const handleSelectProveedor = (proveedor: ProveedorCtaCte) => {
    setSelectedProveedor(proveedor);
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
    if (!selectedProveedor || !amount) return;

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
        proveedorId: selectedProveedor.Id,
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
        description: "Pago a proveedor registrado",
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

  const baseColumns: Column[] = [
    { uid: "fecha", name: "FECHA", align: "start" },
    { uid: "tipo", name: "TIPO", align: "start" },
    { uid: "detalles", name: "DETALLES", align: "start" },
    { uid: "debe", name: "AUMENTA DEUDA", align: "center" },
    { uid: "haber", name: "PAGOS", align: "center" },
    { uid: "saldo", name: "SALDO (A PAGAR)", align: "center" },
  ];

  const renderTableCell = (
    item: MovimientoCtaCteProveedor,
    columnKey: React.Key,
  ) => {
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
      {selectedProveedor && (
        <Card className="bg-white border border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-xl sm:rounded-2xl mx-1 sm:mx-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 sm:w-1.5 h-full bg-linear-to-b from-[#67afc3] to-[#2dd4bf]" />
          <CardBody className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-6 py-3 sm:py-5 px-3 sm:px-6">
            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/30 flex items-center justify-center font-bold text-base sm:text-xl text-[#67afc3] shadow-sm shrink-0">
                {selectedProveedor.RazonSocial?.[0] || ""}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight truncate leading-tight">
                  {selectedProveedor.RazonSocial}
                </h3>
                <p className="text-[11px] sm:text-sm font-medium text-slate-500 mt-[1px] truncate">
                  CUIT: {selectedProveedor.CUIT || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end bg-slate-50 sm:bg-transparent border border-slate-200/60 sm:border-transparent rounded-lg sm:rounded-xl px-3 py-2 sm:p-0 w-full sm:w-auto">
              <span className="text-[9px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-500 sm:mb-0.5">
                Deuda Total
              </span>
              <span
                className={`text-lg sm:text-2xl font-extrabold ${
                  (movements[movements.length - 1]?.saldo || 0) > 0
                    ? "text-rose-500"
                    : "text-emerald-500"
                }`}
              >
                {formatCurrency(movements[movements.length - 1]?.saldo || 0)}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      <div
        className="flex-1 flex flex-col min-h-0 w-full px-1 sm:px-4 pb-4 focus:outline-none focus:ring-0"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        }}
      >
        <GenericTable
          data={movements.map((m) => ({ ...m, Id: m.id }))}
          columns={baseColumns}
          defaultVisibleUidsMobile={["debe", "haber", "saldo"]}
          renderCell={renderTableCell as any}
          isLoading={isLoadingMovements}
          isError={false}
          emptyText="Sin movimientos registrados"
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por Razón Social o CUIT (Presione Entrar)..."
          page={1}
          onPageChange={() => {}}
          paginationMeta={{
            totalPages: 1,
            limit: 1000,
            total: movements.length,
            page: 1,
          }}
          onRefresh={handleSearch}
          isRefreshing={isLoadingProveedores}
          onNewClick={selectedProveedor ? handleNewPago : undefined}
          newButtonText="Pagar Cta. Cte."
        />
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Seleccionar Proveedor</ModalHeader>
              <ModalBody>
                {proveedores.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No se encontraron proveedores.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                    {proveedores.map((prov) => (
                      <div
                        key={prov.Id}
                        className="flex justify-between items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border-b last:border-0"
                        onClick={() => {
                          handleSelectProveedor(prov);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                            {prov.RazonSocial?.[0] || ""}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800 tracking-tight">
                              {prov.RazonSocial}
                            </p>
                            <div className="flex gap-2 text-xs font-medium text-slate-500">
                              <span>CUIT: {prov.CUIT || "N/A"}</span>
                              {prov.Mail && <span>• {prov.Mail}</span>}
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
                      Entregar Pago a Proveedor
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Ingresa el monto a pagar para saldar deuda
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
                      placeholder="Seleccione forma de pago (Ej: Efectivo, Transf, Cheque)"
                    >
                      <SelectItem
                        key={String(TIPO_PAGO.EFECTIVO)}
                        startContent={<Banknote size={18} />}
                      >
                        Efectivo
                      </SelectItem>
                      <SelectItem
                        key={String(TIPO_PAGO.TRANSFERENCIA)}
                        startContent={<RefreshCcw size={18} />}
                      >
                        Transferencia
                      </SelectItem>
                      <SelectItem
                        key={String(TIPO_PAGO.CHEQUE)}
                        startContent={<Wallet size={18} />}
                      >
                        Cheque
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
                  Registrar Pago Saliente
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
