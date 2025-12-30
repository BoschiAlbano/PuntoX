"use client";

import { Card, CardBody, CardHeader, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { AlertTriangle, Package, DollarSign, Activity, CreditCard, Store } from "lucide-react";
import { AlertasData } from "@/hooks/useAnaliticas";

interface PanelAlertasProps {
  data: AlertasData;
  isLoading: boolean;
}

export default function PanelAlertas({ data, isLoading }: PanelAlertasProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardBody className="p-6">
          <p className="text-gray-500">Cargando alertas...</p>
        </CardBody>
      </Card>
    );
  }

  const { alertas, resumen } = data;

  return (
    <div className="space-y-6">
      {/* Resumen de alertas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardBody className="p-4">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Stock Crítico</p>
                <p className="text-xl font-bold text-gray-900">
                  {resumen.stockUrgentes}
                </p>
                <p className="text-xs text-gray-500">
                  {resumen.stock} total
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardBody className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Cobranzas Vencidas</p>
                <p className="text-xl font-bold text-gray-900">
                  {resumen.cobranzasVencidas}
                </p>
                <p className="text-xs text-gray-500">
                  {resumen.cobranzas} total
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardBody className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Cheques Urgentes</p>
                <p className="text-xl font-bold text-gray-900">
                  {resumen.chequesUrgentes}
                </p>
                <p className="text-xs text-gray-500">
                  {resumen.cheques} total
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardBody className="p-4">
            <div className="flex items-center gap-2">
              <Store size={20} className="text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Cajas Sin Actividad</p>
                <p className="text-xl font-bold text-gray-900">
                  {resumen.cajasSinActividad}
                </p>
                <p className="text-xs text-gray-500">
                  {resumen.cajas} abiertas
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Productos críticos */}
      {alertas.stock && alertas.stock.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              <h3 className="text-lg font-semibold text-slate-900">
                Productos con Stock Crítico
              </h3>
              <Chip size="sm" color="danger" variant="flat">
                {alertas.stock.length}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <Table aria-label="Productos críticos">
              <TableHeader>
                <TableColumn>PRODUCTO</TableColumn>
                <TableColumn>STOCK</TableColumn>
                <TableColumn>MÍNIMO</TableColumn>
                <TableColumn>ESTADO</TableColumn>
                <TableColumn>DÍAS HASTA AGOTAR</TableColumn>
              </TableHeader>
              <TableBody>
                {alertas.stock.slice(0, 10).map((prod) => (
                  <TableRow key={prod.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prod.nombre}</p>
                        <p className="text-xs text-gray-500">{prod.codigo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{prod.stock}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">{prod.stockMinimo}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={prod.esUrgente ? "danger" : "warning"}
                        variant="flat"
                      >
                        {prod.esUrgente ? "🔴 Urgente" : "⚠️ Bajo"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {prod.diasHastaAgotar !== null ? (
                        <span className="text-sm">
                          {prod.diasHastaAgotar} días
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Sin ventas</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Cobranzas vencidas */}
      {alertas.cobranzas && alertas.cobranzas.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="text-yellow-500" size={20} />
              <h3 className="text-lg font-semibold text-slate-900">
                Cobranzas Pendientes
              </h3>
              <Chip size="sm" color="warning" variant="flat">
                {alertas.cobranzas.length}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <Table aria-label="Cobranzas">
              <TableHeader>
                <TableColumn>CLIENTE</TableColumn>
                <TableColumn>SALDO</TableColumn>
                <TableColumn>DÍAS VENCIDO</TableColumn>
                <TableColumn>ESTADO</TableColumn>
              </TableHeader>
              <TableBody>
                {alertas.cobranzas.slice(0, 10).map((cob) => (
                  <TableRow key={cob.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cob.nombre}</p>
                        <p className="text-xs text-gray-500">{cob.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        }).format(cob.saldo)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{cob.diasVencido} días</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={cob.esVencido ? "danger" : "warning"}
                        variant="flat"
                      >
                        {cob.esVencido ? "Vencido" : "Pendiente"}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Actividad del equipo */}
      {alertas.actividad && alertas.actividad.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              <h3 className="text-lg font-semibold text-slate-900">
                Actividad Reciente del Equipo
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {alertas.actividad.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
                >
                  <Chip
                    size="sm"
                    color={
                      act.severidad === "ERROR" || act.severidad === "CRITICAL"
                        ? "danger"
                        : act.severidad === "WARNING"
                        ? "warning"
                        : "default"
                    }
                    variant="flat"
                  >
                    {act.severidad}
                  </Chip>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {act.accion}
                    </p>
                    <p className="text-xs text-gray-500">{act.detalle}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {act.usuario} • {new Date(act.fecha).toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

