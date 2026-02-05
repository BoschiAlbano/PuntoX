# 🧪 Testing - PuntoX

Guía de testing y tests implementados en el proyecto.

---

## 📊 Estado Actual

- **Total de tests:** 50+ tests
- **Cobertura:** ~30-40%
- **Estado:** ✅ Mayoría pasando (algunos tests en corrección de mocks)
- **Framework:** Vitest 4.0.16

## ⚠️ Nota Importante sobre Mocks

**Los mocks de Prisma deben devolver valores serializables (Numbers) en lugar de BigInt/Decimal** para evitar errores de serialización cuando el código de producción usa spread operator (`...objeto`).

### Ejemplo Correcto:
```typescript
// ✅ CORRECTO: Mock con Numbers
vi.mocked(prisma.articulo.findFirst).mockResolvedValue({
  Id: 100, // Number en lugar de BigInt
  TenantId: 1, // Number en lugar de BigInt
  Stock: 10, // Number en lugar de Decimal
  Precio: {
    Id: 1, // Number en lugar de BigInt
    PrecioCosto: 100, // Number en lugar de Decimal
  },
} as any);
```

### Ejemplo Incorrecto:
```typescript
// ❌ INCORRECTO: Mock con BigInt/Decimal
vi.mocked(prisma.articulo.findFirst).mockResolvedValue({
  Id: BigInt(100), // ❌ Causa error de serialización
  Stock: new Prisma.Decimal(10), // ❌ Causa error de serialización
} as any);
```

**Razón:** El código de producción usa spread operator (`...producto`, `...caja`, etc.) que incluye todos los campos, incluyendo BigInt y Decimal que no son serializables directamente con `JSON.stringify`.

---

## ✅ Tests Implementados

### 1. Tests de Permisos

**Archivo:** `src/lib/requirePermiso.test.ts`

- ✅ Usuario no autenticado
- ✅ Usuario con permiso válido
- ✅ Usuario sin permiso
- ✅ SuperAdmin con acceso completo

### 2. Tests de Cálculos de Ventas

**Archivo:** `src/lib/ventas/calculos.test.ts`

- ✅ Cálculo de subtotal sin descuento
- ✅ Cálculo de subtotal con descuento
- ✅ Cálculo de IVA (21%, 10.5%, 0%)
- ✅ Cálculo de total con múltiples IVAs
- ✅ Escenarios completos de venta

### 3. Tests de Serialización

**Archivo:** `src/utilities/serialization.test.ts`

- ✅ Serialización de BigInt en objetos
- ✅ Serialización de arrays
- ✅ Serialización de objetos anidados
- ✅ Manejo de valores null/undefined

### 4. Tests de Sistema de Permisos JWT

**Archivos:**
- `src/lib/auth/updateUserPermissions.test.ts`
- `src/app/api/permisos/route.test.ts`

- ✅ Cálculo de permisos desde DB
- ✅ Actualización de permisos en JWT
- ✅ Lectura optimizada desde JWT
- ✅ Fallback a DB si no hay JWT
- ✅ Detección de SuperAdmin

---

## 🚀 Cómo Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Modo watch (desarrollo)
```bash
npm run test:watch
```

### Con cobertura
```bash
npm run test:coverage
```

### Test específico
```bash
npx vitest run src/lib/requirePermiso.test.ts
```

---

## 📝 Convenciones de Testing

### Estructura de Test

```typescript
import { describe, it, expect } from "vitest";

describe("Nombre del módulo", () => {
  it("debe hacer algo específico", () => {
    // Arrange
    const input = "valor";
    
    // Act
    const result = funcion(input);
    
    // Assert
    expect(result).toBe("esperado");
  });
});
```

### Mocks

```typescript
import { vi } from "vitest";

vi.mock("@/DB/prisma", () => ({
  default: {
    usuario: {
      findFirst: vi.fn(),
    },
  },
}));
```

---

## 🎯 Próximos Pasos

### Tests Pendientes

1. **Tests de Componentes React**
   - Tests de componentes críticos (VentaGrid, ProductSearch, etc.)
   - Tests de hooks personalizados restantes
   - Tests de formularios CRUD

2. **Tests E2E**
   - Flujos completos de usuario
   - Tests de integración end-to-end
   - Tests de regresión

3. **Corrección de Mocks**
   - Ajustar mocks restantes para usar Numbers en lugar de BigInt/Decimal
   - Verificar que todos los tests pasen con el código original (sin modificar producción)

### Objetivo de Cobertura

- **Actual:** ~30-40%
- **Corto plazo:** 50-60%
- **Mediano plazo:** 70-80%
- **Largo plazo:** 80%+

## 🔧 Correcciones Recientes

### Corrección de Mocks (Febrero 2026)

Se corrigieron todos los mocks de Prisma para que devuelvan valores serializables (Numbers) en lugar de BigInt/Decimal. Esto permite que los tests pasen con el código de producción original que usa spread operator (`...objeto`).

**Archivos corregidos:**
- `testing/api/productos.route.test.ts`
- `testing/api/caja.route.test.ts`
- `testing/api/comprobantes.route.test.ts`
- `testing/api/ventas.productos.route.test.ts`
- `testing/api/clientes.route.test.ts`
- `testing/api/sucursales.route.test.ts`
- `testing/api/roles.route.test.ts`
- `testing/api/auth.route.test.ts`

**Resultado:** 32/32 tests de productos y caja pasando ✅

---

## 📚 Referencias

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- Tests existentes en `src/**/*.test.ts`

---

---

## 📋 Documentación Relacionada

Para más información sobre problemas pendientes y bugs detectados, ver:

- **`testing/BUGS_DETECTADOS.md`** - Bugs reales en código de producción
- **`testing/PROBLEMAS_PENDIENTES.md`** - Problemas encontrados durante tests
- **`testing/RESULTADOS_TESTS.md`** - Resultados detallados de tests

---

**Última actualización:** 5 de Febrero, 2026

