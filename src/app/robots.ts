import { MetadataRoute } from "next";

const BASE_URL = "https://www.puntox.com.ar";

/**
 * Solo la landing es pública e indexable. El resto de la app requiere sesión,
 * así que se excluye (antes se excluía "/(dashboard)/", que es el nombre de
 * una carpeta del código y no una ruta real).
 */
const RUTAS_PRIVADAS = [
  "/api/",
  "/admin/",
  "/auth/",
  "/dashboard",
  "/ventas",
  "/caja",
  "/clientes",
  "/compras",
  "/comprobantes",
  "/configuracion",
  "/empleados",
  "/onboarding",
  "/perfil",
  "/productos",
  "/proveedores",
  "/sucursales",
  "/analiticas",
  "/suscripcion-vencida",
  "/not-branches",
  "/restablecer-contrasena",
  "/seleccionar-sucursal",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: RUTAS_PRIVADAS }],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
