# 📚 Documentación del Proyecto PuntoX

Bienvenido a la documentación del proyecto PuntoX.

## Índice de Documentación

### Módulos Principales

- **[Analíticas](./ANALITICAS.md)** - Dashboard de métricas, KPIs, gráficas y alertas
  - Endpoints API
  - Hooks personalizados
  - Componentes visuales
  - Guía de uso

### Seguridad

- **[CSRF Implementation](./CSRF_IMPLEMENTATION.md)** - Documentación sobre tokens CSRF
  - ¿Qué es CSRF y por qué implementarlo?
  - Cómo usar tokens CSRF en endpoints
  - Ejemplos prácticos de implementación
  - Endpoints que deberían usar CSRF
  - Guía de mantenimiento

### UX y Diseño

- **[UX Improvements](./UX_IMPROVEMENTS.md)** - Mejoras visuales y de experiencia de usuario
  - Mejoras en headers (parallax, glow, sombras)
  - Skeleton loaders con shimmer effect
  - Micro-animaciones y transiciones
  - Accesibilidad mejorada
  - Responsive design
  - Optimizaciones de performance
  - Tabs mejoradas

### Próximamente

- Configuración
- Empleados y Permisos
- Productos y Stock
- Ventas y Caja
- Clientes y Cuenta Corriente

---

## Estructura del Proyecto

```
PuntoX/
├── docs/                    # Documentación
├── src/
│   ├── app/                # Rutas y páginas (Next.js App Router)
│   ├── components/         # Componentes React reutilizables
│   ├── hooks/              # Hooks personalizados
│   ├── lib/                # Utilidades y helpers
│   └── scripts/            # Scripts de utilidad
└── prisma/                 # Schema y migraciones de base de datos
```

---

## Guías Rápidas

### Inicio Rápido

1. Instalar dependencias: `npm install`
2. Configurar variables de entorno (`.env`)
3. Ejecutar migraciones: `npm run prisma:migrate`
4. Iniciar servidor: `npm run dev`

### Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run lint` - Linter
- `npm run prisma:generate` - Generar Prisma Client
- `npm run prisma:migrate` - Ejecutar migraciones

---

## Contribuir

Para contribuir al proyecto, por favor revisa la documentación específica de cada módulo antes de hacer cambios.

---

Última actualización: Diciembre 2024
