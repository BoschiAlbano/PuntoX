import React from "react";
import { Caja } from "@/hooks/useCaja";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { TIPO_MOVIMIENTO } from "@/lib/constants/comprobantes";

interface ReporteCajaImprimibleProps {
  cajaActual: Caja;
  nombreEmpresa?: string;
}

export const ReporteCajaImprimible = React.forwardRef<
  HTMLDivElement,
  ReporteCajaImprimibleProps
>(({ cajaActual, nombreEmpresa }, ref) => {
  if (!cajaActual) return null;

  const totalEntradas =
    Number(cajaActual.TotalEntradaEfectivo || 0) +
    Number(cajaActual.TotalEntradaTarjeta || 0) +
    Number(cajaActual.TotalEntradaTransf || 0) +
    Number(cajaActual.TotalEntradaCheque || 0) +
    Number(cajaActual.TotalEntradaCtaCte || 0);

  const totalSalidas =
    Number(cajaActual.TotalSalidaEfectivo || 0) +
    Number(cajaActual.TotalSalidaTarjeta || 0) +
    Number(cajaActual.TotalSalidaTransf || 0) +
    Number(cajaActual.TotalSalidaCheque || 0) +
    Number(cajaActual.TotalSalidaCtaCte || 0);

  const saldoEfectivo =
    Number(cajaActual.MontoInicial || 0) +
    Number(cajaActual.TotalEntradaEfectivo || 0) -
    Number(cajaActual.TotalSalidaEfectivo || 0);

  return (
    <div
      ref={ref}
      className="p-8 font-sans text-sm text-black bg-white min-h-[297mm]"
    >
      {/* Encabezado */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">
          {nombreEmpresa || "Punto X"}
        </h1>
        <h2 className="text-xl font-semibold">Reporte de Caja</h2>
        <div className="flex justify-center space-x-8 mt-4 text-gray-700">
          <div>
            <p>
              <strong>Apertura:</strong>{" "}
              {new Date(cajaActual.FechaApertura).toLocaleString("es-AR")}
            </p>
            <p>
              <strong>Por:</strong>{" "}
              {cajaActual.UsuarioApertura?.NombreCompleto ||
                cajaActual.UsuarioApertura?.Nombre ||
                "-"}
            </p>
          </div>
          {cajaActual.FechaCierre && (
            <div>
              <p>
                <strong>Cierre:</strong>{" "}
                {new Date(cajaActual.FechaCierre).toLocaleString("es-AR")}
              </p>
              <p>
                <strong>Por:</strong>{" "}
                {cajaActual.UsuarioCierre?.NombreCompleto ||
                  cajaActual.UsuarioCierre?.Nombre ||
                  "-"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="mb-8">
        <h3 className="text-lg font-bold border-b border-gray-300 mb-3 pb-1">
          Resumen del Turno
        </h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2">
          <div className="flex justify-between">
            <span>Monto Inicial:</span>
            <span className="font-semibold">
              {formatCurrency(cajaActual.MontoInicial)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Efectivo Físico Esperado:</span>
            <span className="font-semibold text-lg">
              {formatCurrency(saldoEfectivo)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Total Entradas (Todas las formas):</span>
            <span className="font-semibold text-green-700">
              {formatCurrency(totalEntradas)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Ganancia de Ventas:</span>
            <span className="font-semibold text-blue-700">
              {formatCurrency(cajaActual.GananciaVentas || 0)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Total Salidas (Todas las formas):</span>
            <span className="font-semibold text-red-700">
              {formatCurrency(totalSalidas)}
            </span>
          </div>
          {cajaActual.MontoCierre !== null && (
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span>Efectivo Contado (Cierre):</span>
              <span className="font-bold text-lg">
                {formatCurrency(cajaActual.MontoCierre)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detalle de Movimientos */}
      <div className="mb-4">
        <h3 className="text-lg font-bold border-b border-gray-300 mb-3 pb-1">
          Detalle de Movimientos
        </h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border border-gray-300">Hora</th>
              <th className="py-2 px-3 border border-gray-300">Tipo</th>
              <th className="py-2 px-3 border border-gray-300">Descripción</th>
              <th className="py-2 px-3 border border-gray-300">Usuario</th>
              <th className="py-2 px-3 border border-gray-300 text-right">
                Ingreso
              </th>
              <th className="py-2 px-3 border border-gray-300 text-right">
                Egreso
              </th>
            </tr>
          </thead>
          <tbody>
            {cajaActual.Movimiento && cajaActual.Movimiento.length > 0 ? (
              cajaActual.Movimiento.map((mov) => {
                const isEntrada =
                  mov.TipoMovimiento === TIPO_MOVIMIENTO.ENTRADA;
                return (
                  <tr key={mov.Id} className="border-b border-gray-200">
                    <td className="py-1 px-3 border-x border-gray-300">
                      {new Date(mov.Fecha).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-1 px-3 border-x border-gray-300">
                      {isEntrada ? "Entrada" : "Salida"}
                    </td>
                    <td
                      className="py-1 px-3 border-x border-gray-300 truncate max-w-[200px]"
                      title={mov.Descripcion}
                    >
                      {mov.Descripcion}
                    </td>
                    <td className="py-1 px-3 border-x border-gray-300">
                      {mov.Usuario?.Nombre || "-"}
                    </td>
                    <td className="py-1 px-3 border-x border-gray-300 text-right font-medium text-green-700">
                      {isEntrada ? formatCurrency(mov.Monto) : ""}
                    </td>
                    <td className="py-1 px-3 border-x border-gray-300 text-right font-medium text-red-700">
                      {!isEntrada ? formatCurrency(mov.Monto) : ""}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 text-center text-gray-500 border border-gray-300"
                >
                  No hay movimientos registrados en este turno.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de página */}
      <div className="mt-8 text-center text-gray-500 text-xs">
        Generado el {new Date().toLocaleString("es-AR")} por Punto X
      </div>
    </div>
  );
});

ReporteCajaImprimible.displayName = "ReporteCajaImprimible";
