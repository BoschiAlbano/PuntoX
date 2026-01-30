import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://puntox.com.ar";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Agrega más páginas aquí según tu sitio
    // Ejemplo:
    // {
    //   url: `${baseUrl}/precios`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.9,
    // },
    // {
    //   url: `${baseUrl}/contacto`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.7,
    // },
  ];
}
