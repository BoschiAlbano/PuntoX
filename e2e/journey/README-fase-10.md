# FASE 10 — Empleados y Roles

## Objetivo

Gestionar roles con permisos, crear empleados/usuarios, asignarles roles y verificar el log de auditoría.

## Archivos de test

- `e2e/journey/09-empleados-roles.spec.ts` _(nuevo)_

## Fixture a usar

`e2ePage` (admin del tenant E2E)

## Tareas

### Roles (`/empleados` → tab "Roles")

- [ ] **10.1** Ir a `/empleados` → tab "Roles" visible
- [ ] **10.2** Lista de roles existentes carga correctamente
- [ ] **10.3** Crear rol `"Rol Test E2E"` con permisos básicos (ver productos, ver clientes) → guardar
- [ ] **10.4** Verificar que el rol `"Rol Test E2E"` aparece en la tabla
- [ ] **10.5** Editar el rol → agregar permiso adicional → guardar → verificar
- [ ] **10.6** Intentar crear rol sin nombre → validación visible

### Usuarios/Empleados (`/empleados` → tab "Usuarios")

- [ ] **10.7** Tab "Usuarios" → lista visible con al menos el admin actual
- [ ] **10.8** Click "Nuevo" → modal para crear empleado con campos: Nombre, Apellido, Username, Email, Contraseña, Rol
- [ ] **10.9** Crear empleado `"Empleado Test E2E"` con username `"emp_test_e2e"` y rol `"Rol Test E2E"` → guardar
- [ ] **10.10** Verificar que el empleado aparece en la lista
- [ ] **10.11** Intentar crear empleado sin username → validación
- [ ] **10.12** "Más opciones" → cambiar contraseña del empleado

### Auditoría (`/empleados` → tab "Auditoría")

- [ ] **10.13** Tab "Auditoría" → tabla de eventos de auditoría carga
- [ ] **10.14** Buscar eventos por usuario → al menos un registro visible

### Cleanup

- [ ] **10.15** Eliminar empleado de prueba → confirmación
- [ ] **10.16** Eliminar rol de prueba → confirmación

## Datos de prueba

```
Rol nombre:        "Rol Test E2E"
Empleado nombre:   "Empleado"
Empleado apellido: "Test E2E"
Username:          "emp_test_e2e"
Email:             "emp.test@e2e.com"
Password:          "Test1234!"
```

## Cómo ejecutar

```bash
pnpm test:e2e -- e2e/journey/09-empleados-roles.spec.ts --project=chromium
```

## Dependencias

- Fase 0 (tenant E2E)

## Estado

- **Implementación:** ⏳ Pendiente
- **Tests escritos:** 0 / 16
- **Tests pasando:** —
