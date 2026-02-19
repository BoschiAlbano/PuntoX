# PuntoX

Sistema SaaS multi-tenant de gestión de punto de venta. Gestiona ventas, productos, clientes, empleados, caja y configuración con aislamiento completo por tenant.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, HeroUI, TanStack Query, TailwindCSS
- **Backend:** Next.js API Routes, Prisma, PostgreSQL (Supabase)
- **Auth:** Supabase Auth, JWT, middleware de sesión
- **Validación:** Zod

## Inicio rápido

```bash
npm install
# Configurar .env (DATABASE_URL, NEXT_PUBLIC_SUPABASE_*)
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run test` | Tests con Vitest |
| `npm run prisma:generate` | Generar Prisma Client |
| `npm run prisma:migrate` | Ejecutar migraciones |
| `npm run db-seed` | Seed de base de datos |

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
