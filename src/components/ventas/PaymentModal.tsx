"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import { Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { TIPO_PAGO } from "@/lib/constants/comprobantes";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (pagos: any[]) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  onConfirm,
}: PaymentModalProps) {
  const [pagos, setPagos] = useState<{ tipoPago: number; monto: number }[]>([]);
  const [currentTipo, setCurrentTipo] = useState<number>(TIPO_PAGO.EFECTIVO);
  const [currentMonto, setCurrentMonto] = useState<string>("");

  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const restante = total - totalPagado;

  useEffect(() => {
    if (isOpen) {
      setPagos([]);
      setCurrentTipo(TIPO_PAGO.EFECTIVO);
      setCurrentMonto(total.toFixed(2));
    }
  }, [isOpen, total]);

  // Update default amount when payments change to match remaining
  useEffect(() => {
    if (restante > 0) {
      setCurrentMonto(restante.toFixed(2));
    } else {
      setCurrentMonto("");
    }
  }, [totalPagado, restante]);

  const handleAddPayment = () => {
    const montoVal = parseFloat(currentMonto);
    if (isNaN(montoVal) || montoVal <= 0) return;

    if (montoVal > restante + 0.01) {
      // Allow slight tolerance or warn? Let's just warn or cap?
      // For now, allow but maybe show warning?
      // Actually user might want to pay more (change).
      // In POS systems, change is common only for Cash.
      // Let's allow it but the API logic might complain if total doesn't match EXACTLY.
      // step 19: if (Math.abs(totalFormasPago - total) > 0.01) error.
      // So we must ensure it matches exactly or we handle "change" (vuelto).
      // For now, let's just add it.
    }

    setPagos([...pagos, { tipoPago: currentTipo, monto: montoVal }]);
    // Reset inputs done by effect
  };

  const handleRemovePayment = (index: number) => {
    const newPagos = [...pagos];
    newPagos.splice(index, 1);
    setPagos(newPagos);
  };

  const isComplete = Math.abs(restante) < 0.01;
  const isError = restante < -0.01; // Paid too much?
  // If paid too much in CASH, it is "Change". Ideally we record the full payment and the system calculates change?
  // OR we record the payment As Is = Total.
  // The API validation expects exact match.
  // IF Cash > Total, we should probably just record Item.Monto = Total?
  // User interface usually shows: Total 100, Paid 120 (Cash), Change 20.
  // The API `FormaPago` table has `Monto`. If we send 120, and total was 100, API rejects.
  // We should send 100 for the API, but UI shows 120.
  // To keep it simple: Validate that Sum == Total. If user enters more, we show "Vuelto".
  // AND we automatically adjust the entry added to the list to match the remaining if it's the last one?
  // Let's trust the user to match it for now, or auto-cap?

  // Better UX: Show "Vuelto" if overpaid.
  // But for the OnConfirm, we must send normalized payments.

  const handleConfirm = () => {
    if (!isComplete && !isError) return;

    const finalPagos = [...pagos];

    // Handling overpayment (Change)
    if (isError) {
      // Find cash payment to reduce? Or just reject?
      // Simple approach: normalize payments to total?
      // No, let user fix it.
      return;
    }

    onConfirm(finalPagos);
  };

  const getTipoLabel = (tipo: number) => {
    switch (tipo) {
      case TIPO_PAGO.EFECTIVO:
        return "Efectivo";
      case TIPO_PAGO.TARJETA:
        return "Tarjeta";
      case TIPO_PAGO.CHEQUE:
        return "Cheque";
      case TIPO_PAGO.CUENTA_CORRIENTE:
        return "Cta. Corriente";
      case TIPO_PAGO.TRANSFERENCIA:
        return "Transferencia";
      default:
        return "Otro";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Confirmar Pago
        </ModalHeader>
        <ModalBody>
          <div className="flex justify-between items-center mb-4 p-4 bg-default-100 rounded-lg">
            <div className="flex flex-col">
              <span className="text-small text-default-500">Total a Pagar</span>
              <span className="text-2xl font-bold text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-small text-default-500">Restante</span>
              <span
                className={`text-2xl font-bold ${
                  restante > 0.01
                    ? "text-warning"
                    : restante < -0.01
                    ? "text-success"
                    : "text-success"
                }`}
              >
                ${Math.abs(restante).toFixed(2)}
                {restante < -0.01 && (
                  <span className="text-xs text-default-500 block">
                    {" "}
                    (Vuelto)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Add Payment Form */}
          <div className="flex gap-2 items-end mb-4">
            <Select
              label="Método"
              selectedKeys={[currentTipo.toString()]}
              onChange={(e) => setCurrentTipo(Number(e.target.value))}
              className="w-1/2"
              size="sm"
            >
              <SelectItem key={TIPO_PAGO.EFECTIVO} textValue="Efectivo">
                Efectivo
              </SelectItem>
              <SelectItem key={TIPO_PAGO.TARJETA} textValue="Tarjeta">
                Tarjeta
              </SelectItem>
              <SelectItem
                key={TIPO_PAGO.TRANSFERENCIA}
                textValue="Transferencia"
              >
                Transferencia
              </SelectItem>
              <SelectItem key={TIPO_PAGO.CHEQUE} textValue="Cheque">
                Cheque
              </SelectItem>
              <SelectItem
                key={TIPO_PAGO.CUENTA_CORRIENTE}
                textValue="Cta. Corriente"
              >
                Cta. Corriente
              </SelectItem>
            </Select>
            <Input
              label="Monto"
              type="number"
              value={currentMonto}
              onValueChange={setCurrentMonto}
              startContent="$"
              className="w-1/3"
              size="sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPayment();
              }}
            />
            <Button isIconOnly color="primary" onPress={handleAddPayment}>
              <Plus />
            </Button>
          </div>

          {/* Payment List */}
          <Table
            aria-label="Pagos agregados"
            removeWrapper
            classNames={{ th: "bg-transparent", td: "py-2" }}
          >
            <TableHeader>
              <TableColumn>MÉTODO</TableColumn>
              <TableColumn align="end">MONTO</TableColumn>
              <TableColumn align="end" width={50}>
                ACCIÓN
              </TableColumn>
            </TableHeader>
            <TableBody emptyContent="Agrega un pago para completar la venta.">
              {pagos.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell>{getTipoLabel(p.tipoPago)}</TableCell>
                  <TableCell>${p.monto.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      isIconOnly
                      color="danger"
                      variant="light"
                      onPress={() => handleRemovePayment(idx)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Error / Success Message */}
          {restante > 0.01 && (
            <div className="flex items-center gap-2 text-warning text-sm mt-2">
              <AlertCircle size={16} /> Faltan ${restante.toFixed(2)} para
              completar el pago.
            </div>
          )}

          {restante < -0.01 && (
            <div className="flex items-center gap-2 text-success text-sm mt-2">
              <CheckCircle2 size={16} /> Pago excedido. Vuelto: $
              {Math.abs(restante).toFixed(2)}
              <br />
              <span className="text-xs text-default-500">
                Nota: Ajuste el monto de efectivo para finalizar.
              </span>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" color="danger" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="success"
            onPress={handleConfirm}
            isDisabled={Math.abs(restante) > 0.01}
            className="font-bold text-white"
          >
            FINALIZAR VENTA
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
