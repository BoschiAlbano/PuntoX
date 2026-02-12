# Testing — PuntoX

**Toda la documentación de testing del proyecto está en esta carpeta.**

---

## Estructura

| Archivo | Descripción |
|--------|-------------|
| **README.md** | Este índice. Punto de entrada único para testing. |
| **GUIA.md** | Guía completa: estado actual, cómo ejecutar, tests implementados, **resumen de última ejecución**, **cobertura por área**, infraestructura, convenciones y plan prioritario. |
| **PLAN-TESTING.md** | Plan unificado: principios, tipos de test, fases (API, componentes, hooks, E2E) y criterios de aceptación. |
| **INFORME-FALLOS.md** | Tests no pasados o fallidos, causas probables y cómo solucionarlos. |
| **INFORME-VALIDACIONES.md** | Validaciones insuficientes (ej. descuento 200%, montos sin tope): hallazgos detectados por tests de fronteras y dónde corregir. |
| **SOLUCION-FALLOS.md** | Soluciones detalladas para los fallos documentados. |

---

## Uso rápido

```bash
npm test                    # Ejecutar suite
npm run test:watch          # Modo watch
npm run test:coverage       # Con cobertura
```

Para detalles, ejemplos y convenciones → [GUIA.md](GUIA.md).

---

## Propósito de esta carpeta

- Unificar en un solo lugar la documentación de testing (guía, ejecución, fallos).
- Centralizar tests que no pasan o no se ejecutan y sus soluciones.
- Documentar hallazgos de validación (valores inválidos que el sistema acepta) para que el equipo priorice correcciones.
- Mantener un registro actualizable sin depender de `docs/` para testing.

*Última actualización: Febrero 2025.*
