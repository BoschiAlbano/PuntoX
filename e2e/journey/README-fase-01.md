# FASE 1 — Autenticación

## Objetivo

Verificar todos los flujos de autenticación: login exitoso, errores de credenciales, guards de rutas protegidas, y estado post-login.

## Archivos de test

- `e2e/auth/login-completo.spec.ts` _(nuevo)_
- Existentes a mantener: `e2e/auth/login-dashboard.spec.ts`, `e2e/auth/login-ventas.spec.ts`, `e2e/signin.spec.ts`

## Fixture a usar

```typescript
import { test } from "../fixtures/auth";
// Usar authenticatedPage para tests legacy
// Usar e2ePage para tests nuevos con el tenant E2E
```

## Tareas

### Tests a implementar en `e2e/auth/login-completo.spec.ts`

- [x] **1.1** Login con credenciales válidas (`admin_e2e` / `E2Etest123!`) → redirige a `/ventas`
- [x] **1.2** Login con contraseña incorrecta → mensaje de error visible en pantalla
- [x] **1.3** Login con usuario inexistente → mensaje de error visible
- [x] **1.3b** Campos vacíos: botón deshabilitado o validación al enviar
- [x] **1.4** Contraseña vacía: no avanza sin password
- [x] **1.5** Acceso a `/productos` sin autenticar → redirige a `/signin`
- [x] **1.6** Acceso a `/dashboard` sin autenticar → redirige a `/signin`
- [x] **1.7** Acceso a `/clientes` sin autenticar → redirige a `/signin`
- [x] **1.8** Después del login el sidebar muestra el nombre del usuario (`admin_e2e` o "Admin")
- [x] **1.9** Después del login el selector de sucursal muestra "Casa Central"

### Tests existentes (verificar que siguen pasando)

- [ ] `signin.spec.ts` — Página /signin carga correctamente
- [ ] `auth/login-dashboard.spec.ts` — Redirect a dashboard post-login
- [ ] `auth/login-ventas.spec.ts` — Acceso a pantalla de ventas
- [ ] `guards/redirect-unauth.spec.ts` — Guard de rutas no autenticadas

## Cómo ejecutar

```bash
# Solo esta fase
pnpm test:e2e -- e2e/auth/ --project=chromium

# Solo el spec nuevo
pnpm test:e2e -- e2e/auth/login-completo.spec.ts --project=chromium
```

## Template de código

```typescript
import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe("Autenticación — Flujos completos", () => {
  test("1.1 login válido redirige a /ventas", async ({ e2ePage: page }) => {
    // e2ePage ya hizo el login, solo verificar URL
    expect(page.url()).toMatch(/\/(ventas|dashboard)/);
  });

  test("1.2 contraseña incorrecta muestra error", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/nombre de usuario/i).fill("admin_e2e");
    await page.getByLabel(/contraseña/i).fill("wrongpassword");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page.getByText(/contraseña|credenciales|error/i)).toBeVisible({
      timeout: 8000,
    });
  });
  // ...
});
```

## Dependencias

- Ninguna (es la primera fase)
- Requiere tenant E2E creado (Fase 0)

## Estado

- **Implementación:** ✅ Completa
- **Tests escritos:** 10 / 10
- **Tests pasando:** ✅ 10/10 (Chromium, 25.6s)
