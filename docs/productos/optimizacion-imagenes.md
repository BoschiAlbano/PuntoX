# Optimización de imágenes a WebP antes de subir a Supabase Storage

## Estado: implementado (2026-08-05)

## Contexto

Antes de este cambio, ninguna imagen subida por el usuario (foto de producto, foto de
empleado/perfil, logo de marca) se redimensionaba ni comprimía: el código tomaba el
archivo tal cual lo entregaba el navegador y lo subía directo a Supabase Storage. Una
foto de celular de varios MB terminaba mostrándose después como miniatura de
~24-96px en una tabla, desperdiciando espacio de Storage y ancho de banda de egress en
cada carga.

El único control existente era un límite de tamaño (2MB en productos, 5MB en
empleados/perfil, ninguno en branding) — evita abusos, pero no reduce nada.

Además, los 2 call-sites de productos (POST/PATCH) y el caché compartido de imágenes por
código de barra (`imagenProductoCache.ts`, ver
[`cache-imagenes-plan.md`](./cache-imagenes-plan.md)) forzaban `contentType:
"image/png"` sin importar el formato real subido (un JPG quedaba mal etiquetado).

## Diseño

### Utilidad compartida: `src/lib/utils/imageOptimizer.ts`

Usa [`sharp`](https://sharp.pixelplumbing.com/) (dependencia nueva agregada con
`pnpm add sharp` — **este proyecto usa `pnpm`, no `npm`**, tiene `pnpm-lock.yaml`).

```ts
export async function optimizeImageToWebp(
  input: Buffer,
  { maxWidth = 1024, maxHeight = 1024, quality = 80 }: OptimizeImageOptions = {},
): Promise<OptimizedImage> // { buffer, contentType: "image/webp", extension: "webp" }
```

- `.rotate()` sin argumentos: aplica la orientación EXIF antes de perderla en la
  reconversión (evita fotos de celular giradas 90°).
- `.resize({ fit: "inside", withoutEnlargement: true })`: nunca recorta ni agranda, solo
  reduce si excede el máximo.
- Lanza si el buffer no es una imagen válida — cada caller lo deja propagar al
  `try/catch` que ya envuelve la operación, para responder 400/500 en vez de subir
  basura a Storage.

Presets por tipo de imagen (constantes locales en cada call-site, sin abstraer más):

| Uso | maxWidth/Height | quality | Motivo |
|---|---|---|---|
| Productos, empleados/perfil | 1024px | 80 | Son thumbnails hoy, pero da margen para una vista de detalle más grande a futuro |
| Logo de marca | 1024px | 90 | Suele llevar texto/líneas finas y a veces se imprime en tickets |

### Call-sites actualizados (7)

Todos siguen el mismo patrón: `Buffer` crudo → `optimizeImageToWebp(buffer, preset)` →
usar `optimized.buffer` / `optimized.contentType` / `optimized.extension` en el
`.upload(...)` y en el nombre de archivo.

- `src/app/api/productos/route.ts` — POST y PATCH. El buffer optimizado se reusa tal
  cual para `guardarEnCacheSiCorresponde(...)` (caché por código de barra) — **una sola
  conversión**, no dos.
- `src/lib/services/imagenProductoCache.ts` — como siempre recibe el buffer ya
  optimizado desde `productos/route.ts`, solo se corrigió el hardcode de
  extensión/contentType (`"png"` → `"webp"`).
- `src/app/api/empleados/route.ts` — POST y PUT (alta y edición de empleado). Se quitó
  el helper local `extFromMime` (quedó sin uso, ya no hace falta derivar la extensión
  del mime original).
- `src/app/api/perfil/foto/route.ts` — el usuario cambia su propia foto de perfil.
- `src/app/api/configuracion/branding/route.ts` — logo de marca. **Además** se agregó
  validación de tamaño (5MB) y mime (`image/png|jpeg|jpg`) en el servidor, algo que
  antes solo existía en el cliente (`PerfilTab.tsx`) y se podía saltear.

### Fuera de alcance (decisión explícita)

- No se tocaron los límites de tamaño client-side (2MB productos, 5MB empleados/perfil):
  siguen siendo un guardrail contra archivos absurdos *antes* de procesarlos, no
  relacionado con el tamaño final ya optimizado.
- No se reprocesaron imágenes ya subidas antes de este cambio: las URLs viejas (`.png`)
  siguen funcionando tal cual, solo lo que se suba de acá en más sale en `.webp`. No hay
  script de backfill.
- No se declaró `export const runtime = "nodejs"` en las rutas tocadas: ya es el
  default (ninguna usa `edge`), no hace falta para que `sharp` funcione.

## Resultados verificados (prueba manual end-to-end)

| Flujo | Antes | Después | Reducción |
|---|---|---|---|
| Foto de producto | 1476 KB | 205.6 KB | -86% |
| Foto de empleado | 4381 KB | 296.9 KB | -93% |
| Logo de marca | 1476 KB | 310.3 KB | -79% |

Todas sirven `content-type: image/webp` correctamente. Se confirmó también que:
- Branding rechaza (400) un archivo con mime inválido.
- Una imagen corrupta (bytes basura con mime `image/png`) no tira abajo el servidor:
  `sharp` lanza, el `try/catch` existente lo captura y responde 500 controlado vía
  `handleError`, sin crashear el proceso.

## Archivos clave

- `src/lib/utils/imageOptimizer.ts` (nuevo)
- `src/app/api/productos/route.ts`
- `src/lib/services/imagenProductoCache.ts`
- `src/app/api/empleados/route.ts`
- `src/app/api/perfil/foto/route.ts`
- `src/app/api/configuracion/branding/route.ts`
- `package.json` / `pnpm-lock.yaml` (`sharp` agregado a `dependencies`)
