# Informe de tests no pasados y fallos detectados

Este documento lista los tests que **no se ejecutaron** o **fallaron** según el plan de testing. Solo incluye **fallos pendientes**; los ya corregidos se documentan en [SOLUCION-FALLOS.md](SOLUCION-FALLOS.md).

---

## 1. Estado actual

| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| **Tests fallidos** | **0** | Todos corregidos. |
| **Archivos de test ausentes** | **0** | permisos y empleados route.test.ts existen. |
| **Suite** | 254 tests, 49 archivos | `npm test` pasa. |

---

## 2. Fallos pendientes

*(Ninguno. Si se detectan nuevos fallos, documentarlos aquí antes de corregir.)*

---

## 3. Historial de correcciones

Los fallos ya solucionados (10 tests de validación, 2 archivos referenciados como ausentes) están documentados en **[SOLUCION-FALLOS.md](SOLUCION-FALLOS.md)** con el detalle de cada corrección aplicada.

---

## 4. Cómo verificar

```bash
npm test
# o solo validaciones:
npx vitest run src/test/validation --reporter=verbose
```

**Resultado esperado:** 254 tests pasando, 49 archivos.

---

**Última actualización:** 2025-02-12 — Sin fallos pendientes. Ver [SOLUCION-FALLOS.md](SOLUCION-FALLOS.md) para el historial de correcciones.
