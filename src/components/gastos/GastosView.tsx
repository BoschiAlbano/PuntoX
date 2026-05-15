"use client";

import { useCaja } from "@/hooks/useCaja";
import { useGastos } from "@/hooks/useGastos";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { Pencil, Plus, Trash2, TrendingDown } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { handleNumberInput } from "@/lib/input/number";
import { TIPO_PAGO, TIPO_PAGO_LABELS } from "@/lib/constants/comprobantes";
import GenericTable, { Column } from "@/components/shared/GenericTable";

const gastosColumns: Column[] = [
  { uid: "descripcion", name: "Descripción", sortable: false },
  { uid: "concepto", name: "Concepto", sortable: false, printAlign: "center" },
  {
    uid: "formaPago",
    name: "Forma de Pago",
    sortable: false,
    printAlign: "center",
  },
  { uid: "fecha", name: "Fecha", sortable: false, printAlign: "center" },
  {
    uid: "monto",
    name: "Monto",
    sortable: false,
    align: "end",
    printAlign: "center",
  },
  { uid: "acciones", name: "Acciones", sortable: false, align: "center" },
];

const GASTO_LIMIT = 10;

function formatMoney(val: number) {
  return val.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GastosView() {
  const { cajaActual, isLoading, isFetching, isCajaAbierta, refetch } = useCaja(
    { enableCaja: true },
  );

  const {
    conceptosGasto,
    agregarGasto,
    editarGasto,
    eliminarGasto,
    agregarConceptoGasto,
    isAddingGasto,
    isEditingGasto,
    isDeletingGasto,
    isAddingConcepto,
  } = useGastos({ enableConceptos: true });

  // ── Modales ──────────────────────────────────────────────────────────────
  const {
    isOpen: isGastoOpen,
    onOpen: onGastoOpen,
    onOpenChange: onGastoChange,
  } = useDisclosure();

  const {
    isOpen: isConceptoOpen,
    onOpen: onConceptoOpen,
    onOpenChange: onConceptoChange,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteChange,
  } = useDisclosure();

  // ── Estado local ──────────────────────────────────────────────────────────
  const [nuevoGasto, setNuevoGasto] = useState<{
    conceptoId: string;
    descripcion: string;
    pagos: { tipoPago: number; monto: string }[];
  }>({ conceptoId: "", descripcion: "", pagos: [] });

  const [editingGastoId, setEditingGastoId] = useState<number | null>(null);
  const [gastoToDelete, setGastoToDelete] = useState<number | null>(null);
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [gastoSearch, setGastoSearch] = useState("");
  const [gastoPage, setGastoPage] = useState(1);

  // ── Datos ─────────────────────────────────────────────────────────────────
  const gastos = cajaActual?.Gasto || [];

  const filteredGastos = useMemo(() => {
    if (!gastoSearch.trim()) return gastos;
    const q = gastoSearch.toLowerCase();
    return gastos.filter(
      (g: any) =>
        g.Descripcion?.toLowerCase().includes(q) ||
        g.ConceptoGastos?.Descripcion?.toLowerCase().includes(q),
    );
  }, [gastos, gastoSearch]);

  const paginatedGastos = useMemo(() => {
    const start = (gastoPage - 1) * GASTO_LIMIT;
    return filteredGastos.slice(start, start + GASTO_LIMIT);
  }, [filteredGastos, gastoPage]);

  const gastoPaginationMeta = useMemo(
    () => ({
      total: filteredGastos.length,
      page: gastoPage,
      limit: GASTO_LIMIT,
      totalPages: Math.max(1, Math.ceil(filteredGastos.length / GASTO_LIMIT)),
    }),
    [filteredGastos.length, gastoPage],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAgregarConcepto = async () => {
    if (!nuevoConcepto) return;
    try {
      await agregarConceptoGasto(nuevoConcepto);
      onConceptoChange();
      setNuevoConcepto("");
      addToast({ title: "Concepto creado", color: "success" });
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo crear el concepto",
        color: "danger",
      });
    }
  };

  const handleAgregarGasto = async () => {
    try {
      const pagosFormatted = nuevoGasto.pagos.map((p) => ({
        tipoPago: p.tipoPago,
        monto: parseFloat(p.monto.replace(",", ".")),
      }));

      if (editingGastoId) {
        await editarGasto({
          id: editingGastoId,
          conceptoId: Number(nuevoGasto.conceptoId),
          descripcion: nuevoGasto.descripcion,
          pagos: pagosFormatted,
        });
        addToast({ title: "Gasto actualizado", color: "success" });
      } else {
        await agregarGasto({
          conceptoId: Number(nuevoGasto.conceptoId),
          descripcion: nuevoGasto.descripcion,
          pagos: pagosFormatted,
        });
        addToast({ title: "Gasto registrado", color: "success" });
      }

      onGastoChange();
      setNuevoGasto({ conceptoId: "", descripcion: "", pagos: [] });
      setEditingGastoId(null);
    } catch (error: any) {
      addToast({
        title: "Error",
        description:
          error?.message ||
          (editingGastoId
            ? "No se pudo actualizar el gasto"
            : "No se pudo registrar el gasto"),
        color: "danger",
      });
    }
  };

  const prepareEditGasto = useCallback(
    (gasto: any) => {
      setEditingGastoId(gasto.Id);
      const pagos =
        gasto.FormaPago?.map((fp: any) => ({
          tipoPago: fp.TipoPago,
          monto: fp.Monto.toString().replace(".", ","),
        })) || [];
      setNuevoGasto({
        conceptoId: String(gasto.ConceptoGastoId),
        descripcion: gasto.Descripcion,
        pagos,
      });
      onGastoOpen();
    },
    [onGastoOpen],
  );

  const handleEliminarGasto = async () => {
    if (!gastoToDelete) return;
    try {
      await eliminarGasto(gastoToDelete);
      addToast({ title: "Gasto eliminado", color: "success" });
      onDeleteChange();
      setGastoToDelete(null);
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el gasto",
        color: "danger",
      });
    }
  };

  // ── Render celda ──────────────────────────────────────────────────────────
  const renderGastoCell = useCallback(
    (gasto: any, columnKey: React.Key) => {
      switch (columnKey) {
        case "descripcion":
          return (
            <span className="text-sm font-medium text-gray-800">
              {gasto.Descripcion}
            </span>
          );
        case "concepto":
          return (
            <Chip size="sm" variant="flat" color="danger" className="text-xs">
              {gasto.ConceptoGastos?.Descripcion || "Gasto"}
            </Chip>
          );
        case "formaPago":
          return (
            <div className="">
              {gasto.FormaPago?.map((p: any) => (
                <Chip key={p.Id} size="sm" variant="flat" className="text-xs">
                  {TIPO_PAGO_LABELS[p.TipoPago]}
                </Chip>
              ))}
            </div>
          );
        case "fecha":
          return formatDate(gasto.Fecha);
        case "monto":
          return (
            <span className="font-semibold text-danger">
              -{formatMoney(gasto.Monto)}
            </span>
          );
        case "acciones":
          return (
            <div className="flex gap-1 justify-center">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="warning"
                onPress={() => prepareEditGasto(gasto)}
              >
                <Pencil size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => {
                  setGastoToDelete(gasto.Id);
                  onDeleteOpen();
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        default:
          return null;
      }
    },
    [prepareEditGasto, onDeleteOpen],
  );

  // ── Caja cerrada ──────────────────────────────────────────────────────────
  if (!isCajaAbierta || !cajaActual) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
        <TrendingDown size={48} strokeWidth={1} />
        <p className="text-base font-medium">
          No hay una caja abierta. Abrí la caja para registrar gastos.
        </p>
      </div>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <>
      <GenericTable
        data={paginatedGastos}
        columns={gastosColumns}
        isLoading={isLoading}
        isError={false}
        search={gastoSearch}
        onSearchChange={(val) => {
          setGastoSearch(val);
          setGastoPage(1);
        }}
        searchPlaceholder="Buscar gasto..."
        page={gastoPage}
        onPageChange={setGastoPage}
        paginationMeta={gastoPaginationMeta}
        isRefreshing={isFetching}
        onRefresh={refetch}
        renderCell={renderGastoCell}
        emptyText="No hay gastos registrados en esta caja."
        printConfig={{ title: "Gastos de Caja" }}
        onNewClick={() => {
          setEditingGastoId(null);
          setNuevoGasto({ conceptoId: "", descripcion: "", pagos: [] });
          onGastoOpen();
        }}
        newButtonText="Nuevo Gasto"
      />

      {/* ── Modal Nuevo / Editar Gasto ─────────────────────────────────── */}
      <Modal
        isOpen={isGastoOpen}
        onOpenChange={onGastoChange}
        size="2xl"
        placement="center"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm z-[999]",
          wrapper: "z-[1000]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingGastoId ? "Editar Gasto" : "Registrar Gasto"}
              </ModalHeader>
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

                <div className="border p-4 rounded-xl border-gray-200 bg-gray-50 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600">
                      Formas de Pago
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      startContent={<Plus size={16} />}
                      onPress={() => {
                        const usedTypes = new Set(
                          nuevoGasto.pagos.map((p) => p.tipoPago),
                        );
                        const allTypes = Object.values(TIPO_PAGO);
                        const nextType = allTypes.find(
                          (t) => !usedTypes.has(t),
                        );
                        if (nextType) {
                          setNuevoGasto({
                            ...nuevoGasto,
                            pagos: [
                              ...nuevoGasto.pagos,
                              { tipoPago: nextType, monto: "" },
                            ],
                          });
                        }
                      }}
                      isDisabled={
                        nuevoGasto.pagos.length >= Object.keys(TIPO_PAGO).length
                      }
                    >
                      Agregar Pago
                    </Button>
                  </div>

                  {nuevoGasto.pagos.map((pago, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        label="Tipo"
                        className="w-1/3"
                        size="sm"
                        selectedKeys={[pago.tipoPago.toString()]}
                        onChange={(e) => {
                          const newPagos = [...nuevoGasto.pagos];
                          newPagos[index].tipoPago = Number(e.target.value);
                          setNuevoGasto({ ...nuevoGasto, pagos: newPagos });
                        }}
                      >
                        {Object.entries(TIPO_PAGO_LABELS).map(
                          ([key, label]) => {
                            const value = Number(key);
                            const isSelected = nuevoGasto.pagos.some(
                              (p) => p.tipoPago === value,
                            );
                            const isCurrentValue = pago.tipoPago === value;
                            return (
                              <SelectItem
                                key={key}
                                isDisabled={isSelected && !isCurrentValue}
                              >
                                {label}
                              </SelectItem>
                            );
                          },
                        )}
                      </Select>
                      <Input
                        label="Monto"
                        size="sm"
                        placeholder="0.00"
                        value={pago.monto}
                        onValueChange={(val) => {
                          const newPagos = [...nuevoGasto.pagos];
                          handleNumberInput(val, (v) => {
                            newPagos[index].monto = v;
                            setNuevoGasto({ ...nuevoGasto, pagos: newPagos });
                          });
                        }}
                        className="flex-1"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => {
                          const newPagos = nuevoGasto.pagos.filter(
                            (_, i) => i !== index,
                          );
                          setNuevoGasto({ ...nuevoGasto, pagos: newPagos });
                        }}
                      >
                        <TrendingDown size={16} />
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg text-primary">
                      {formatMoney(
                        nuevoGasto.pagos.reduce(
                          (acc, p) =>
                            acc + (parseFloat(p.monto.replace(",", ".")) || 0),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" color="danger" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  className="bg-[#67afc3] text-white font-semibold"
                  onPress={handleAgregarGasto}
                  isLoading={isAddingGasto || isEditingGasto}
                  isDisabled={
                    nuevoGasto.pagos.length === 0 ||
                    !nuevoGasto.conceptoId ||
                    !nuevoGasto.descripcion ||
                    nuevoGasto.pagos.some(
                      (p) =>
                        !p.monto || parseFloat(p.monto.replace(",", ".")) <= 0,
                    )
                  }
                >
                  {editingGastoId ? "Actualizar" : "Guardar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── Modal Nuevo Concepto ───────────────────────────────────────── */}
      <Modal
        isOpen={isConceptoOpen}
        onOpenChange={onConceptoChange}
        size="sm"
        placement="center"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm z-[999]",
          wrapper: "z-[1000]",
        }}
      >
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
                  className="bg-[#67afc3] text-white font-semibold"
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

      {/* ── Modal Confirmar Eliminación ────────────────────────────────── */}
      <Modal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteChange}
        size="sm"
        placement="center"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm z-[999]",
          wrapper: "z-[1000]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Eliminar Gasto</ModalHeader>
              <ModalBody>
                <p>¿Estás seguro de que deseas eliminar este gasto?</p>
                <p className="text-xs text-gray-500">
                  Esta acción revertirá los movimientos en la caja.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  onPress={handleEliminarGasto}
                  isLoading={isDeletingGasto}
                >
                  Eliminar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
