import { MetadataRoute } from "next";

/**
 * Páginas públicas indexables. Hoy solo la landing (antes listaba /login y
 * /register, que no existen). Agregar acá nuevas páginas públicas
 * (precios, contacto, etc.) cuando se creen.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.puntox.com.ar",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
