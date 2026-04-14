# Sistema de Notificaciones

Este documento detalla el funcionamiento del sistema de notificaciones en tiempo real para PuntoX, diseñado para alertar a los usuarios y administradores sobre eventos críticos del negocio (como quiebre de stock, límites de crédito, descuadres de caja, etc).

## 1. Arquitectura Técnica

El sistema está construido bajo una arquitectura de "erver State Management" apoyándose fuertemente en las capacidades asíncronas de la DB y del cliente:

- **Base de Datos:** Prisma ORM (`model Notificacion`).
- **Backend:** Next.js Route Handlers (`/api/notificaciones`) - GET (listar), PATCH (marcar leído) y POST (crear evento).
- **Frontend State:** TanStack Query (`useQuery`, `useMutation`).
- **Componente Visual:** `NotificacionesDropdown` que envuelve un popover de HeroUI anclado en `DashboardHeader`.

## 2. Flujo de Emisión de Eventos (Backend)

La responsabilidad de emitir alertas recae 100% sobre el Backend para garantizar seguridad y consistencia.
Cuando ocurre un evento crítico, debes hacer una petición unificada o crear el registro en Prisma.

### Prevenir Spam (Deduplicación)
Para evitar que una alerta que ocurra repetidas veces (como un producto quedándose repetidas veces sin stock durante un cobro) inunde la bandeja del administrador, el modelo soporta las propiedades `EntidadTipo` y `EntidadId`.

**Ejemplo de creación en Backend:**
```typescript
import prisma from "@/DB/prisma";

// En medio del controlador de ventas, al detectar bajo stock:
async function manejarBajoStock(articuloId) {
  // Primero verificamos si YA hay una notificación ACTIVA (no leída) por esto
  const existente = await prisma.notificacion.findFirst({
    where: { 
      TenantId: tenantId, 
      EntidadTipo: "ARTICULO_STOCK", 
      EntidadId: articuloId.toString(), 
      Leida: false 
    }
  });

  if (!existente) {
    // Solo si no existe una alerta pendiente creamos una nueva
    await prisma.notificacion.create({
      data: {
         TenantId: tenantId,
         // Si omitimos UsuarioId, se asume que esta alerta es GLOBAL para el tenant (o al menos los administradores)
         Tipo: "WARNING",
         Titulo: "Stock Crítico Mínimo",
         Mensaje: \`El artículo \${articulo.Descripcion} ha alcanzado su límite mínimo\`,
         EntidadTipo: "ARTICULO_STOCK",
         EntidadId: articuloId.toString(),
         AccionUrl: \`/productos?q=\${articulo.Codigo}\`
      }
    });
  }
}
```

## 3. Flujo de Auto-Resolución (Limpieza Inversa)

El sistema soporta la "Auto-Resolución" para apagar el globo rojo de las notificaciones sin que el usuario tenga que marcarlas manualmente, mejorando drásticamente el UX.

Por ejemplo, si un usuario ingresa mercadería (aumentando el stock por encima del límite), el backend puede "apagar" silenciosamente las notificaciones pendientes:

```typescript
// En el endpoint de agregar stock:
await prisma.notificacion.updateMany({
  where: {
    TenantId: tenantId,
    EntidadTipo: "ARTICULO_STOCK",
    EntidadId: articuloId.toString(),
    Leida: false
  },
  data: { Leida: true }
});
```

## 4. Consumo en Frontend

El archivo principal que orquesta el sistema es el Hook personalizado `useNotificaciones.ts`.
* Configuración actual: **Polling cada 2 minutos (`refetchInterval: 120000`)**.

Si un usuario marca una alerta como leída, `React Query` invalida automática y localmente la caché utilizando `onSuccess: () => queryClient.invalidateQueries(["notificaciones"])`, actualizando el listado instantáneamente para dar la mejor percepción de velocidad.

## 5. Extensibilidad Futura

Para el futuro, este modelo se puede extender agregando:
- **Websockets (Socket.io) / Server-Sent Events (SSE):** Si en el futuro se necesita que las notificaciones salten en menos de 1 segundo (ej: "Han abierto tu turno de caja en otra PC"), el polling podría reemplazarse por una suscripción constante a Supabase Realtime o Pusher.
- **Canales de envío:** Agregar campos booleanos `SendEmail`, `SendWhatsApp` configurables por el usuario.
