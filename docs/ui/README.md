# 🎨 Guía de UI, UX y Componentes — PuntoX

Este directorio contiene los estándares de diseño, especificaciones de componentes reutilizables, patrones de tablas genéricas y guías de consistencia visual para el frontend de **PuntoX**.

---

## Documentación de UI

| Documento | Descripción |
|---|---|
| 📋 [crud-tablas-genericas.md](crud-tablas-genericas.md) | **Patrón Maestro CRUD**: `GenericCrud` + `GenericTable`, exportación CSV/XLS, selección masiva (`BulkSelectionContext`) y paginación React Query |
| 🪟 [formato-crud.md](formato-crud.md) | Estándares de modales (`placement="center"`, `backdrop="opaque"`), inputs, botones y paleta de acentos (`#67afc3` / `#0066FF`) |
| 📐 [consistencia-formato-paginas.md](consistencia-formato-paginas.md) | Envolturas de páginas, layouts responsivos, headers de sección y contenedor estándar |
| 🧩 [heroui-table-overrides.md](heroui-table-overrides.md) | Modificaciones y slots de HeroUI Table (checkboxes, bordes, hover states y estilos oscuros) |
| 🌈 [configuracion-colores-hero-ui.md](configuracion-colores-hero-ui.md) | Configuración de tokens de color, variables CSS y temas claros/oscuros |
| 🖱️ [seleccion-masiva-cross-page.md](seleccion-masiva-cross-page.md) | Nota técnica sobre el comportamiento de selección masiva entre páginas y deselección automática al cambiar filtros |
| ✨ [ux-improvements.md](ux-improvements.md) | Bitácora de mejoras de experiencia de usuario, micro-animaciones Framer Motion y optimización de densidad visual |

---

## Sistema de Diseño Global

El sistema de diseño maestro de PuntoX se basa en **Kinetic Retail Ops**, documentado en:
👉 **[DESIGN.md](../../DESIGN.md)** (Tokens de color, tipografía Plus Jakarta Sans / Inter, sombras y jerarquía visual).
