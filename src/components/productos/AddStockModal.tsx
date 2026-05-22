import { modalMotionProps } from "@/lib/motionConfig";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import { Package, X, TrendingUp, Minus, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Produto } from "@/lib/validations/producto.schema";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Produto | null;
  onConfirm: (quantity: number) => Promise<void>;
}

const isPesoProduct = (product: Produto | null) =>
  product?.TipoVenta?.toUpperCase() === "PESO";

export default function AddStockModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: AddStockModalProps) {
  const isPeso = isPesoProduct(product);

  // Valor inicial según tipo: 0.001 para PESO, 1 para UNIDAD
  const initialQty = isPeso ? 0.001 : 1;
  const initialDisplay = isPeso ? "0.001" : "1";

  const [quantity, setQuantity] = useState(initialQty);
  const [localValue, setLocalValue] = useState(initialDisplay);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset al abrir — el producto puede cambiar entre aperturas
  useEffect(() => {
    if (isOpen) {
      const qty = isPesoProduct(product) ? 0.001 : 1;
      setQuantity(qty);
      setLocalValue(isPesoProduct(product) ? "0.001" : "1");
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, product]);

  // Sincronizar display cuando los botones +/- modifican `quantity`
  useEffect(() => {
    const parsed = parseFloat(localValue.replace(",", "."));
    if (parsed === quantity) return;
    setLocalValue(isPeso ? quantity.toFixed(3) : String(quantity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Permitir solo dígitos + un separador decimal (coma o punto)
    const clean = raw.replace(/[^0-9.,]/g, "");
    const sepIdx = clean.search(/[.,]/);
    let filtered =
      sepIdx === -1
        ? clean
        : clean.slice(0, sepIdx + 1) + clean.slice(sepIdx + 1).replace(/[.,]/g, "");

    // Para PESO: limitar a 3 decimales después del separador
    if (isPeso && sepIdx !== -1) {
      const [integer, decimal] = filtered.split(/[.,]/);
      const sep = filtered[sepIdx];
      filtered = integer + sep + (decimal ?? "").slice(0, 3);
    }

    setLocalValue(filtered);

    const num = parseFloat(filtered.replace(",", "."));
    setQuantity(isNaN(num) ? 0 : num);
  };

  const handleMinus = () => {
    const step = isPeso ? 0.001 : 1;
    const next = Math.max(isPeso ? 0.001 : 1, parseFloat((quantity - step).toFixed(3)));
    setQuantity(next);
  };

  const handlePlus = () => {
    const step = isPeso ? 0.001 : 1;
    const next = parseFloat((quantity + step).toFixed(3));
    setQuantity(next);
  };

  const handleConfirm = async () => {
    const finalQty = isPeso
      ? parseFloat(quantity.toFixed(3))
      : Math.round(quantity);

    if (!isFinite(finalQty) || finalQty <= 0) {
      addToast({
        title: "Cantidad inválida",
        description: isPeso
          ? "Ingresá una cantidad mayor a 0 (ej: 1.540 o 1,540)"
          : "Ingresá una cantidad entera mayor a 0",
        color: "danger",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(finalQty);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      isDismissable={!isLoading}
      motionProps={modalMotionProps}
      classNames={{
        backdrop: "bg-slate-900/60 backdrop-blur-sm",
        wrapper: "items-end sm:items-center",
        base: "font-sans bg-white shadow-2xl border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl w-full sm:max-w-[420px] m-0 sm:m-auto",
      }}
    >
      <ModalContent>
        {/* ── Header ── */}
        <ModalHeader className="flex items-center gap-3 py-4 px-5 border-b border-slate-100">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#67afc3" }}
          >
            <Package size={17} className="text-white" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-base font-bold text-slate-800 leading-tight">
              Agregar Stock
            </span>
            <span className="text-xs text-slate-400 font-normal truncate">
              {product?.Descripcion || "Producto"}
            </span>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl shrink-0"
          >
            <X size={16} />
          </Button>
        </ModalHeader>

        {/* ── Body ── */}
        <ModalBody className="px-5 py-5 space-y-4">
          {/* Stock actual */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-400" />
              <span className="text-sm text-slate-500">Stock actual</span>
            </div>
            <span className="text-lg font-bold text-slate-800">
              {product?.Stock ?? 0}
            </span>
          </div>

          {/* Input +/- */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 px-1">
              {isPeso ? "Cantidad a sumar (kg)" : "Cantidad a sumar (unidades)"}
            </label>

            <div className="flex flex-row items-center border border-slate-200 rounded-xl overflow-hidden h-11 bg-white focus-within:border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20 transition-colors">
              {/* − */}
              <button
                onClick={handleMinus}
                disabled={isLoading}
                aria-label={isPeso ? "Restar 0.001" : "Restar 1"}
                className="min-w-[44px] w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <div className="h-5 w-px bg-slate-200" />

              <input
                ref={inputRef}
                type="text"
                inputMode={isPeso ? "decimal" : "numeric"}
                className="flex-1 h-full text-center text-base font-semibold p-0 outline-none bg-transparent border-none text-slate-700 placeholder:text-slate-300"
                value={localValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                placeholder={isPeso ? "0.001" : "1"}
              />

              <div className="h-5 w-px bg-slate-200" />
              {/* + */}
              <button
                onClick={handlePlus}
                disabled={isLoading}
                aria-label={isPeso ? "Sumar 0.001" : "Sumar 1"}
                className="min-w-[44px] w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>

            <span className="text-xs text-slate-400 px-1">
              {isPeso
                ? "Hasta 3 decimales — usá punto o coma (ej: 1.540)"
                : "Solo números enteros"}
            </span>
          </div>
        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter className="flex items-center justify-between py-3.5 px-5 border-t border-slate-100 bg-white gap-3">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
            className="font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl h-10 px-5"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleConfirm}
            isLoading={isLoading}
            className="bg-[#67afc3] hover:bg-[#4899b0] text-white font-bold rounded-xl shadow-md shadow-[#67afc3]/30 h-10 px-6"
          >
            Sumar Stock
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
