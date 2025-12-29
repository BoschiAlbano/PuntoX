# 📚 Documentación de PuntoX

Bienvenido a la documentación completa del proyecto **PuntoX**, un sistema SaaS multi-tenant de gestión de punto de venta.

---

## 📖 Índice

### Documentación General
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura del proyecto, stack tecnológico y análisis completo
- **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios y mejoras implementadas
- **[SECURITY.md](./SECURITY.md)** - Correcciones de seguridad y mejores prácticas
- **[ROADMAP.md](./ROADMAP.md)** - Próximos pasos y mejoras planificadas
- **[TESTING.md](./TESTING.md)** - Guía de testing y tests implementados

### Documentación por Módulo
- **[modules/autenticacion.md](./modules/autenticacion.md)** - Sistema de autenticación y sesiones
- **[modules/permisos.md](./modules/permisos.md)** - Sistema de permisos y roles
- **[modules/configuracion.md](./modules/configuracion.md)** - Configuración del sistema
- **[modules/clientes.md](./modules/clientes.md)** - Gestión de clientes
- **[modules/empleados-roles.md](./modules/empleados-roles.md)** - Gestión de empleados y roles
- **[modules/ventas.md](./modules/ventas.md)** - Sistema de ventas

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- PostgreSQL (Supabase)
- npm o yarn

### Instalación
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db-seed
npm run dev
```

### Comandos Útiles
```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm test                 # Ejecutar tests
npm run lint             # Linter

# Base de datos
npx prisma studio        # Abrir Prisma Studio
npx prisma migrate dev    # Crear y aplicar migración
npx prisma generate       # Regenerar cliente Prisma
npm run db-seed          # Ejecutar seed de datos
```

---

## 🏗️ Arquitectura

**PuntoX** es un sistema SaaS multi-tenant desarrollado con:
- **Frontend:** Next.js 15 (App Router), TypeScript, HeroUI, TanStack Query
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para más detalles.

---

## 📝 Convenciones

### Commits
Usamos commits semánticos:
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

### Código
- TypeScript estricto
- Validación con Zod
- Manejo de errores centralizado (`handleError`)
- Transacciones para operaciones críticas

---

## 🔒 Seguridad

- Multi-tenancy con aislamiento por `TenantId`
- Validación de permisos en todas las rutas
- Autenticación con Supabase Auth
- JWT con claims de permisos

Ver [SECURITY.md](./SECURITY.md) para más detalles.

---

## 📊 Estado del Proyecto

**Versión:** 1.0.0  
**Estado:** 🟢 En desarrollo activo  
**Cobertura de tests:** ~5-10%  
**Última actualización:** Diciembre 2024

---

## 🤝 Contribuir

1. Crear una rama desde `agustin-V1`
2. Realizar cambios
3. Ejecutar tests: `npm test`
4. Crear commit descriptivo
5. Push y crear PR

---

## 📞 Soporte

Para preguntas o problemas:
- Revisar la documentación en `docs/`
- Consultar [CHANGELOG.md](./CHANGELOG.md) para cambios recientes
- Ver [ROADMAP.md](./ROADMAP.md) para mejoras planificadas

---

**Última actualización:** Diciembre 2024

