# PuntoX

**PuntoX** es un sistema SaaS multi-tenant de gestión comercial (punto de venta / ERP liviano) pensado para comercios que necesitan controlar ventas, stock, clientes, proveedores y finanzas desde un mismo lugar, con soporte multi-sucursal y aislamiento completo de datos por tenant (comercio).

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, HeroUI, TanStack Query, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL (Supabase)
- **Auth:** Supabase Auth, JWT, middleware de sesión, 2FA (TOTP)
- **Validación:** Zod

## Inicio rápido

```bash
pnpm install
# Configurar .env (DATABASE_URL, NEXT_PUBLIC_SUPABASE_*)
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

## Scripts

| Comando                | Descripción            |
| ----------------------- | ---------------------- |
| `pnpm dev`             | Servidor de desarrollo |
| `pnpm build`           | Build de producción    |
| `pnpm start`           | Servidor de producción |
| `pnpm lint`            | Ejecutar ESLint        |
| `pnpm test`            | Tests con Vitest       |
| `pnpm prisma:generate` | Generar Prisma Client  |
| `pnpm prisma:migrate`  | Ejecutar migraciones   |
| `pnpm db-seed`         | Seed de base de datos  |

---

## Funcionalidades

### 🛒 Ventas y facturación

- **Punto de venta:** Carrito de productos, búsqueda rápida (`Ctrl+K`), descuentos, cálculo automático de IVA.
- **Comprobantes:** Facturas (A/B/C), presupuestos, remitos y notas de crédito.
- **Formas de pago:** Efectivo, tarjeta (crédito/débito), cheque, cuenta corriente, transferencia — incluso combinando varias en una misma venta.
- **Facturación electrónica (AFIP/ARCA):** Autorización de comprobantes fiscales para obtener el CAE, con reintento individual o en lote de comprobantes que fallaron, validado contra el plan del tenant y sus certificados fiscales.

### 📦 Control de stock

- Catálogo de productos (`Articulo`) con marca, rubro, IVA, unidad de medida, foto e imagen cacheada por código de barras.
- **Múltiples listas de precios** (ej. minorista/mayorista) con distintos porcentajes de ganancia.
- **Stock por sucursal:** el producto es único y compartido entre sucursales, pero la cantidad de stock se controla de forma independiente en cada local.
- Descuento automático de stock al vender, control de stock negativo y alertas de stock crítico.
- Combos y promociones por cantidad.

### 👥 Clientes

- CRUD completo (datos fiscales, condición de IVA, localidad).
- **Cuenta corriente de clientes:** registro de deudas (facturas a cta. cte.) y pagos, con movimientos de débito/crédito y saldo actualizado.
- **Cobros:** listado FIFO de facturas pendientes de pago para registrar el ingreso de dinero contra ellas.
- Validación de límites de crédito por cliente.

### 🚚 Proveedores y compras

- CRUD de proveedores (razón social, CUIT, contacto, condición de IVA).
- **Compras:** registro de compras a proveedores con detalle de artículos y costos; actualiza stock y precios de venta al confirmarse.
- **Cuenta corriente de proveedores:** deudas por compras a crédito y pagos realizados, análoga a la de clientes.

### 💰 Caja y gastos

- Apertura y cierre de caja por sucursal, con monto inicial/final y cálculo de ganancias.
- Movimientos de caja: ventas, cobros y gastos, con resumen diario e historial de cajas anteriores.
- **Gastos:** registro de gastos operativos (alquiler, servicios, etc.) clasificados por conceptos configurables, con soporte de múltiples formas de pago.

### 🏢 Multi-sucursal

- Cada sucursal maneja su propia caja, stock y numeración de comprobantes.
- Un usuario puede tener acceso a varias sucursales y cambiar la "sucursal activa" desde un selector; todas las operaciones quedan filtradas por esa sucursal.

### 🔐 Usuarios, roles y seguridad

- **Empleados:** CRUD, vinculación con usuarios de acceso al sistema, roles y permisos.
- **Permisos granulares** por funcionalidad (`requirePermiso`), con rol ADMINISTRADOR (permisos automáticos) y EMPLEADO (permisos asignables).
- **Auditoría de empleados:** historial de acciones administrativas (alta, edición, suspensión, cambio de rol/contraseña) para trazabilidad.
- **Autenticación:** Supabase Auth con JWT y refresh automático.
- **2FA (TOTP):** doble factor de autenticación con códigos de backup, activable/forzable por tenant; dispositivos de confianza para omitirlo en logins posteriores; gestión de sesiones activas (dispositivo, IP, ubicación) con cierre remoto.

### 📊 Analíticas

- Dashboard con KPIs, gráficas y alertas de negocio (ventas, stock, caja, cuentas corrientes).

### 🔔 Notificaciones

- Alertas internas casi en tiempo real (polling) para eventos críticos: stock bajo, límites de crédito superados, descuadres de caja, con deduplicación y auto-resolución.

### ⚙️ Configuración del comercio

- Perfil del negocio (datos fiscales y de contacto).
- Preferencias de venta (control de stock, caja, formas de pago).
- Datos fiscales y certificados para facturación electrónica (AFIP).
- Branding (logo, colores).
- Seguridad (2FA, políticas de contraseñas).
- Notificaciones y onboarding guiado para nuevos comercios.

---

## Estructura del proyecto

```
PuntoX/
├── docs/                  # Documentación unificada
├── prisma/                # Schema y migraciones
├── src/
│   ├── app/               # Next.js App Router (rutas, API, páginas)
│   │   ├── (auth)/        # Login, registro
│   │   ├── (dashboard)/   # Ventas, productos, clientes, proveedores, compras, caja, etc.
│   │   └── api/           # API Routes (40+ endpoints)
│   ├── components/       # Componentes React
│   │   └── shared/        # GenericCrud, GenericTable, modales
│   ├── hooks/             # useGenericApi, useProductos, etc.
│   └── lib/               # Auth, validaciones, utilidades
└── testing/               # Guías y planes de testing
```

## Documentación

Toda la documentación está en **[docs/](docs/README.md)**:

- **[Índice general](docs/README.md)** — Punto de entrada
- **[Arquitectura](docs/ARCHITECTURE.md)** — Stack, estructura, modelo de datos
- **[CRUD y tablas genéricas](docs/ui/crud-tablas-genericas.md)** — GenericCrud, GenericTable, export
- **[Módulos](docs/modules/)** — Ventas, clientes, empleados, configuración
- **[Multi-sucursal](docs/multi-sucursal/README.md)** — Manejo de sucursales
- **[Estado actual](docs/ESTADO_ACTUAL.md)** — Funcionalidades y pendientes

Para desarrolladores y agentes IA: **[AGENTS.md](AGENTS.md)**
