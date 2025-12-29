# 🧪 Testing - PuntoX

Guía de testing y tests implementados en el proyecto.

---

## 📊 Estado Actual

- **Total de tests:** 19 tests
- **Cobertura:** ~5-10%
- **Estado:** ✅ Todos pasando
- **Framework:** Vitest 4.0.16

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

### Tests Prioritarios

1. **Tests de API Routes**
   - Tests de integración para endpoints críticos
   - Validación de permisos en cada endpoint
   - Tests de validación de datos

2. **Tests de Componentes React**
   - Tests de componentes críticos
   - Tests de hooks personalizados
   - Tests de formularios

3. **Tests E2E**
   - Flujos completos de usuario
   - Tests de integración end-to-end
   - Tests de regresión

### Objetivo de Cobertura

- **Corto plazo:** 30-40%
- **Mediano plazo:** 60-70%
- **Largo plazo:** 80%+

---

## 📚 Referencias

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- Tests existentes en `src/**/*.test.ts`

---

**Última actualización:** Diciembre 2024

