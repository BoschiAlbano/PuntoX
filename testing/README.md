# Testing — PuntoX

**Toda la documentación de testing del proyecto está en esta carpeta.**

---

## Estructura

| Archivo | Descripción |
|--------|-------------|
| **README.md** | Este índice. Punto de entrada único para testing. |
| **PLAN-TESTING-PROYECTO.md** | Plan de testing ampliado a todo el proyecto: áreas, tipos de test, fases, estado (hecho/pendiente) y criterios de listo. |
| **GUIA.md** | Guía completa: estado actual, cómo ejecutar, tests implementados, infraestructura, convenciones y plan prioritario. |
| **resumen-ejecucion.md** | Última ejecución: qué se corrió, resultados, cobertura. |
| **COBERTURA-ACTUAL.md** | Qué tanto del proyecto está cubierto: API, lib, componentes, hooks (porcentajes y listas). |
| **INFORME-FALLOS.md** | Tests no pasados o fallidos, causas probables y cómo solucionarlos. |
| **INFORME-VALIDACIONES.md** | Validaciones insuficientes (ej. descuento 200%, montos sin tope): hallazgos detectados por tests de fronteras y dónde corregir. |

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
