# Módulo de Ventas

## Resumen

El módulo de ventas permite registrar ventas y generar diferentes tipos de comprobantes (Facturas, Presupuestos, Remitos) con gestión completa de productos, formas de pago, y control de stock. Incluye una interfaz moderna y funcional con mejoras visuales, atajos de teclado, y validaciones en tiempo real.

## Estructura de Archivos

### Frontend
- `src/app/(dashboard)/ventas/page.tsx`: Página principal de ventas con interfaz completa

### Backend (APIs)
- `src/app/api/comprobantes/route.ts`: API para crear comprobantes (ventas)
- `src/app/api/puestos-trabajo/route.ts`: API para obtener puestos de trabajo
- `src/app/api/contadores/route.ts`: API para obtener próximos números de comprobantes
- `src/app/api/tarjetas/route.ts`: API para obtener tarjetas configuradas
- `src/app/api/productos/route.ts`: API actualizada para incluir Stock e Iva en la respuesta

## Funcionalidades Principales

### 1. Selección de Cliente
- **Cliente "Consumidor Final" por defecto**: Se selecciona automáticamente al iniciar la venta
- **Creación automática**: Si no existe "Consumidor Final" en la base de datos, se crea automáticamente
- Búsqueda de clientes por nombre, apellido o nombre completo
- Selección mediante dropdown con resultados filtrados
- Indicador visual de cliente seleccionado con badge "Por defecto"
- Botón para cambiar de cliente fácilmente
- Validación de cliente requerido antes de guardar
- Validación especial: Consumidor Final no puede usar Cuenta Corriente

### 2. Tipo de Comprobante
- **Factura**: Requiere puesto de trabajo, descuenta stock según configuración
- **Presupuesto**: No requiere puesto de trabajo, descuenta stock según configuración
- **Remito**: No requiere puesto de trabajo, descuenta stock según configuración

### 3. Búsqueda y Selección de Productos
- Búsqueda por código, código de barras o descripción
- **Atajo de teclado**: `Ctrl+K` (o `Cmd+K` en Mac) para enfocar la búsqueda
- **Enter para agregar**: Presionar Enter en la búsqueda agrega el primer resultado al carrito
- Visualización de stock disponible y precio
- **Indicadores visuales de stock**:
  - Chip "Stock bajo" cuando hay menos de 10 unidades
  - Chip "Sin stock" cuando no hay disponibilidad
  - Productos sin stock aparecen deshabilitados
- Agregado rápido al carrito con un clic
- Límite de 15 productos en resultados para mejor performance
- Información completa: código, stock, precio e IVA visible en cada producto

### 4. Carrito de Productos
- **Diseño mejorado**: Cards individuales por producto con mejor visualización
- Lista de productos seleccionados con detalles completos
- **Indicadores de stock**: Muestra stock disponible cuando es bajo
- Edición de cantidades (aumentar/disminuir) con botones grandes y accesibles
- Validación de stock disponible en tiempo real
- Cálculo automático de subtotales e IVA
- Visualización clara de precio unitario y subtotal
- Eliminación de productos del carrito con confirmación visual
- **Badge de cantidad**: Muestra el número de items en el carrito

### 5. Cálculo de Totales
- **Card destacado**: Resumen de venta con diseño visual mejorado
- **Badge de items**: Muestra cantidad de productos en el carrito
- Subtotal: Suma de todos los productos
- **IVA desglosado**: Muestra el total de IVA calculado con chip de color
- **Descuento dual**: 
  - Campo de porcentaje (0-100%)
  - Campo de monto fijo ($)
  - Se sincronizan automáticamente
- Total: Subtotal menos descuento (destacado en grande)
- Cálculo automático de IVA (21% y 10.5%)
- **Diseño visual**: Gradientes y colores para mejor jerarquía visual

### 6. Formas de Pago
- **Efectivo**: Pago en efectivo simple
- **Tarjeta**: Requiere selección de tarjeta, número, cupón y cuotas
- **Cheque**: Requiere ID de cheque (implementación futura)
- **Cuenta Corriente**: 
  - Para clientes con cuenta corriente activa
  - Asigna automáticamente el `clienteId` del cliente seleccionado
  - Validación: Consumidor Final no puede usar cuenta corriente
  - Muestra información del cliente en el modal
- **Transferencia**: Pago por transferencia bancaria
- **Botón "Restante"**: Agrega automáticamente efectivo por el monto faltante
- **Indicadores visuales**:
  - Iconos por tipo de pago (Efectivo, Tarjeta, etc.)
  - Cards con gradientes para mejor visualización
  - Chip "Pagos completos" cuando el total coincide
  - Alerta visual de diferencia pendiente
- Validación de que la suma de formas de pago coincida con el total
- **Monto sugerido**: Al abrir el modal, sugiere el monto restante automáticamente

### 7. Guardado de Venta
- **Botón "Finalizar Venta"**: 
  - Cambia de color según el estado (verde cuando está listo)
  - Icono de check cuando se puede finalizar
  - Muestra "Procesando..." durante el guardado
  - Deshabilitado con indicadores de qué falta
- **Indicadores de estado**: Card que muestra qué validaciones faltan
- Validación completa antes de guardar
- Creación de comprobante con todas sus relaciones en transacción
- **Manejo de Consumidor Final**: 
  - Si `clienteId` es `null` o `0`, busca o crea automáticamente "Consumidor Final"
  - Todo dentro de la transacción para garantizar atomicidad
- Actualización automática de stock (si corresponde)
- Generación automática de número de comprobante
- Mensaje de confirmación con número de comprobante
- **Limpieza automática**: Limpia el formulario después de guardar exitosamente

## APIs Implementadas

### POST /api/comprobantes
Crea un nuevo comprobante (venta) con todas sus relaciones.

**Request Body:**
```json
{
  "tipoComprobante": 1, // 1: Factura, 2: Presupuesto, 3: Remito
  "clienteId": 123, // null o 0 para Consumidor Final (se crea automáticamente)
  "puestoTrabajoId": 1, // Requerido solo para facturas
  "descuento": 0,
  "detalles": [
    {
      "articuloId": 456,
      "codigo": "12345",
      "descripcion": "Producto ejemplo",
      "cantidad": 2,
      "precio": 100.00,
      "iva": 17.36,
      "subtotal": 200.00,
      "costo": 50.00
    }
  ],
  "formasPago": [
    {
      "tipoPago": 1, // 1: Efectivo, 2: Tarjeta, 3: Cheque, 4: Cuenta Corriente, 5: Transferencia
      "monto": 200.00,
      "tarjetaId": 1, // Opcional, solo para tarjeta
      "numeroTarjeta": "1234", // Opcional, solo para tarjeta
      "cuponPago": "ABC123", // Opcional, solo para tarjeta
      "cantidadCuotas": 1, // Opcional, solo para tarjeta
      "clienteId": 123, // Opcional, solo para cuenta corriente (se asigna automáticamente)
      "chequeId": 456 // Opcional, solo para cheque
    }
  ]
}
```

**Response:**
```json
{
  "comprobante": {
    "id": 789,
    "numero": 1,
    "tipoComprobante": 1,
    "total": 200.00,
    "fecha": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validaciones:**
- Cliente debe existir y pertenecer al tenant (o se crea Consumidor Final si es null/0)
- Puesto de trabajo requerido para facturas
- Productos deben existir y tener stock suficiente (si no permite stock negativo)
- Suma de formas de pago debe coincidir con el total
- Cuenta Corriente requiere cliente válido (no Consumidor Final)
- Todos los datos se validan antes de crear el comprobante

**Transacciones:**
- **Resolución de Consumidor Final**: Si `clienteId` es null/0, busca o crea "Consumidor Final" dentro de la transacción
- Creación de `Comprobante`
- Creación de `DetalleComprobante` para cada producto
- Creación de `FormaPago` y relaciones específicas (`FormaPago_Tarjeta`, `FormaPago_CtaCte`, etc.)
- Creación de relación específica (`Comprobante_Factura`, `Comprobante_Presupuesto`, `Comprobante_Remito`)
- Actualización de `Stock` si corresponde
- Todo en una única transacción para garantizar atomicidad
- Si cualquier operación falla, se revierte todo (rollback automático)

### GET /api/puestos-trabajo
Obtiene la lista de puestos de trabajo activos del tenant.

**Response:**
```json
{
  "puestos": [
    {
      "id": 1,
      "codigo": 1,
      "descripcion": "Caja 1"
    }
  ]
}
```

### GET /api/contadores?tipoComprobante={tipo}
Obtiene el próximo número de comprobante para un tipo específico.

**Query Parameters:**
- `tipoComprobante`: Tipo de comprobante (1: Factura, 2: Presupuesto, 3: Remito, etc.)

**Response:**
```json
{
  "numero": 1,
  "tipoComprobante": 1
}
```

**Nota:** Este endpoint incrementa automáticamente el contador, por lo que cada llamada devuelve un número nuevo.

### GET /api/tarjetas
Obtiene la lista de tarjetas configuradas del tenant.

**Response:**
```json
{
  "tarjetas": [
    {
      "id": 1,
      "descripcion": "Visa"
    }
  ]
}
```


## Flujo de Trabajo

1. **Usuario selecciona tipo de comprobante** (Factura, Presupuesto, Remito)
2. **Si es Factura, selecciona puesto de trabajo** (se selecciona el primero por defecto)
3. **Cliente "Consumidor Final" seleccionado automáticamente** (puede cambiarse)
4. **Busca productos** usando `Ctrl+K` o el campo de búsqueda
5. **Agrega productos al carrito** (clic o Enter en búsqueda)
6. **Ajusta cantidades en el carrito** si es necesario
7. **Aplica descuento** (por porcentaje o monto fijo)
8. **Agrega formas de pago** (puede usar botón "Restante" para completar con efectivo)
9. **Sistema valida automáticamente** y muestra indicadores de estado
10. **Finaliza la venta** con el botón "Finalizar Venta"
11. **Sistema crea el comprobante** con todas sus relaciones en transacción
12. **Formulario se limpia automáticamente** para la siguiente venta

## Control de Stock

El sistema descuenta stock automáticamente según la configuración:

- **Factura**: Descuenta stock si `Configuracion.FacturaDescuentaStock = true`
- **Presupuesto**: Descuenta stock si `Configuracion.PresupuestoDescuentaStock = true`
- **Remito**: Descuenta stock si `Configuracion.RemitoDescuentaStock = true`

Además, se respeta la configuración del producto:
- Si `Articulo.DescuentaStock = false`, no se descuenta stock
- Si `Articulo.PermiteStockNegativo = false`, se valida stock antes de permitir la venta

## Cálculo de IVA

El sistema calcula IVA automáticamente basándose en el porcentaje de IVA del producto:

- Si el precio incluye IVA: `IVA = Precio - (Precio / (1 + PorcentajeIVA/100))`
- El sistema soporta múltiples porcentajes de IVA (21%, 10.5%, etc.)
- Los totales de IVA se calculan separadamente para IVA 21% e IVA 10.5%

## Constantes

### TipoComprobante
```typescript
TIPO_COMPROBANTE = {
  FACTURA: 1,
  PRESUPUESTO: 2,
  REMITO: 3,
  NOTA_CREDITO: 4,
  NOTA_DEBITO: 5,
}
```

### TipoPago
```typescript
TIPO_PAGO = {
  EFECTIVO: 1,
  TARJETA: 2,
  CHEQUE: 3,
  CUENTA_CORRIENTE: 4,
  TRANSFERENCIA: 5,
}
```

### EstadoFactura
```typescript
ESTADO_FACTURA = {
  PENDIENTE: 1,
  CONFIRMADO: 2,
  ANULADO: 3,
}
```

## Tablas de Base de Datos Involucradas

- `Comprobante`: Cabecera del comprobante
- `DetalleComprobante`: Renglones de productos
- `FormaPago`: Formas de pago asociadas
- `FormaPago_Tarjeta`: Datos específicos de pago con tarjeta
- `FormaPago_CtaCte`: Relación con cuenta corriente
- `FormaPago_Cheque`: Relación con cheque
- `Comprobante_Factura`: Datos específicos de factura
- `Comprobante_Presupuesto`: Datos específicos de presupuesto
- `Comprobante_Remito`: Datos específicos de remito
- `Stock`: Actualización de stock de productos
- `Contador`: Numeración de comprobantes

## Mejoras de Interfaz Implementadas

### Diseño Visual
- **Cards con gradientes**: Headers de secciones con gradientes de color
- **Badges informativos**: Stock, items, estados con chips de colores
- **Indicadores de estado**: Chips de color para stock bajo, sin stock, pagos completos
- **Colores semánticos**: Verde (éxito), Rojo (error), Amarillo (advertencia)
- **Animaciones sutiles**: Hover effects y transiciones suaves
- **Mejor jerarquía visual**: Tamaños de fuente y espaciado mejorados

### Funcionalidades de UX
- **Atajos de teclado**: 
  - `Ctrl+K` / `Cmd+K`: Enfocar búsqueda de productos
  - `Enter`: Agregar primer resultado de búsqueda al carrito
- **Vista previa del comprobante**: Modal que muestra resumen antes de finalizar
- **Botón "Restante"**: Agrega automáticamente efectivo por el monto faltante
- **Descuento dual**: Por porcentaje o monto, se sincronizan automáticamente
- **Validación en tiempo real**: Indicadores que muestran qué falta para finalizar
- **Feedback visual**: Toasts informativos para cada acción

### Cliente Consumidor Final
- **Selección automática**: Se asigna por defecto al iniciar
- **Creación automática**: Si no existe, se crea en la base de datos
- **Validación**: No puede usar Cuenta Corriente
- **Indicador visual**: Badge "Por defecto" para identificarlo

## Mejoras Futuras

- [ ] Implementar búsqueda de productos por código de barras con escáner
- [ ] Agregar historial de ventas recientes
- [ ] Implementar notas de crédito y débito
- [ ] Agregar impresión de comprobantes
- [ ] Implementar descuentos por producto
- [ ] Agregar validación de límites de cuenta corriente
- [ ] Implementar gestión de cheques
- [ ] Agregar reportes de ventas
- [ ] Implementar movimientos de caja automáticos
- [ ] Agregar gestión de cuenta corriente completa

## Notas Técnicas

- Todas las operaciones de creación se realizan en transacciones para garantizar atomicidad
- El sistema valida stock antes de permitir agregar productos al carrito
- Los números de comprobante se generan automáticamente usando contadores
- El sistema respeta la configuración del tenant para descuento de stock
- Los cálculos de IVA se realizan correctamente considerando precios con IVA incluido
- **Consumidor Final**: Se crea automáticamente si no existe, con condición IVA disponible y localidad por defecto
- **Serialización BigInt**: Todos los BigInt se convierten a Number antes de enviar a JSON
- **Manejo de errores**: Validaciones exhaustivas con mensajes claros para el usuario
- **Performance**: Límites en resultados de búsqueda para mantener la aplicación rápida
- **Accesibilidad**: Atajos de teclado y feedback visual para mejorar la experiencia del usuario

