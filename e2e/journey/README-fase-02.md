# FASE 2 — Configuración de la Tienda (Onboarding + Configuración)

## Estado: ✅ Completada — 15/15 tests passing

## Descubrimientos clave

- El layout de la app redirige **toda ruta dashboard** a `/onboarding` mientras `tenant.OnboardingCompleto === false`
- Los selects Provincia/Departamento/Localidad son **requeridos por el servidor** (valida `localidadId` en API)
- El título `PageHeader` usa `title` + `accentTitle` separados → el `h1` contiene ambos como nodo texto + span
- El botón "Finalizar Configuración" llama `POST /api/onboarding/complete` → sets `OnboardingCompleto=true` → redirect a `/dashboard`
- Tests deben ser **idempotentes**: navegar directamente a `/onboarding` en vez de esperar redirect post-login

## Archivos de test

- `e2e/journey/01-onboarding.spec.ts`

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas completadas

- [x] **2.1** `/onboarding` es accesible y muestra el wizard de bienvenida
- [x] **2.2** Stepper muestra los 5 pasos correctos (Perfil, Facturación AFIP, Preferencias, Seguridad, Notificaciones)
- [x] **2.3** Paso 1 tiene los campos de perfil del negocio visibles
- [x] **2.4** Campos razón social y dirección son editables; save responde
- [x] **2.5** "Siguiente Paso" avanza del paso 1 al paso 2 (muestra campo CUIT)
- [x] **2.6** "Anterior" regresa del paso 2 al paso 1
- [x] **2.7** Paso 3 (Preferencias) muestra opciones de caja y stock
- [x] **2.8** Paso 5 (Notificaciones) muestra toggles y botón "Finalizar Configuración"
- [x] **2.9** "Finalizar Configuración" completa onboarding → redirige a /dashboard
- [x] **2.10** `/configuracion` carga sin redirección y muestra "Perfil del Negocio"
- [x] **2.11** Selects Provincia/Departamento/Localidad visibles; guardar responde
- [x] **2.12** Nombre del tenant persiste al recargar
- [x] **2.13** `/configuracion/ventas` carga "Preferencias de Venta" con opciones de caja
- [x] **2.14** `/configuracion/seguridad` carga "Seguridad y Acceso"
- [x] **2.15** `/configuracion/notificaciones` carga "Notificaciones del Sistema"

## Datos de prueba

```
Nombre negocio: "Tienda E2E PuntoX"
Razón social: "Tienda E2E S.R.L."
Dirección: "Calle Falsa 123, Buenos Aires"
Teléfono: "+54 11 1234-5678"
CUIT: "30-12345678-9"
```

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/01-onboarding.spec.ts --project=chromium
```

## Template de código

```typescript
import { expect } from "@playwright/test";
import { test } from "../../fixtures/auth";

test.describe.serial("Configuración de la tienda", () => {
  test("2.1 tabs de configuración visibles", async ({ e2ePage: page }) => {
    await page.goto("/configuracion");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("tab", { name: /perfil/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /ventas/i })).toBeVisible();
  });

  test("2.2 guardar perfil del negocio", async ({ e2ePage: page }) => {
    await page.goto("/configuracion");
    await page.getByRole("tab", { name: /perfil/i }).click();
    await page.getByLabel(/nombre (del negocio|fantasía)/i).clear();
    await page
      .getByLabel(/nombre (del negocio|fantasía)/i)
      .fill("Tienda E2E PuntoX");
    await page.getByRole("button", { name: /guardar/i }).click();
    await expect(page.getByText(/guardado|éxito|actualizado/i)).toBeVisible({
      timeout: 8000,
    });
  });
});
```

## Dependencias

- Fase 0 (tenant E2E creado)
- Fase 1 (login funciona)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 8
- **Tests pasando:** —
