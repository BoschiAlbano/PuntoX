# 📦 Módulos de Negocio — PuntoX

Este directorio contiene la documentación técnica y funcional de cada uno de los módulos de dominio que componen el sistema **PuntoX**.

---

## Índice de Módulos

| Módulo | Documento | Descripción principal | APIs Principales |
|---|---|---|---|
| 🛒 **Ventas y POS** | [ventas.md](ventas.md) | Punto de venta rápido, carrito, formas de pago, comprobantes y contadores | `/api/ventas`, `/api/comprobantes` |
| 👥 **Clientes** | [clientes.md](clientes.md) | Catálogo de clientes, límites de crédito, cuentas corrientes y cobranzas | `/api/clientes`, `/api/cobros`, `/api/CtaCteCliente` |
| 🚚 **Proveedores** | [proveedores.md](proveedores.md) | Directorio de proveedores, datos fiscales y cuentas corrientes | `/api/proveedores` |
| 📦 **Compras** | [compras.md](compras.md) | Recepción de mercadería, ajuste de costos y actualización de precios | `/api/compras` |
| 💰 **Caja y Gastos** | [caja.md](caja.md) | Turnos de caja, apertura/cierre, arqueo de fondos y gastos operativos | `/api/caja`, `/api/cajas`, `/api/gastos` |
| 🏷️ **Catálogo y Stock** | [../productos/README.md](../productos/README.md) | Productos, rubros, marcas, stock multi-sucursal y listas de precios | `/api/productos`, `/api/rubros`, `/api/marcas` |
| 🏢 **Multi-Sucursal** | [../multi-sucursal/README.md](../multi-sucursal/README.md) | Aislamiento y gestión independiente por sucursal física | `/api/sucursales` |
| ⚡ **Facturación AFIP** | [facturacion-afip.md](facturacion-afip.md) | Integración fiscal ARCA/AFIP (Facturas A/B/C, Notas de Crédito, CAE) | `/api/facturacion/electronica/*` |
| 🔐 **Autenticación y 2FA** | [autenticacion.md](autenticacion.md) | Supabase Auth, JWT, cookies de sesión, TOTP y dispositivos confiables | `/api/auth/*` |
| 🛡️ **Permisos y Roles** | [permisos.md](permisos.md) | Matriz de permisos granulares (`requirePermiso`) y jerarquía de roles | `/api/permisos`, `/api/roles` |
| 👔 **Empleados y Auditoría** | [empleados-roles.md](empleados-roles.md) | Personal, usuarios del sistema y registro de auditoría administrativa | `/api/empleados`, `/api/auditoria-empleados` |
| ⚙️ **Configuración** | [configuracion.md](configuracion.md) | Perfil del comercio, datos fiscales, preferencias de venta y branding | `/api/configuracion/*`, `/api/tenant` |
| 📊 **Analíticas y KPIs** | [analiticas.md](analiticas.md) | Dashboard ejecutivo, reportes financieros y métricas de venta | `/api/analiticas/*`, `/api/dashboard` |

---

## Arquitectura de Módulos

Cada módulo sigue el estándar unificado de arquitectura:

1. **Persistencia**: Modelos Prisma en `prisma/schema.prisma` con aislamiento estricto por `TenantId` y borrado lógico (`EstaEliminado: Boolean`).
2. **Backend**: Endpoints en `src/app/api/[modulo]/` protegidos con `getAuthContext({ req, permission })`.
3. **Validación**: Esquemas Zod en `src/lib/validations/[modulo].schema.ts` y manejo centralizado de errores con `handleError()`.
4. **Frontend**: Pantallas en `src/app/(dashboard)/[modulo]/` integradas con React Query (`useGenericApi`) y componentes `GenericCrud` / `GenericTable`.
