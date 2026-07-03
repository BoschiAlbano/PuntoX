# FASE 5 — Gestión de Clientes

## Objetivo

Realizar el CRUD completo de clientes: crear, buscar, editar, paginar y eliminar. Verificar validaciones de campos y datos persistidos.

## Archivos de test

- `e2e/journey/04-clientes.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### CRUD Principal

- [ ] **5.1** Ir a `/clientes` → tabla con buscador visible
- [ ] **5.2** Click "Nuevo" → modal con campos: Nombre, Apellido, CUIT, Email, Teléfono
- [ ] **5.3** Crear cliente completo con todos los campos → guardar → aparece en tabla
- [ ] **5.4** Buscar el cliente por nombre en buscador → resultado correcto
- [ ] **5.5** Abrir cliente → editar email y teléfono → guardar → verificar cambios en tabla

### Validaciones (negativo)

- [ ] **5.6** Intentar crear cliente sin nombre → error de validación visible
- [ ] **5.7** Intentar crear cliente con CUIT inválido (ej. "123abc") → error de validación
- [ ] **5.8** Intentar crear cliente con email inválido → error de validación

### Acciones de tabla

- [ ] **5.9** Menú "Más opciones" en una fila → opciones visibles
- [ ] **5.10** Paginación: navegar a página 2 si hay más de `limit` clientes

### Cleanup

- [ ] **5.11** Eliminar el cliente de prueba → confirmación → desaparece de tabla

## Datos de prueba

```
Nombre:   "Cliente"
Apellido: "Test E2E"
Email:    "cliente.test@e2e.com"
Teléfono: "11-9999-8888"
CUIT:     "20-12345678-9"
```

> El cliente creado en esta fase debe **quedar sin eliminar** al finalizar — lo usa la Fase 8 (Ventas).

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/04-clientes.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 11
- **Tests pasando:** —
