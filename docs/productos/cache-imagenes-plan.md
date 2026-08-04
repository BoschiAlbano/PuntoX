# Plan: Caché propio de imágenes de producto (compartido entre tenants)

## Estado: implementado (2026-08-04)

Implementación completa según el plan de las secciones 4-6. Archivos clave:
- `prisma/schema.prisma` — `Articulo.CodigoBarraGenerado`, modelo `ImagenProductoCache`, enum `ImagenCacheFuente`.
- `src/lib/services/imagenProductoCache.ts` — lógica de negocio centralizada (write-once, bypass superadmin, nunca escribe códigos generados).
- `src/app/api/productos/route.ts` — escritura enganchada en POST/PATCH.
- `src/app/api/productos/buscar-foto/route.ts` y `buscar-foto-texto/route.ts` — lectura del caché antes de Open Food Facts.
- `src/components/productos/ProductoForm.tsx` y `SeleccionarFotoModal.tsx` — flag de código generado, badge de origen.
- `src/app/(superAdmin)/admin/imagenes-cache/` + `src/app/api/admin/imagenes-cache/` — panel de gestión para SUPERADMIN.

Bug conocido y corregido durante las pruebas: el reemplazo de imagen desde el panel de superadmin no se veía reflejado porque se subía siempre con el mismo nombre de archivo (URL pública idéntica → caché del navegador servía la imagen vieja). Solución: nombre de archivo único por subida + borrado del archivo anterior.

## 1. Contexto

Hoy (ya implementado) el formulario de artículos (`new`/`edit`) tiene un botón "Buscar foto por código de barra" que:

1. Busca en **Open Food Facts** por `CodigoBarra` exacto (`/api/productos/buscar-foto`).
2. Si no hay match, busca por texto usando la `Descripcion` del producto (`/api/productos/buscar-foto-texto`), mostrando un modal (`SeleccionarFotoModal`) con miniaturas para que el usuario elija.
3. La imagen elegida se sube al storage de Supabase del tenant (bucket `articulos`), igual que una foto subida a mano.

Limitación: depende 100% de Open Food Facts, que tiene buena cobertura de marcas internacionales pero **poca o nula cobertura de productos locales/artesanales argentinos** (justamente los que más cuesta fotografiar a mano).

## 2. Objetivo

Construir un **caché propio de imágenes, compartido entre todos los tenants del sistema**, que se alimenta orgánicamente del uso real de la app: cada vez que un negocio carga la foto de un producto con código de barra real, esa imagen queda disponible para que otros negocios que vendan el mismo producto no tengan que buscarla/subirla de nuevo.

Con el tiempo, este caché cubre exactamente lo que Open Food Facts no tiene, porque lo alimentan los propios usuarios de PuntoX.

## 3. Reglas de negocio acordadas

### 3.1 Quién puede escribir en el caché

| Rol                                                      | Puede escribir si el código NO existe en caché | Puede sobreescribir/reemplazar una imagen ya existente                                                               |
| -------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **SUPERADMIN** (dueño del sistema)                       | Sí                                             | **Sí, siempre**                                                                                                      |
| **ADMINISTRADOR** / **EMPLEADO** (usuarios de un tenant) | Sí                                             | **No** (write-once: la primera imagen que llega para un código de barra queda, hasta que un superadmin la reemplace) |

Motivo: evita que un tenant pise por error (o mala fe) la imagen que ya cargó otro negocio para el mismo producto. El superadmin queda como curador final.

### 3.2 Qué códigos de barra NO deben tocar el caché (ni leer ni escribir)

Riesgo detectado en la conversación: el formulario ya tiene un botón "Generar código automático" que crea códigos de 12 dígitos (`100` + 9 dígitos random) para productos de elaboración propia sin código de barra real. Estos códigos:

- **No son únicos globalmente** entre tenants (cada tienda los genera por su cuenta).
- Si se escriben en el caché compartido, dos tiendas distintas podrían coincidir por azar en el mismo código para productos completamente distintos, y una heredaría la foto incorrecta de la otra (ej. una tienda con un código random para "queso casero" recibe la foto de "Coca-Cola" porque otra tienda generó el mismo random para eso).

**Mitigación**: agregar un flag explícito que distinga "código real/escaneado" de "código autogenerado", y excluir los autogenerados de todo el flujo de caché (ni se escriben, ni se usan para buscar).

- Nuevo campo en `Articulo`: `CodigoBarraGenerado: Boolean` (default `false`).
- Se setea en `true` únicamente cuando el usuario usa el botón de generar código automático.
- Se setea en `false` cuando el código viene de escanear (`CameraScannerModal`) o se tipea a mano (asunción razonable: si el usuario tipeó un código, probablemente esté copiando uno real de un envase).

Esta regla aplica sin importar por qué camino se encontró la imagen (match exacto por código, o fallback por texto): si el `CodigoBarra` del producto está flageado como generado, **nunca se escribe** esa asociación en el caché.

### 3.3 Copiar vs. referenciar la imagen

Cuando se encuentra una imagen en el caché (o en Open Food Facts) y el usuario la aplica a su producto, la imagen se **copia** al storage propio del tenant (bucket de Supabase de esa tienda), no se referencia directamente la URL del caché compartido.

Motivos:

- Cada tienda tiene su propio storage independiente en Supabase — es el modelo de datos ya establecido en el proyecto.
- Si se referenciara directo, un reemplazo posterior del superadmin cambiaría "por atrás" la foto de productos ya cargados en tiendas que no lo pidieron.
- El código actual de borrado de foto vieja (`PATCH /api/productos`) ya asume que toda URL en `Foto` es propia del tenant (bucket `articulos/{tenantId}/...`); referenciar URLs ajenas rompería esa lógica.
- El costo de storage de duplicar imágenes de producto (livianas) es marginal comparado con el beneficio de aislamiento.

## 4. Flujo completo propuesto

### 4.1 Lectura (al buscar foto para un producto)

```
Usuario pulsa "Buscar foto"
  │
  ├─ ¿CodigoBarra existe y NO está flageado como generado?
  │     │
  │     ├─ Sí → buscar match exacto en caché propio (por CodigoBarra)
  │     │         ├─ Hit → mostrar/usar esa imagen
  │     │         └─ Miss → buscar en Open Food Facts por código (ya implementado)
  │     │                     ├─ Hit → usar esa imagen
  │     │                     └─ Miss → pasar a búsqueda por texto (abajo)
  │     │
  │     └─ No (código generado o vacío) → pasar directo a búsqueda por texto
  │
  └─ Búsqueda por texto (usa Descripcion del producto):
        ├─ Buscar por texto en caché propio (nuevo: requiere indexar Descripcion en el caché)
        ├─ Buscar por texto en Open Food Facts (ya implementado)
        └─ Combinar candidatos de ambas fuentes → modal de selección
             (idealmente marcando el origen: "de la comunidad PuntoX" vs "Open Food Facts")

Usuario elige una imagen del modal (o del match exacto)
  │
  └─ Se copia al storage del tenant → se asigna a Articulo.Foto
```

### 4.2 Escritura (al guardar un producto con foto)

Se dispara dentro del mismo endpoint que ya sube la foto al storage del tenant (`POST`/`PATCH /api/productos`), como paso adicional:

```
¿El producto tiene Foto Y CodigoBarra real (CodigoBarraGenerado = false)?
  │
  └─ Sí →
       ├─ ¿El usuario es SUPERADMIN? → upsert en caché (crea o reemplaza)
       └─ ¿Es ADMINISTRADOR/EMPLEADO? →
            ├─ ¿El código YA existe en caché? → no se toca (write-once)
            └─ ¿No existe? → se crea la entrada en caché
```

## 5. Modelo de datos propuesto (borrador)

Nueva tabla `ImagenProductoCache` (global, no scoped a tenant):

```prisma
model ImagenProductoCache {
  Id                BigInt   @id @default(autoincrement())
  CodigoBarra       String   @unique @db.VarChar(100)
  Descripcion       String?  @db.VarChar(250) // para búsqueda por texto propia
  ImageUrl          String   @db.VarChar(1000) // storage propio del caché, NO el de un tenant
  Fuente            String   // "OPEN_FOOD_FACTS" | "USUARIO"
  CreadoPorTenantId BigInt?
  CreadoPorUserId   BigInt?
  FechaCreacion     DateTime @default(now())
  ModificadoEn      DateTime @updatedAt

  @@index([Descripcion])
}
```

Notas:

- `ImageUrl` apunta a un **bucket de Supabase propio de la plataforma** (no el de ningún tenant), para que la vida de esta imagen no dependa de que un tenant borre o modifique su producto.
- `Fuente` permite saber si la imagen vino de Open Food Facts (más "genérica") o fue subida a mano por un usuario real (más confiable para productos locales).
- Falta decidir: ¿guardamos historial de reemplazos del superadmin, o solo el estado actual? (por ahora, solo estado actual — se puede agregar auditoría después si hace falta).

Cambio en `Articulo`:

```prisma
model Articulo {
  ...
  CodigoBarraGenerado Boolean @default(false)
  ...
}
```

## 6. Fases de implementación (propuestas, a validar)

- **Fase 0 — ya hecho**: carga manual de foto, búsqueda por código de barra y por texto contra Open Food Facts, con modal de selección.
- **Fase 1**: agregar `CodigoBarraGenerado` a `Articulo` + migración, y setearlo desde el botón "Generar código automático" del form.
- **Fase 2**: crear tabla `ImagenProductoCache` + migración + bucket de Supabase dedicado para el caché (separado de los buckets por tenant).
- **Fase 3**: flujo de **escritura** — al guardar un producto (POST/PATCH `/api/productos`), aplicar las reglas de la sección 3.1/3.2 para poblar el caché.
- **Fase 4**: flujo de **lectura** — actualizar `/api/productos/buscar-foto` y `/api/productos/buscar-foto-texto` para consultar primero el caché propio (exacto y por texto) antes de ir a Open Food Facts; actualizar `SeleccionarFotoModal` para mostrar el origen de cada candidato.
- **Fase 5**: herramienta de administración para SUPERADMIN — ver, reemplazar o eliminar entradas del caché.
- **Fase 6 (futuro/opcional)**: métricas de hit-rate del caché vs. Open Food Facts, moderación de contenido, límites de tamaño/calidad de imagen al momento de cachear.

## 7. Decisiones confirmadas

1. **Bucket dedicado**: se crea un bucket de Supabase nuevo y separado (no uno de tenant) exclusivamente para las imágenes del caché. Consistente con la sección 5 (`ImageUrl` no debe depender del storage de ningún tenant).
2. **Panel de administración para SUPERADMIN**: sí, entra en el alcance. Ya estaba contemplado como Fase 5 (ver/reemplazar/eliminar entradas del caché) — queda confirmado que no es opcional, se va a construir.
3. **Distinguir origen en el modal** ("comunidad PuntoX" vs "Open Food Facts"): confirmado, se implementa. Ayuda a que el usuario entienda por qué una imagen puede ser más confiable que otra para su caso.
4. **Ambigüedad en la búsqueda por texto** (ej. "Coca Cola 500ml" vs "Coca Cola Zero 500ml"): no es un problema porque **el texto nunca decide solo** — es únicamente un mecanismo de descubrimiento para poblar el modal. La clave real y única sigue siendo `CodigoBarra` (columna `@unique` en `ImagenProductoCache`, ver sección 5): Coca Cola y Coca Cola Zero tienen códigos de barra distintos, así que quedan como filas separadas en la tabla. Si la búsqueda por texto trae ambas como candidatas, el usuario elige visualmente cuál corresponde a *su* producto — la responsabilidad de acertar la imagen correcta es del humano, no del texto. Esto confirma que el modelo de datos de la sección 5 ya es suficiente, sin cambios.

### Comentarios de la revisión

- Todas las respuestas son consistentes entre sí y con lo ya diseñado en las secciones 3–6; no hay contradicciones.
- Dato que faltaba y conviene fijar ahora que el bucket del caché es nuevo: igual que el bucket `articulos` de cada tenant, debería ser de **lectura pública** (el resto del sistema ya asume `getPublicUrl` para mostrar fotos sin autenticación adicional); solo la escritura queda restringida por las reglas de la sección 3.1.
- No quedan preguntas abiertas de diseño. El siguiente paso natural es pasar a un plan de implementación técnico más detallado (endpoints exactos, orden de migraciones, contrato del panel de superadmin) cuando quieras avanzar.
