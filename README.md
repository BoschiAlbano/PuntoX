# PuntoX

Sistema SaaS multi-tenant de gestión de punto de venta. Gestiona ventas, productos, clientes, empleados, caja y configuración con aislamiento completo por tenant.

d

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, HeroUI, TanStack Query, TailwindCSS
- **Backend:** Next.js API Routes, Prisma, PostgreSQL (Supabase)
- **Auth:** Supabase Auth, JWT, middleware de sesión
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

| Comando                    | Descripción            |
| -------------------------- | ---------------------- |
| `pnpm dev`                 | Servidor de desarrollo |
| `pnpm build`               | Build de producción    |
| `pnpm start`               | Servidor de producción |
| `pnpm lint`                | Ejecutar ESLint        |
| `pnpm test`                | Tests con Vitest       |
| `pnpm prisma:generate`     | Generar Prisma Client  |
| `pnpm prisma:migrate`      | Ejecutar migraciones   |
| `pnpm db-seed`             | Seed de base de datos  |

## Estructura del proyecto

```
PuntoX/
├── docs/                  # Documentación unificada
├── prisma/                # Schema y migraciones
├── src/
│   ├── app/               # Next.js App Router (rutas, API, páginas)
│   │   ├── (auth)/        # Login, registro
│   │   ├── (dashboard)/   # Ventas, productos, clientes, etc.
│   │   └── api/           # API Routes (~30+ endpoints)
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
- **[Estado actual](docs/ESTADO_ACTUAL.md)** — Funcionalidades y pendientes

Para desarrolladores y agentes IA: **[AGENTS.md](AGENTS.md)**
