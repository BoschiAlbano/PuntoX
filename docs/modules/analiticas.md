# 📊 Documentación de Analíticas

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Endpoints API](#endpoints-api)
4. [Hooks Personalizados](#hooks-personalizados)
5. [Componentes Visuales](#componentes-visuales)
6. [Uso del Dashboard](#uso-del-dashboard)
7. [Permisos](#permisos)
8. [Configuración](#configuración)

---

## Descripción General

El módulo de **Analíticas** proporciona un dashboard completo para visualizar métricas, KPIs, gráficas y alertas del negocio. Está diseñado para ser escalable, liviano y con actualización automática mediante polling optimizado.

### Características Principales

- ✅ **KPIs en tiempo real** con variación porcentual vs período anterior
- ✅ **Gráficas interactivas** (líneas, barras, circular) usando Recharts
- ✅ **Sistema de alertas** (stock crítico, cobranzas, actividad)
- ✅ **Datos complementarios** (gastos, usuarios activos, auditoría)
- ✅ **Polling automático** con cache inteligente
- ✅ **Manejo de estados vacíos** (sin errores cuando no hay datos)
- ✅ **Filtros por período** (semanal/mensual) y fechas personalizadas

---

## Arquitectura

```
src/
├── app/
│   ├── api/
│   │   └── analiticas/
│   │       ├── kpis/route.ts          # Endpoint de KPIs
│   │       ├── graficas/route.ts      # Endpoint de gráficas
│   │       ├── alertas/route.ts       # Endpoint de alertas
│   │       └── complementarios/route.ts # Endpoint de datos complementarios
│   └── (dashboard)/
│       └── analiticas/
│           └── page.tsx               # Página principal del dashboard
├── components/
│   └── analiticas/
│       ├── KPICard.tsx                # Componente de tarjeta KPI
│       ├── GraficaIngresos.tsx        # Gráfica de línea temporal
│       ├── GraficaPagos.tsx           # Gráfica circular de pagos
│       ├── GraficaProductos.tsx       # Gráfica de barras de productos
│       └── PanelAlertas.tsx           # Panel de alertas y acciones
└── hooks/
    └── useAnaliticas.ts               # Hooks personalizados para datos
```

---

## Endpoints API

### 1. GET `/api/analiticas/kpis`

Retorna los KPIs principales del dashboard con variación porcentual.

#### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `fechaDesde` | string (ISO) | No | 30 días atrás | Fecha de inicio del período |
| `fechaHasta` | string (ISO) | No | Hoy | Fecha de fin del período |
| `periodo` | `"semanal" \| "mensual"` | No | `"mensual"` | Tipo de período para comparación |

#### Respuesta

```typescript
{
  periodo: {
    desde: string;      // ISO date
    hasta: string;      // ISO date
    tipo: "semanal" | "mensual";
  },
  kpis: {
    ingresosNetos: {
      valor: number;
      variacion: number;        // Porcentaje vs período anterior
      periodoAnterior: number;
    },
    descuentos: { ... },
    ivaFacturado: { ... },
    tickets: { ... },
    notasCredito: { ... },
    margenGanancia: { ... },
    ticketPromedio: { ... },
    productosVendidos: { ... },
    clientesActivos: { ... },
    estadoCaja: {
      estaAbierta: boolean;
      fechaApertura: string;
      fechaCierre: string | null;
      totalEntrada: number;
      totalSalida: number;
      montoInicial: number;
      montoCierre: number | null;
    } | null;
  }
}
```

#### Ejemplo de Uso

```typescript
// Obtener KPIs del último mes
const response = await fetch('/api/analiticas/kpis?periodo=mensual');
const data = await response.json();
```

---

### 2. GET `/api/analiticas/graficas`

Retorna datos para diferentes tipos de gráficas.

#### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `tipo` | string | **Sí** | - | Tipo de gráfica: `"ingresos"`, `"pagos"`, `"productos"`, `"stock"`, `"cuentaCorriente"`, `"gastos"` |
| `fechaDesde` | string (ISO) | No | 30 días atrás | Fecha de inicio |
| `fechaHasta` | string (ISO) | No | Hoy | Fecha de fin |
| `agrupacion` | `"dia" \| "semana" \| "mes"` | No | `"dia"` | Agrupación temporal (solo para tipo "ingresos") |

#### Tipos de Gráficas

##### `tipo=ingresos`
Serie temporal de ingresos netos y descuentos.

**Respuesta:**
```typescript
{
  tipo: "ingresos",
  datos: Array<{
    fecha: string;
    ingresos: number;
    descuentos: number;
    facturas: number;
    todos: number;
  }>
}
```

##### `tipo=pagos`
Mix de medios de pago (efectivo, tarjeta, cheque, cuenta corriente, transferencia).

**Respuesta:**
```typescript
{
  tipo: "pagos",
  datos: Array<{
    nombre: string;      // "Efectivo", "Tarjeta", etc.
    monto: number;
    porcentaje: number;  // Calculado en frontend
  }>
}
```

##### `tipo=productos`
Top 10 productos por ventas con margen de ganancia.

**Respuesta:**
```typescript
{
  tipo: "productos",
  datos: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    monto: number;
    margen: number;
    margenPorcentaje: number;
  }>
}
```

##### `tipo=stock`
Rotación de stock: cantidad vendida vs stock disponible.

**Respuesta:**
```typescript
{
  tipo: "stock",
  datos: Array<{
    id: number;
    nombre: string;
    cantidadVendida: number;
    stockDisponible: number;
    stockMinimo: number;
    rotacion: number;
  }>
}
```

##### `tipo=cuentaCorriente`
Cuenta corriente: pagado vs pendiente por cliente.

**Respuesta:**
```typescript
{
  tipo: "cuentaCorriente",
  datos: Array<{
    id: number;
    nombre: string;
    pagado: number;
    pendiente: number;
  }>
}
```

##### `tipo=gastos`
Gastos agrupados por concepto.

**Respuesta:**
```typescript
{
  tipo: "gastos",
  datos: Array<{
    concepto: string;
    monto: number;
  }>
}
```

#### Ejemplo de Uso

```typescript
// Obtener gráfica de ingresos por día
const response = await fetch('/api/analiticas/graficas?tipo=ingresos&agrupacion=dia');
const data = await response.json();
```

---

### 3. GET `/api/analiticas/alertas`

Retorna alertas y acciones pendientes del sistema.

#### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `tipo` | string | No | `"todos"` | Tipo de alerta: `"stock"`, `"cobranzas"`, `"actividad"`, `"cheques"`, `"cajas"`, `"todos"` |

#### Respuesta

```typescript
{
  alertas: {
    stock?: Array<{
      id: number;
      nombre: string;
      codigo: string;
      stock: number;
      stockMinimo: number;
      diasHastaAgotar: number | null;
      esUrgente: boolean;
    }>;
    cobranzas?: Array<{
      id: number;
      nombre: string;
      email: string;
      telefono: string | null;
      saldo: number;
      diasVencido: number;
      fechaUltimoMovimiento: string;
      esVencido: boolean;
    }>;
    actividad?: Array<{
      id: number;
      fecha: string;
      accion: string;
      severidad: string;
      detalle: string | null;
      usuario: string;
      ipAddress: string | null;
    }>;
    cheques?: Array<{
      id: number;
      numero: string;
      banco: string;
      cliente: string;
      fechaVencimiento: string;
      diasHastaVencimiento: number;
      esUrgente: boolean;
    }>;
    cajas?: Array<{
      id: number;
      fechaApertura: string;
      empleado: string;
      horasSinActividad: number;
      requiereAtencion: boolean;
    }>;
  };
  resumen: {
    stock: number;
    stockUrgentes: number;
    cobranzas: number;
    cobranzasVencidas: number;
    actividad: number;
    cheques: number;
    chequesUrgentes: number;
    cajas: number;
    cajasSinActividad: number;
  };
}
```

#### Ejemplo de Uso

```typescript
// Obtener todas las alertas
const response = await fetch('/api/analiticas/alertas');
const data = await response.json();
```

---

### 4. GET `/api/analiticas/complementarios`

Retorna datos complementarios (gastos, usuarios activos, auditoría).

#### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `tipo` | string | No | `"todos"` | Tipo de dato: `"gastos"`, `"usuarios"`, `"auditoria"`, `"todos"` |
| `fechaDesde` | string (ISO) | No | 30 días atrás | Fecha de inicio |
| `fechaHasta` | string (ISO) | No | Hoy | Fecha de fin |

#### Respuesta

```typescript
{
  gastos?: {
    total: number;
    totalGanancia: number;
    eficiencia: number;  // Porcentaje
    porConcepto: Array<{
      concepto: string;
      monto: number;
      porcentaje: number;
    }>;
    cajasAbiertas: number;
    cajasCerradas: number;
  };
  usuarios?: {
    activosAhora: number;
    porDia: Array<{
      fecha: string;
      cantidad: number;
    }>;
    dispositivosNoConfiables: Array<{
      id: number;
      usuario: string;
      dispositivo: string | null;
      ubicacion: string | null;
      ipAddress: string | null;
      fechaUltimaActividad: string;
    }>;
  };
  auditoria?: Array<{
    id: number;
    fecha: string;
    accion: string;
    severidad: string;
    detalle: string | null;
    usuario: string;
    empleadoAfectado: string | null;
    ipAddress: string | null;
  }>;
}
```

#### Ejemplo de Uso

```typescript
// Obtener datos complementarios
const response = await fetch('/api/analiticas/complementarios');
const data = await response.json();
```

---

## Hooks Personalizados

Todos los hooks están en `src/hooks/useAnaliticas.ts` y utilizan **TanStack Query** para manejo de estado, cache y polling automático.

### `useKPIs`

Hook para obtener KPIs del dashboard.

```typescript
const { data, isLoading, error, refetch } = useKPIs({
  fechaDesde?: string;
  fechaHasta?: string;
  periodo?: "semanal" | "mensual";
  enabled?: boolean;
});
```

**Características:**
- Polling automático cada **2 minutos**
- Cache de **1 minuto** (staleTime)
- Refetch automático cuando cambian los parámetros

### `useGraficas`

Hook para obtener datos de gráficas.

```typescript
const { data, isLoading, error, refetch } = useGraficas({
  tipo: string;  // "ingresos" | "pagos" | "productos" | "stock" | "cuentaCorriente" | "gastos"
  fechaDesde?: string;
  fechaHasta?: string;
  agrupacion?: "dia" | "semana" | "mes";
  enabled?: boolean;
});
```

**Características:**
- Cache de **1 minuto**
- Refetch automático cuando cambian los parámetros

### `useAlertas`

Hook para obtener alertas del sistema.

```typescript
const { data, isLoading, error, refetch } = useAlertas({
  tipo?: string;
  enabled?: boolean;
});
```

**Características:**
- Polling automático cada **1 minuto** (más frecuente para alertas críticas)
- Cache de **30 segundos** (staleTime)

### `useComplementarios`

Hook para obtener datos complementarios.

```typescript
const { data, isLoading, error, refetch } = useComplementarios({
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  enabled?: boolean;
});
```

**Características:**
- Cache de **1 minuto**
- Refetch automático cuando cambian los parámetros

---

## Componentes Visuales

### `KPICard`

Componente de tarjeta para mostrar un KPI con variación porcentual.

```typescript
<KPICard
  title="Ingresos Netos"
  value={1234567}
  variation={15.5}           // Porcentaje de variación
  previousValue={1000000}    // Valor del período anterior
  format="currency"          // "currency" | "number" | "percentage" | "custom"
  icon={<DollarSign />}
  color="success"           // "primary" | "success" | "warning" | "danger" | "default"
/>
```

**Props:**
- `title`: Título del KPI
- `value`: Valor actual (number o string)
- `variation?`: Variación porcentual vs período anterior
- `previousValue?`: Valor del período anterior
- `format?`: Formato de visualización
- `icon?`: Icono de lucide-react
- `color?`: Color del borde izquierdo

### `GraficaIngresos`

Gráfica de línea temporal para ingresos y descuentos.

```typescript
<GraficaIngresos
  datos={[
    {
      fecha: "2024-01-15",
      ingresos: 50000,
      descuentos: 5000,
      facturas: 10,
      todos: 12
    }
  ]}
  mostrarSoloFacturas={false}
/>
```

**Características:**
- Muestra mensaje cuando no hay datos
- Formato de moneda en español (ARS)
- Tooltip interactivo

### `GraficaPagos`

Gráfica circular (pie chart) para mix de medios de pago.

```typescript
<GraficaPagos
  datos={[
    { nombre: "Efectivo", monto: 30000, porcentaje: 60 },
    { nombre: "Tarjeta", monto: 20000, porcentaje: 40 }
  ]}
/>
```

**Características:**
- Colores automáticos por tipo de pago
- Muestra porcentajes en etiquetas
- Muestra mensaje cuando no hay datos

### `GraficaProductos`

Gráfica de barras horizontales para top productos.

```typescript
<GraficaProductos
  datos={[
    {
      id: 1,
      nombre: "Producto A",
      cantidad: 100,
      monto: 50000,
      margen: 20000,
      margenPorcentaje: 40
    }
  ]}
/>
```

**Características:**
- Colores por margen de ganancia:
  - Verde: ≥30% (buen margen)
  - Azul: ≥15% (margen aceptable)
  - Amarillo: ≥0% (margen bajo)
  - Rojo: <0% (pérdida)
- Muestra top 10 productos
- Muestra mensaje cuando no hay datos

### `PanelAlertas`

Panel completo de alertas con resumen y tablas.

```typescript
<PanelAlertas
  data={alertasData}
  isLoading={false}
/>
```

**Características:**
- Resumen visual con 4 cards principales
- Tablas para productos críticos, cobranzas y actividad
- Badges y chips para estados
- Muestra mensajes cuando no hay alertas

---

## Uso del Dashboard

### Acceso

El dashboard está disponible en `/analiticas` y requiere el permiso `"analiticas"`.

### Filtros Disponibles

1. **Período**: Semanal o Mensual
2. **Fecha Desde**: Fecha de inicio personalizada
3. **Fecha Hasta**: Fecha de fin personalizada
4. **Agrupación**: Por día, semana o mes (solo afecta gráfica de ingresos)

### Secciones del Dashboard

#### 1. KPIs (Resumen Ejecutivo)
- Ingresos Netos
- Descuentos
- IVA Facturado
- Tickets
- Ticket Promedio
- Margen de Ganancia
- Productos Vendidos
- Clientes Activos
- Notas de Crédito
- Estado de Caja

#### 2. Gráficas
- **Ingresos**: Línea temporal de ingresos vs descuentos
- **Pagos**: Mix de medios de pago (circular)
- **Productos**: Top 10 productos por ventas (barras)

#### 3. Alertas
- Resumen de alertas críticas
- Tabla de productos con stock crítico
- Tabla de cobranzas pendientes
- Actividad reciente del equipo

#### 4. Datos Complementarios
- Panel de gastos y eficiencia de caja
- Panel de usuarios activos

---

## Permisos

### Requisito

Todos los endpoints requieren el permiso `"analiticas"`.

### Configuración

El permiso se crea automáticamente para nuevos tenants. Para tenants existentes, ejecutar:

```bash
npx tsx src/scripts/agregar-permiso-analiticas.ts
```

Este script:
1. Busca todos los tenants activos
2. Crea el permiso `"analiticas"` si no existe
3. Opcionalmente lo asigna a roles ADMINISTRADOR

### Asignación a Roles

El permiso puede asignarse a roles desde la interfaz de **Empleados > Roles**, seleccionando "Analiticas" en la lista de permisos.

---

## Configuración

### Polling Automático

Los hooks están configurados con polling automático:

- **KPIs**: Cada 2 minutos
- **Alertas**: Cada 1 minuto (más frecuente para alertas críticas)
- **Gráficas**: Sin polling (se actualizan al cambiar filtros)
- **Complementarios**: Sin polling (se actualizan al cambiar filtros)

### Cache

- **KPIs**: 1 minuto (staleTime)
- **Gráficas**: 1 minuto (staleTime)
- **Alertas**: 30 segundos (staleTime)
- **Complementarios**: 1 minuto (staleTime)

### Manejo de Estados Vacíos

Todos los componentes manejan correctamente cuando no hay datos:

- **KPIs**: Muestran $0 y variación 0%
- **Gráficas**: Muestran mensaje "No hay datos disponibles"
- **Alertas**: Muestran 0 en todos los contadores
- **Tablas**: Muestran listas vacías o mensajes informativos

---

## Dependencias

### Librerías Utilizadas

- **Recharts**: Gráficas interactivas (liviana, basada en SVG)
- **TanStack Query**: Manejo de estado y cache
- **HeroUI**: Componentes UI (Card, Table, Chip, etc.)
- **Lucide React**: Iconos

### Instalación

```bash
npm install recharts
```

---

## Ejemplos de Uso

### Ejemplo 1: Obtener KPIs del último mes

```typescript
import { useKPIs } from "@/hooks/useAnaliticas";

function MiComponente() {
  const { data, isLoading } = useKPIs({
    periodo: "mensual"
  });

  if (isLoading) return <div>Cargando...</div>;
  if (!data) return <div>Error</div>;

  return (
    <div>
      <p>Ingresos: ${data.kpis.ingresosNetos.valor}</p>
      <p>Variación: {data.kpis.ingresosNetos.variacion}%</p>
    </div>
  );
}
```

### Ejemplo 2: Mostrar gráfica de ingresos

```typescript
import { useGraficas } from "@/hooks/useAnaliticas";
import GraficaIngresos from "@/components/analiticas/GraficaIngresos";

function MiComponente() {
  const { data, isLoading } = useGraficas({
    tipo: "ingresos",
    agrupacion: "dia"
  });

  if (isLoading) return <div>Cargando...</div>;
  if (!data) return <div>Error</div>;

  return <GraficaIngresos datos={data.datos} />;
}
```

### Ejemplo 3: Mostrar alertas de stock

```typescript
import { useAlertas } from "@/hooks/useAnaliticas";
import PanelAlertas from "@/components/analiticas/PanelAlertas";

function MiComponente() {
  const { data, isLoading } = useAlertas({
    tipo: "stock"
  });

  if (isLoading) return <div>Cargando...</div>;
  if (!data) return <div>Error</div>;

  return <PanelAlertas data={data} isLoading={isLoading} />;
}
```

---

## Troubleshooting

### Problema: No se muestran datos

**Solución:**
1. Verificar que el permiso `"analiticas"` esté asignado al usuario/rol
2. Verificar que haya datos en la base de datos para el período seleccionado
3. Revisar la consola del navegador para errores de API

### Problema: Gráficas vacías

**Solución:**
- Es normal cuando no hay datos. Los componentes muestran mensajes informativos.
- Verificar que el período seleccionado tenga datos de comprobantes/ventas.

### Problema: Error 403 (Sin permisos)

**Solución:**
1. Ejecutar el script para agregar el permiso:
   ```bash
   npx tsx src/scripts/agregar-permiso-analiticas.ts
   ```
2. Asignar el permiso `"analiticas"` al rol del usuario desde **Empleados > Roles**

### Problema: Polling muy frecuente

**Solución:**
- Ajustar `refetchInterval` en los hooks en `src/hooks/useAnaliticas.ts`
- Ajustar `staleTime` para controlar el cache

---

## Mejoras Futuras

- [ ] Exportación a PDF/Excel
- [ ] Comparación de múltiples períodos
- [ ] Gráficas personalizables (drag & drop)
- [ ] Alertas configurables por usuario
- [ ] WebSockets para actualización en tiempo real
- [ ] Dashboard personalizable por usuario

---

## Changelog

### v1.0.0 (2024-12-30)
- ✅ Implementación inicial del módulo de analíticas
- ✅ KPIs con variación porcentual
- ✅ Gráficas interactivas (ingresos, pagos, productos)
- ✅ Sistema de alertas completo
- ✅ Datos complementarios (gastos, usuarios, auditoría)
- ✅ Polling automático optimizado
- ✅ Manejo de estados vacíos

---

## Contacto y Soporte

Para preguntas o problemas relacionados con el módulo de analíticas, contactar al equipo de desarrollo.

