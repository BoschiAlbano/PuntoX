import { useUserStore } from "@/store/useUserStore";

interface LimiteInfo {
  usado: number;
  limite: number | null;
  alcanzado: boolean;
}

function calcularLimite(
  usado: number | undefined,
  limite: number | null | undefined,
): LimiteInfo {
  const usadoSeguro = usado ?? 0;
  const limiteSeguro = limite ?? null;
  return {
    usado: usadoSeguro,
    limite: limiteSeguro,
    alcanzado: limiteSeguro !== null && usadoSeguro >= limiteSeguro,
  };
}

/**
 * Refleja del lado del cliente los mismos límites que verifica el backend
 * (`src/lib/planes/features.ts`), a partir de los datos ya cargados en
 * `useUserStore` (vienen de `/api/auth/me`, sin request extra).
 *
 * Es solo para UX (deshabilitar/ocultar botones con un mensaje claro): el
 * backend siempre vuelve a validar contra la base al momento de la
 * operación, así que un dato desactualizado acá nunca permite saltarse el
 * límite real.
 */
export function usePlanFeatures() {
  const { planFeatures, planUsage } = useUserStore();

  const sucursales = calcularLimite(
    planUsage?.sucursales,
    planFeatures?.maxSucursales,
  );
  const usuarios = calcularLimite(
    planUsage?.usuarios,
    planFeatures?.maxUsuarios,
  );
  const articulos = calcularLimite(
    planUsage?.articulos,
    planFeatures?.maxArticulos,
  );
  const tieneAFIP = planFeatures?.incluyeAFIP ?? true;

  return {
    sucursales,
    usuarios,
    articulos,
    tieneAFIP,
    puedeCrearSucursal: !sucursales.alcanzado,
    puedeCrearUsuario: !usuarios.alcanzado,
    puedeCrearArticulo: !articulos.alcanzado,
  };
}
