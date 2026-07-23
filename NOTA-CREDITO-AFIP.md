# Nota de Crédito electrónica (AFIP/ARCA) — Investigación y plan

> Estado: **definición**, aún no implementado. Este documento junta lo que
> encontré investigando cómo ARCA exige las Notas de Crédito (NC) y un plan
> de implementación concreto para conectarlo al código existente.

## 1. Estado actual (confirmado leyendo el código)

- Hoy la NC se crea, afecta stock (revierte) y caja (sale plata), pero
  **nunca se declara a AFIP**. `TIPOS_COMPROBANTE_FISCAL` en
  `src/lib/constants/afip.ts:25` es `[1, 2, 3]` (Factura A/B/C) — la NC
  (tipo local `6`) queda afuera de `requiereAutorizacionAfip()`, así que el
  bloque de emisión en `src/app/api/comprobantes/route.ts:498-518` nunca se
  ejecuta para una NC.
- El código ya tiene los **códigos AFIP de NC definidos pero sin usar**:
  `CBTE_TIPO_AFIP.NOTA_CREDITO_A/B/C` = `3/8/13`
  (`src/lib/constants/afip.ts:5,8,11`). El mapeo
  `TIPO_COMPROBANTE_LOCAL_A_AFIP` (líneas 18-22) solo tiene entradas para
  Factura A/B/C — no hay (ni puede haber, ver punto 3) una entrada directa
  para NC.
- `prepararDatosAfip()` (`facturacion.service.ts:402+`) resuelve el cliente
  del comprobante leyendo `comprobante.Comprobante_Factura?.Persona_Cliente`
  (línea 412). Una NC no tiene `Comprobante_Factura` — usa
  `Comprobante_NotaCredito` — así que si se autorizara una NC tal cual está
  el código hoy, siempre la trataría como "Consumidor Final" sin importar
  quién sea el cliente real.
- El SDK que ya está instalado, **`@arcasdk/core@1.3.1`**, soporta
  comprobantes asociados de forma nativa. Su tipo `IVoucher`
  (`node_modules/.pnpm/@arcasdk+core@1.3.1/.../voucher.types.d.ts`) tiene:
  ```ts
  interface IVoucher {
    // ...todos los campos que ya se usan hoy...
    CbtesAsoc?: ICbtesAsoc[];
  }
  interface ICbtesAsoc {
    Tipo: number;      // código AFIP del comprobante que se acredita
    PtoVta: number;    // PDV con el que ARCA autorizó ese comprobante
    Nro: number;       // número con el que ARCA lo autorizó
    Cuit: string;      // CUIT del emisor
    CbteFch?: string;  // fecha del comprobante asociado (opcional)
  }
  ```
  No hace falta actualizar ninguna dependencia — solo pasar este campo.

## 2. Cómo exige ARCA la Nota de Crédito (investigación)

- Para emitir una NC electrónica, **es obligatorio declarar qué comprobante
  se está acreditando** vía el array `CbtesAsoc` en el mismo pedido
  `FECAESolicitar` (no es una llamada separada).
- **La letra de la NC tiene que coincidir con la de la factura acreditada**:
  Factura A → NC-A (código 3), Factura B → NC-B (código 8), Factura C →
  NC-C (código 13). No existe un único "tipo Nota de Crédito" genérico en
  AFIP — son 3 códigos distintos.
- `PtoVta`/`Nro` en `CbtesAsoc` tienen que ser el punto de venta y número
  **con los que ARCA ya autorizó** la factura original (el `PuntoVenta` y
  `CbteNumero` guardados en su fila de `FacturaElectronica`), no el número
  interno del sistema (`Comprobante.Numero`).
- Si el punto de venta del comprobante asociado es electrónico, AFIP
  valida que ese número exista en sus propias bases para ese PDV/tipo — es
  decir, **si la factura original nunca fue autorizada por AFIP, la NC
  electrónica va a ser rechazada**. Hay que contemplar ese caso.
- El campo `Cuit` en `CbtesAsoc`: la documentación pública que encontré no
  es 100% consistente sobre si es obligatorio siempre (el SDK lo tipa como
  requerido); lo más seguro es completarlo con el CUIT propio del emisor
  (el mismo `arcaConfig.cuit` que ya se usa para todo lo demás) y confirmar
  en homologación que ARCA no lo rechaza.

Fuentes: documentación de AFIP SDK (afipsdk.com) y foros de desarrolladores
sobre WSFEv1 — resumidas arriba porque no son un manual oficial único, pero
coinciden entre sí y con el tipado del SDK ya instalado.

## 3. Por qué no alcanza con "agregar 6 al mapeo"

El tipo local `NOTA_CREDITO = 6` es uno solo, pero AFIP necesita saber si es
NC-A, NC-B o NC-C **según la factura que se está acreditando** — ese dato no
está en el tipo local de la NC, está en el tipo local de la **factura
asociada** (`Comprobante_NotaCredito.ComprobanteId` → esa `Comprobante`).
Por eso el código no puede resolver el `CbteTipo` de una NC con un simple
`TIPO_COMPROBANTE_LOCAL_A_AFIP[6]` — necesita ir a buscar la factura
asociada primero.

## 4. Plan de implementación

### Paso 1 — Helper de mapeo NC → letra AFIP
En `src/lib/constants/afip.ts`:
- Agregar `NOTA_CREDITO` a `TIPOS_COMPROBANTE_FISCAL` (para que
  `requiereAutorizacionAfip()` devuelva `true` y el flujo de venta intente
  emitirla).
- Nueva función `getCbteTipoNotaCredito(tipoFacturaOriginalLocal: number): number | null`
  que mapea `FACTURA_A→3`, `FACTURA_B→8`, `FACTURA_C→13`, `null` si no es
  ninguna de esas (caso de error).

### Paso 2 — Ampliar la consulta del comprobante en `autorizarComprobante`
En `facturacion.service.ts`, el `prisma.comprobante.findFirst` (líneas
129-161) necesita incluir, cuando el comprobante es una NC:
- `Comprobante_NotaCredito` → su `Comprobante` asociada → esa
  `Comprobante_Factura` (para el cliente) **y** su `FacturaElectronica`
  (para `PuntoVenta`/`CbteNumero` ya autorizados por AFIP).
- Actualizar el tipo `ComprobanteConDetalle` con estos campos opcionales.

### Paso 3 — Resolver `cbteTipoAfip` con caso especial para NC
Reemplazar la línea única `TIPO_COMPROBANTE_LOCAL_A_AFIP[comprobante.TipoComprobante]`
por: si es Factura A/B/C, igual que hoy; si es NC, usar
`getCbteTipoNotaCredito()` sobre el tipo de la factura asociada.

### Paso 4 — Guardia: factura asociada no autorizada
Antes de armar el pedido a ARCA: si es NC y la factura asociada no tiene
`FacturaElectronica` con `Estado=AUTORIZADO`, devolver un error claro ("no
se puede emitir la Nota de Crédito electrónica: la factura asociada no fue
autorizada por AFIP") en vez de mandarlo a ARCA y que lo rechace.

### Paso 5 — `prepararDatosAfip`: cliente + `CbtesAsoc`
- Resolver el cliente desde la factura asociada cuando es NC (no desde
  `comprobante.Comprobante_Factura`, que para una NC es `null`).
- Armar `CbtesAsoc: [{ Tipo, PtoVta, Nro, Cuit: arcaConfig.cuit.toString() }]`
  con los datos de la factura asociada ya autorizada (paso 2/4).

### Paso 6 — UI: Caja Actual y reprocesar
- `CajaActual.tsx`: los arrays `tiposAfip`/`tiposAfipAcciones` (usados para
  la columna de estado FE, el botón "Emitir FA" por fila y el filtro
  "Filtrar sin FE") hoy son `[FACTURA_A, FACTURA_B, FACTURA_C]` — agregar
  `NOTA_CREDITO` para que la NC aparezca igual que una factura en esa
  columna y se pueda reprocesar desde ahí.
- Los endpoints de reprocesar (individual y bulk) ya llaman a
  `autorizarComprobante` de forma genérica — no necesitan cambios más allá
  de lo de arriba, una vez que el servicio soporte NC.
- Ticket/detalle de comprobante (`ComprobanteDetalleScreen.tsx`) ya muestra
  CAE/QR genéricamente desde `selectedTicket.FacturaElectronica` — debería
  funcionar sin cambios apenas la NC tenga su fila de `FacturaElectronica`.

### Paso 7 — Verificación
- Tests unitarios para `getCbteTipoNotaCredito` y para la resolución de
  `cbteTipoAfip`/cliente/`CbtesAsoc` en `autorizarComprobante` (mockeando
  una NC con su factura asociada).
- Probar en **homologación** de ARCA (no producción) antes de habilitarlo
  para clientes reales, dado que el campo `Cuit` de `CbtesAsoc` no está
  100% confirmado como obligatorio y conviene validarlo ahí primero.
- Actualizar `PLANES-SAAS.md` si corresponde: la Nota de Crédito ya está
  incluida en el gating de `incluyeAFIP` (usa el mismo
  `isFacturacionElectronicaHabilitada`), así que no hace falta tocar nada
  del sistema de planes para esto.

## 5. Decisiones abiertas (para confirmar antes de empezar)

1. ¿Qué pasa si el usuario intenta crear una NC referenciando una factura
   que nunca se autorizó por AFIP (plan sin AFIP, o AFIP no configurado en
   ese momento)? Propuesta: permitir crear la NC local igual que hoy
   (afecta stock/caja), pero sin declarar a AFIP y avisando por qué,
   en vez de bloquear la creación de la NC completa.
2. ¿El campo `Cuit` de `CbtesAsoc` va con el CUIT del emisor (tu negocio) en
   todos los casos, o hay algún escenario de tu operación donde debería ser
   otro? (Lo estándar es el propio, pero preferí preguntar antes de asumir).
