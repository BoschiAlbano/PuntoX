# 🏢 Multi-Sucursal en PuntoX

## Resumen

Este documento describe la implementación del sistema multi-sucursal en PuntoX, permitiendo que un Tenant (comercio) tenga múltiples sucursales/locales.

## Arquitectura

```
Tenant (Comercio)
├── Sucursal 1 (Casa Central) ★ Principal
│   ├── Usuarios asignados
│   ├── Stock propio
│   ├── Cajas
│   ├── Comprobantes
│   └── Movimientos
├── Sucursal 2 (Sucursal Norte)
│   ├── Usuarios asignados
│   ├── Stock propio
│   └── ...
└── Sucursal N
```

## Modelos de Datos

### Nuevas Tablas

| Tabla | Descripción |
|-------|-------------|
| `Sucursal` | Sucursales del tenant |
| `UsuarioSucursal` | Relación Usuario ↔ Sucursal (M:N) |
| `ArticuloStock` | Stock por sucursal |

### Tablas Modificadas (con SucursalId)

| Tabla | Motivo |
|-------|--------|
| `Caja` | Cada caja pertenece a una sucursal |
| `Gasto` | Gastos por sucursal |
| `Movimiento` | Movimientos de caja por sucursal |
| `Comprobante` | Ventas emitidas en sucursal |
| `BajaArticulo` | Ajustes de stock por sucursal |
| `Cheque` | Cheques recibidos en sucursal |
| `DepositoCheques` | Depósitos desde sucursal |
| `Contador` | Numeración por sucursal |
| `AuditoriaEmpleado` | Auditoría con sucursal (opcional) |

### Tablas SIN SucursalId (Globales del Tenant)

| Tabla | Motivo |
|-------|--------|
| `Articulo` | Catálogo de productos global |
| `Marca`, `Rubro`, `UnidadMedida` | Catálogos globales |
| `Persona`, `Persona_Cliente` | Clientes del tenant |
| `Proveedor` | Proveedores del tenant |
| `Perfiles`, `Permiso` | Permisos globales |
| `Configuracion` | Config del tenant |
| `Usuario` | Usuarios globales |

## Migración

### Orden de Ejecución

```bash
# 1. Crear tablas nuevas
psql -f prisma/migrations/multi_sucursal/01_create_sucursal_tables.sql

# 2. Agregar columnas SucursalId (nullable)
psql -f prisma/migrations/multi_sucursal/02_add_sucursal_columns.sql

# 3. Backfill: crear sucursales y migrar datos
psql -f prisma/migrations/multi_sucursal/03_backfill_sucursales.sql

# 4. (Opcional) Hacer SucursalId NOT NULL
psql -f prisma/migrations/multi_sucursal/04_make_sucursal_required.sql

# 5. (Opcional) Aplicar políticas RLS
psql -f prisma/migrations/multi_sucursal/05_rls_policies.sql
```

### Verificación Post-Migración

```sql
SELECT 'Tenants' as tabla, COUNT(*) as total FROM "Tenant" WHERE "EstaEliminado" = false
UNION ALL
SELECT 'Sucursales', COUNT(*) FROM "Sucursal"
UNION ALL
SELECT 'UsuarioSucursal', COUNT(*) FROM "UsuarioSucursal"
UNION ALL
SELECT 'ArticuloStock', COUNT(*) FROM "ArticuloStock"
UNION ALL
SELECT 'Cajas sin sucursal', COUNT(*) FROM "Caja" WHERE "SucursalId" IS NULL;
```

## API Endpoints

### Sucursales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sucursales` | Listar sucursales del tenant |
| POST | `/api/sucursales` | Crear sucursal |
| GET | `/api/sucursales/[id]` | Obtener sucursal |
| PATCH | `/api/sucursales/[id]` | Actualizar sucursal |
| DELETE | `/api/sucursales/[id]` | Eliminar sucursal |
| GET | `/api/sucursales/mis-sucursales` | Sucursales del usuario |
| POST | `/api/sucursales/cambiar` | Cambiar sucursal activa |

## Uso en Código

### Obtener Contexto de Sucursal

```typescript
import { getAuthWithBranch } from "@/lib/sucursal";

export async function GET(req: NextRequest) {
  const { tenantId, sucursalId, error } = await getAuthWithBranch();
  
  if (error) return error;
  
  // Usar tenantId y sucursalId para filtrar queries
}
```

### Queries con Scope

```typescript
import { withScope } from "@/lib/sucursal";

export async function GET(req: NextRequest) {
  const { tenantId, sucursalId, error } = await getAuthWithBranch();
  
  if (error) return error;
  
  // Crear cliente con scope
  const scoped = withScope({ tenantId, sucursalId });
  
  // Queries automáticamente filtradas
  const cajaAbierta = await scoped.caja.findOpen();
  const comprobantes = await scoped.comprobante.findMany();
  const stock = await scoped.articuloStock.findByArticulo(articuloId);
}
```

### Componente Selector

```tsx
import { SucursalSelector } from "@/components/sucursal";

// En el Navbar
<SucursalSelector 
  hideIfSingle={true}
  onBranchChange={(id) => console.log("Cambió a:", id)}
/>
```

## Permisos

### Actual (Nivel Tenant)

Los permisos actuales se mantienen a nivel tenant. Un usuario con permiso "ventas:crear" puede crear ventas en cualquier sucursal a la que tenga acceso.

### Futuro (Nivel Sucursal)

Para implementar permisos por sucursal:

1. Agregar tabla `PermisoSucursal`:
```prisma
model PermisoSucursal {
  UsuarioId   BigInt
  SucursalId  BigInt
  PermisoId   BigInt
  // ...
}
```

2. Modificar helpers de permisos para verificar por sucursal.

## Checklist de Pruebas

### Funcionales

- [ ] Tenant con 1 sucursal: autoselección funciona
- [ ] Tenant con N sucursales: selector aparece
- [ ] Cambio de sucursal: datos se actualizan
- [ ] Caja: solo ve/opera en su sucursal
- [ ] Ventas: se crean en la sucursal activa
- [ ] Stock: se descuenta de la sucursal correcta
- [ ] Comprobantes: numeración por sucursal

### Seguridad

- [ ] No puede ver datos de otra sucursal (aunque manipule front)
- [ ] No puede cambiar a sucursal sin acceso
- [ ] Cookie HttpOnly para sucursal activa
- [ ] RLS bloquea acceso cross-tenant y cross-branch

### Migración

- [ ] Todos los tenants tienen sucursal "Casa Central"
- [ ] Todos los usuarios asignados a sucursal principal
- [ ] Stock migrado a ArticuloStock
- [ ] Registros existentes con SucursalId correcto
- [ ] Contadores duplicados por sucursal

## Troubleshooting

### Usuario sin sucursal asignada

```sql
-- Verificar usuarios sin sucursal
SELECT u."Id", u."Nombre", u."TenantId"
FROM "Usuario" u
WHERE u."EstaEliminado" = false
AND NOT EXISTS (
  SELECT 1 FROM "UsuarioSucursal" us
  WHERE us."UsuarioId" = u."Id"
);

-- Asignar a sucursal principal
INSERT INTO "UsuarioSucursal" ("UsuarioId", "SucursalId", "TenantId", "EsDefault")
SELECT u."Id", s."Id", u."TenantId", true
FROM "Usuario" u
JOIN "Sucursal" s ON s."TenantId" = u."TenantId" AND s."EsPrincipal" = true
WHERE u."EstaEliminado" = false
AND NOT EXISTS (
  SELECT 1 FROM "UsuarioSucursal" us
  WHERE us."UsuarioId" = u."Id"
);
```

### Tenant sin sucursal

```sql
-- Crear sucursal para tenants sin una
INSERT INTO "Sucursal" ("TenantId", "Nombre", "EsPrincipal", "EstaActiva", "EstaEliminado")
SELECT t."Id", 'Casa Central', true, true, false
FROM "Tenant" t
WHERE t."EstaEliminado" = false
AND NOT EXISTS (
  SELECT 1 FROM "Sucursal" s WHERE s."TenantId" = t."Id"
);
```

## Archivos Clave

```
prisma/
├── schema.prisma                          # Modelos actualizados
└── migrations/multi_sucursal/
    ├── 01_create_sucursal_tables.sql      # Crear tablas
    ├── 02_add_sucursal_columns.sql        # Agregar columnas
    ├── 03_backfill_sucursales.sql         # Migrar datos
    ├── 04_make_sucursal_required.sql      # NOT NULL (opcional)
    └── 05_rls_policies.sql                # Políticas RLS

src/lib/sucursal/
├── index.ts                               # Exports
├── context.ts                             # Contexto de sucursal
├── getAuthWithBranch.ts                   # Helper de auth + sucursal
└── scopedPrisma.ts                        # Wrapper Prisma con scope

src/app/api/sucursales/
├── route.ts                               # GET/POST sucursales
├── [id]/route.ts                          # CRUD individual
├── cambiar/route.ts                       # Cambiar sucursal activa
└── mis-sucursales/route.ts                # Sucursales del usuario

src/components/sucursal/
├── index.ts                               # Exports
└── SucursalSelector.tsx                   # Selector en navbar
```

