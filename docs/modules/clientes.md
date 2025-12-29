# Módulo de Clientes (Frontend + APIs)

## Resumen

Módulo completo de gestión de clientes implementado con CRUD funcional, transacciones de base de datos, y una interfaz consistente con el resto del proyecto.

## Estructura de Base de Datos

### Tablas Relacionadas

#### `Persona` (Tabla Padre)
- **Campos principales**:
  - `Id` (BigInt, PK)
  - `Nombre`, `Apellido` (String)
  - `Dni` (String, nullable)
  - `Direccion` (String)
  - `Telefono` (String, nullable)
  - `Mail` (String)
  - `LocalidadId` (BigInt, FK → `Localidad`)
  - `TenantId` (BigInt, FK → `Tenant`)
  - `EstaEliminado` (Boolean)

#### `Persona_Cliente` (Tabla Hija)
- **Relación**: 1:1 con `Persona` (Id es PK y FK)
- **Campos principales**:
  - `Id` (BigInt, PK y FK → `Persona.Id`)
  - `CondicionIvaId` (BigInt, FK → `CondicionIva`)
  - `ActivarCtaCte` (Boolean)
  - `TieneLimiteCompra` (Boolean)
  - `MontoMaximoCtaCte` (Decimal)

#### `CondicionIva` (Catálogo)
- **Campos**:
  - `Id` (BigInt, PK)
  - `Descripcion` (String, unique) - Ej: "Responsable Inscripto", "Monotributista", etc.
  - `EstaEliminado` (Boolean)

**Nota**: `CondicionIva` es diferente de `Iva`. `CondicionIva` representa la condición fiscal del cliente, mientras que `Iva` representa porcentajes de impuesto para productos.

## Endpoints API

### `GET /api/condiciones-iva`
- **Descripción**: Obtiene todas las condiciones IVA disponibles
- **Autenticación**: Requerida
- **Respuesta**:
  ```json
  {
    "condicionesIva": [
      {
        "id": 1,
        "descripcion": "Responsable Inscripto"
      },
      ...
    ]
  }
  ```
- **Inicialización automática**: Si no existen condiciones IVA en la base de datos, se crean automáticamente las siguientes:
  - Responsable Inscripto
  - Monotributista
  - Exento
  - No Responsable
  - Consumidor Final

### `GET /api/clientes`
- **Descripción**: Lista todos los clientes del tenant con búsqueda opcional
- **Autenticación**: Requerida
- **Query Parameters**:
  - `q` (opcional): Búsqueda por nombre, apellido, email o DNI
- **Respuesta**:
  ```json
  {
    "clientes": [
      {
        "id": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "nombreCompleto": "Juan Pérez",
        "dni": "12345678",
        "direccion": "Calle 123",
        "telefono": "+54 11 1234-5678",
        "mail": "juan@ejemplo.com",
        "localidadId": 2014010,
        "localidad": "Buenos Aires",
        "departamento": "Capital",
        "provincia": "Buenos Aires",
        "condicionIvaId": 1,
        "condicionIva": "Responsable Inscripto",
        "activarCtaCte": true,
        "tieneLimiteCompra": true,
        "montoMaximoCtaCte": 50000
      },
      ...
    ]
  }
  ```

### `POST /api/clientes`
- **Descripción**: Crea un nuevo cliente
- **Autenticación**: Requerida
- **Body**:
  ```json
  {
    "nombre": "Juan",
    "apellido": "Pérez",
    "dni": "12345678", // opcional
    "direccion": "Calle 123",
    "telefono": "+54 11 1234-5678", // opcional
    "mail": "juan@ejemplo.com",
    "localidadId": 2014010,
    "condicionIvaId": 1,
    "activarCtaCte": false, // opcional, default: false
    "tieneLimiteCompra": false, // opcional, default: false
    "montoMaximoCtaCte": 0 // opcional, default: 0
  }
  ```
- **Validaciones**:
  - `nombre`, `apellido`, `direccion`, `mail`, `localidadId`, `condicionIvaId` son requeridos
  - `mail` debe ser un email válido
  - `localidadId` debe existir y no estar eliminada
  - `condicionIvaId` debe existir y no estar eliminada
  - `mail` debe ser único por tenant
- **Transacciones**: Crea `Persona` y `Persona_Cliente` en una sola transacción para garantizar atomicidad
- **Respuesta**: 201 Created con el cliente creado

### `PATCH /api/clientes?id={clienteId}`
- **Descripción**: Actualiza un cliente existente
- **Autenticación**: Requerida
- **Query Parameters**:
  - `id` (requerido): ID del cliente a actualizar
- **Body**: Mismos campos que POST, todos opcionales
- **Validaciones**: Mismas que POST, pero solo valida los campos enviados
- **Transacciones**: Actualiza `Persona` y `Persona_Cliente` en una sola transacción
- **Respuesta**: 200 OK con el cliente actualizado

### `DELETE /api/clientes?id={clienteId}`
- **Descripción**: Elimina un cliente (soft delete)
- **Autenticación**: Requerida
- **Query Parameters**:
  - `id` (requerido): ID del cliente a eliminar
- **Transacciones**: Marca `Persona.EstaEliminado = true` en transacción
- **Respuesta**: 200 OK

## Página Frontend

### `src/app/(dashboard)/clientes/page.tsx`

#### Características

1. **Resumen de clientes**:
   - Total de clientes
   - Clientes con cuenta corriente
   - Clientes sin cuenta corriente

2. **Búsqueda y filtrado**:
   - Búsqueda en tiempo real por nombre, email, DNI o teléfono
   - Filtrado automático de resultados

3. **Alta rápida de clientes**:
   - Modal con formulario completo
   - Validación de campos requeridos
   - Cascada de localidades (Provincia → Departamento → Localidad)
   - Selección de condición IVA
   - Configuración de cuenta corriente

4. **Edición de clientes**:
   - Modal de edición con datos precargados
   - Mismas validaciones que el alta

5. **Eliminación de clientes**:
   - Modal de confirmación
   - Soft delete (no elimina físicamente)

#### Campos del Formulario

**Datos Personales**:
- Nombre * (requerido)
- Apellido * (requerido)
- DNI (opcional)
- Email * (requerido, validado)
- Teléfono (opcional)
- Dirección * (requerido)

**Ubicación**:
- Provincia (selección)
- Departamento (se activa al seleccionar provincia)
- Localidad * (se activa al seleccionar departamento, requerido)

**Fiscal**:
- Condición IVA * (requerido)

**Cuenta Corriente**:
- Activar cuenta corriente (switch)
- Tiene límite de compra (switch, visible si cuenta corriente activa)
- Monto máximo cuenta corriente (input numérico, visible si tiene límite)

#### Integración con APIs

- **Cascada de localidades**: Usa `/api/provincias`, `/api/departamentos`, `/api/localidades`
- **Condiciones IVA**: Usa `/api/condiciones-iva`
- **CRUD de clientes**: Usa `/api/clientes` (GET, POST, PATCH, DELETE)

## Transacciones de Base de Datos

Todas las operaciones que afectan múltiples tablas usan `prisma.$transaction()`:

### Crear Cliente
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Crear Persona
  const persona = await tx.persona.create({ ... });
  
  // 2. Crear Persona_Cliente
  await tx.persona_Cliente.create({
    Id: persona.Id,
    ...
  });
});
```

### Actualizar Cliente
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Actualizar Persona
  await tx.persona.update({ ... });
  
  // 2. Actualizar Persona_Cliente
  await tx.persona_Cliente.update({ ... });
});
```

### Eliminar Cliente
```typescript
await prisma.$transaction(async (tx) => {
  // Soft delete: solo marca como eliminado
  await tx.persona.update({
    where: { Id, TenantId },
    data: { EstaEliminado: true }
  });
});
```

**Beneficios de las transacciones**:
- **Atomicidad**: Si falla cualquier operación, se revierten todos los cambios
- **Consistencia**: Garantiza que los datos relacionados siempre estén sincronizados
- **Integridad**: Previene estados inconsistentes en la base de datos

## Validaciones

### Frontend
- Validación de campos requeridos antes de enviar
- Validación de formato de email
- Validación de campos numéricos

### Backend (Zod)
- Schema `createClienteSchema` para creación
- Schema `updateClienteSchema` para actualización
- Validación de tipos y formatos
- Validación de existencia de relaciones (localidad, condición IVA)
- Validación de unicidad de email por tenant

## Manejo de Errores

### Errores de Conexión
- Detecta errores de conexión a la base de datos (códigos P1001, P1002, P1003)
- Retorna status 503 con mensaje descriptivo

### Errores de Validación
- Retorna status 400 con detalles de validación
- Mensajes específicos por tipo de error

### Errores Generales
- Retorna status 500 con mensaje genérico
- Logs en consola del servidor para debugging

## Interfaz de Usuario

### Diseño
- **Consistente**: Sigue el mismo patrón de diseño que la página de Empleados
- **Componentes**: Usa `@heroui/react` (Card, Input, Select, Switch, Modal, etc.)
- **Colores**: Respeta la paleta de colores del proyecto
- **Responsive**: Adaptable a diferentes tamaños de pantalla

### Elementos Visuales
- **Chips**: Muestran condición IVA y estado de cuenta corriente
- **Iconos**: Lucide-react para acciones (Pencil, Trash2, UserPlus)
- **Toasts**: Notificaciones de éxito/error usando `addToast`
- **Loading states**: Indicadores de carga durante operaciones

## Archivos Creados/Modificados

### Nuevos Archivos
- `src/app/api/condiciones-iva/route.ts` - API de condiciones IVA
- `src/app/api/clientes/route.ts` - API CRUD de clientes
- `src/app/(dashboard)/clientes/page.tsx` - Página de gestión de clientes
- `DOCS_CLIENTES.md` - Esta documentación

### Archivos Existentes Utilizados
- `/api/provincias` - Para cascada de localidades
- `/api/departamentos` - Para cascada de localidades
- `/api/localidades` - Para cascada de localidades

## Próximas Mejoras Sugeridas

1. **Tipo de Cliente**: Agregar campo para categorizar clientes (Mayorista, Minorista, etc.)
2. **Historial de Compras**: Mostrar comprobantes asociados al cliente
3. **Saldo de Cuenta Corriente**: Mostrar saldo actual y movimientos
4. **Exportación**: Exportar lista de clientes a CSV/Excel
5. **Importación masiva**: Cargar clientes desde archivo
6. **Filtros avanzados**: Filtrar por condición IVA, cuenta corriente, etc.
7. **Búsqueda mejorada**: Búsqueda por múltiples criterios simultáneos

## Notas Técnicas

- **Soft Delete**: Los clientes no se eliminan físicamente, solo se marcan como eliminados
- **Tenant Isolation**: Todos los clientes están aislados por `TenantId`
- **Relaciones**: `Persona_Cliente` hereda `TenantId` desde `Persona` (no tiene campo propio)
- **Inicialización**: Las condiciones IVA se crean automáticamente si no existen






