import { useConfiguracion } from "./useConfiguracion";

/**
 * Hook que retorna la moneda configurada en la base de datos
 * (Configuracion.Moneda vía /api/configuracion/fiscal).
 */
export function useCurrency(): string {
  const { fiscal } = useConfiguracion({ enableFiscal: true });
  return fiscal?.moneda ?? "ARS";
}
