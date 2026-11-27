"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  addToast,
} from "@heroui/react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { modalMotionProps } from "@/lib/motionConfig";

type Conteo = {
  nombre: string;
  comprobantes: number;
  facturasElectronicas: number;
  facturasAutorizadas: number;
  arcaProduccion: boolean;
  cajas: number;
  gastos: number;
  cheques: number;
  articulosConStock: number;
};

const n = (x: number) => x.toLocaleString("es-AR");

/**
 * Zona de peligro del detalle de un comercio: borra todos sus movimientos
 * (ventas, compras, cajas, gastos, facturas) y deja el stock en cero.
 * Solo superadmin; se confirma escribiendo el nombre del comercio.
 */
export default function ResetTiendaCard({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");

  const { data: conteo, isLoading } = useQuery<Conteo>({
    queryKey: ["admin-tenant-reset", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tenants/${tenantId}/reset`);
      if (!res.ok) throw new Error("No se pudo calcular qué se borra");
      return res.json();
    },
    enabled: abierto,
    staleTime: 0,
  });

  const reset = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/tenants/${tenantId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacion }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message ?? "No se pudo resetear la tienda",
        );
      }
      return data as { resultado: Record<string, number> };
    },
    onSuccess: ({ resultado }) => {
      addToast({
        title: "Tienda reseteada",
        description: `Se borraron ${n(resultado.comprobantes ?? 0)} comprobantes, ${n(resultado.cajas ?? 0)} cajas y ${n(resultado.gastos ?? 0)} gastos. El stock quedó en cero.`,
        color: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-tenant", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-reset", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      cerrar();
    },
    onError: (error: Error) => {
      addToast({ title: "No se pudo resetear", description: error.message, color: "danger" });
    },
  });

  const cerrar = () => {
    setAbierto(false);
    setConfirmacion("");
  };

  const nombre = conteo?.nombre ?? "";
  const confirmado = nombre !== "" && confirmacion.trim() === nombre.trim();

  return (
    <>
      <Card className="mt-6 border border-danger-200 shadow-none">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-danger-700">Zona de peligro</h3>
            <p className="text-sm text-slate-600">
              Resetear la tienda borra todas las ventas, compras, cajas, gastos y facturas, y deja el
              stock en cero. Productos, clientes, proveedores, empleados y configuración se conservan.
            </p>
          </div>
          <Button
            color="danger"
            variant="flat"
            startContent={<RotateCcw className="h-4 w-4" />}
            onPress={() => setAbierto(true)}
            className="shrink-0"
          >
            Resetear tienda
          </Button>
        </CardBody>
      </Card>

      <Modal
        isOpen={abierto}
        onClose={cerrar}
        placement="center"
        backdrop="opaque"
        motionProps={modalMotionProps}
        size="lg"
        isDismissable={!reset.isPending}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-bold">Resetear tienda</h2>
            <p className="text-sm font-normal text-slate-500">
              Esta acción no se puede deshacer.
            </p>
          </ModalHeader>
          <ModalBody className="gap-4">
            {isLoading || !conteo ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="mb-2 font-semibold text-slate-800">Se borra de &quot;{nombre}&quot;:</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>{n(conteo.comprobantes)} comprobantes (ventas, compras, notas de crédito, presupuestos, remitos)</li>
                    <li>{n(conteo.facturasElectronicas)} facturas electrónicas</li>
                    <li>{n(conteo.cajas)} cajas con sus movimientos y {n(conteo.gastos)} gastos</li>
                    <li>{n(conteo.cheques)} cheques y los saldos de cuenta corriente</li>
                    <li>El stock de {n(conteo.articulosConStock)} artículos queda en cero, y la numeración vuelve a empezar</li>
                  </ul>
                  <p className="mt-2 text-slate-500">
                    Se conservan productos y precios, clientes, proveedores, empleados, sucursales y configuración.
                  </p>
                </div>

                {conteo.facturasAutorizadas > 0 && (
                  <div
                    role="alert"
                    className={`flex gap-2.5 rounded-lg border p-3 text-sm ${
                      conteo.arcaProduccion
                        ? "border-danger-200 bg-danger-50 text-danger-800"
                        : "border-warning-200 bg-warning-50 text-warning-800"
                    }`}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>
                      {conteo.arcaProduccion ? (
                        <>
                          Hay <strong>{n(conteo.facturasAutorizadas)} facturas autorizadas por ARCA en producción</strong>.
                          Borrarlas acá no las anula en ARCA, y la ley obliga a conservar la documentación 10 años.
                        </>
                      ) : (
                        <>
                          Hay {n(conteo.facturasAutorizadas)} facturas autorizadas por ARCA en homologación (prueba).
                          Se borran de PuntoX; en ARCA no tienen validez fiscal.
                        </>
                      )}
                    </p>
                  </div>
                )}

                <Input
                  label={`Para confirmar, escribí el nombre del comercio: ${nombre}`}
                  labelPlacement="outside"
                  placeholder={nombre}
                  variant="bordered"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  isDisabled={reset.isPending}
                  autoComplete="off"
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={cerrar} isDisabled={reset.isPending}>
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={() => reset.mutate()}
              isDisabled={!confirmado}
              isLoading={reset.isPending}
            >
              Borrar todos los movimientos
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
