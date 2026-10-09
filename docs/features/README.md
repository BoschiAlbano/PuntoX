# 🚀 Especificaciones y Features — PuntoX

Este directorio reúne las especificaciones detalladas, análisis técnicos y planes de trabajo para funcionalidades específicas del sistema **PuntoX**.

---

## Documentación de Features

| Feature | Documento | Estado | Descripción |
|---|---|---|---|
| 🔔 **Notificaciones In-App** | [notificaciones.md](notificaciones.md) | 🟢 Implementado | Alertas automáticas para stock crítico, límites de cuenta corriente superados y descuadres de caja, con deduplicación y auto-resolución |
| 🧾 **Notas de Crédito AFIP** | [nota-credito-afip.md](nota-credito-afip.md) | 🟢 Implementado | Autorización de Notas de Crédito A/B/C en Web Services ARCA con comprobantes asociados (`CbtesAsoc`), reversión de stock y egreso de caja |
| 🔍 **Búsqueda en Pestañas POS** | [ventas-busqueda-tabs.md](ventas-busqueda-tabs.md) | 🟡 En diseño | Unificación de la búsqueda de productos y carrito de ventas en pestañas alternables ("Carrito (N)" / "Buscar productos") para desktop y mobile |

---

## Cómo agregar una nueva especificación de feature

1. Crear el archivo en `docs/features/[nombre-feature].md`.
2. Incluir:
   - **Objetivo y Decisiones**: Qué resuelve y qué se acordó.
   - **Estado Actual del Código**: Archivos afectados y dependencias.
   - **Diseño Técnico**: Modelos, APIs, contratos y UI.
   - **Plan de Implementación**: Tareas paso a paso con checklist.
3. Registrar la feature en este archivo y en `docs/README.md`.
