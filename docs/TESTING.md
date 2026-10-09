# 🧪 Estrategia y Guía Central de Testing — PuntoX

PuntoX cuenta con una suite integral de pruebas automatizadas que combina **pruebas unitarias y de integración con Vitest** y **pruebas de extremo a extremo (E2E) con Playwright**.

---

## 1. Mapa de Documentación de Testing

Toda la documentación detallada de testing se divide en dos grandes áreas:

### A. Pruebas Unitarias y de Integración (`testing/`)

| Documento | Descripción |
|---|---|
| 📖 [testing/README.md](../testing/README.md) | Índice central de la suite de Vitest |
| 🚀 [testing/GUIA.md](../testing/GUIA.md) | Comandos de ejecución, cobertura por módulo, infraestructura de mocks y resumen de suites |
| 📋 [testing/PLAN-TESTING.md](../testing/PLAN-TESTING.md) | Principios de testing, fases (API, componentes, hooks, validaciones) y criterios de aceptación |
| 🛡️ [testing/INFORME-VALIDACIONES.md](../testing/INFORME-VALIDACIONES.md) | Casos de frontera y validaciones de schemas Zod (montos negativos, porcentajes inválidos, etc.) |
| 🐞 [testing/INFORME-FALLOS.md](../testing/INFORME-FALLOS.md) | Registro de tests fallidos o pendientes |
| ✅ [testing/SOLUCION-FALLOS.md](../testing/SOLUCION-FALLOS.md) | Historial de soluciones aplicadas a validaciones y mocks |

### B. Pruebas E2E de Viaje de Usuario (`e2e/journey/`)

| Documento | Descripción |
|---|---|
| 🎭 [e2e/journey/README.md](../e2e/journey/README.md) | **Matriz de 14 Fases E2E** (~172 tests): Setup, Auth, Configuración, Maestros, Productos, Clientes, Proveedores, Caja, Ventas, Compras, Roles, Sucursales, Analytics y Viaje Completo |
| 📝 [e2e/journey/README-fase-00.md](../e2e/journey/README-fase-00.md) a `13.md` | Checklist detallada y especificaciones paso a paso por cada fase E2E |

---

## 2. Comandos de Ejecución Rápida

### Vitest (Unitarios & Integración)

```bash
# Ejecutar toda la suite de Vitest
pnpm test

# Modo interactivo / watch
pnpm test:watch

# Generar reporte de cobertura
pnpm test:coverage
```

### Playwright (E2E Journey)

```bash
# Ejecutar toda la suite E2E
pnpm test:e2e

# Ejecutar una fase específica
pnpm test:e2e -- e2e/journey/03-productos.spec.ts --project=chromium

# Interfaz interactiva de Playwright
pnpm test:e2e:ui

# Ver reporte HTML
npx playwright show-report
```

---

## 3. Estándares y Convenciones de Test

1. **Aislamiento de Tenants en Tests**: Todo test que modifique la base de datos debe ejecutarse sobre el tenant de pruebas (`Tienda E2E PuntoX` o mock de tenant) y realizar limpieza al finalizar (`soft cleanup`).
2. **Mocks de Autenticación**: En pruebas unitarias se utiliza `vi.mock('@/lib/auth/getAuthUser')` simulando el contexto de sesión y permisos.
3. **Validaciones en Frontera**: Cada schema Zod debe contar con tests que verifiquen valores válidos, límites máximos (`MONTO_MAX`), strings vacíos y caracteres especiales.
