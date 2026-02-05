-- CreateEnum
CREATE TYPE "PerfilTipo" AS ENUM ('ADMINISTRADOR', 'EMPLEADO', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "TiposVenta" AS ENUM ('UNIDAD', 'PESO');

-- CreateTable
CREATE TABLE "Tenant" (
    "Id" BIGSERIAL NOT NULL,
    "Nombre" VARCHAR(250) NOT NULL,
    "Dominio" VARCHAR(400),
    "EstaActivo" BOOLEAN NOT NULL DEFAULT true,
    "PlanId" BIGINT,
    "OnboardingCompleto" BOOLEAN NOT NULL DEFAULT false,
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Nombre" VARCHAR(250) NOT NULL,
    "Direccion" VARCHAR(400),
    "Telefono" VARCHAR(25),
    "EsPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "EstaActiva" BOOLEAN NOT NULL DEFAULT true,
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,
    "FechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "UsuarioSucursal" (
    "UsuarioId" BIGINT NOT NULL,
    "SucursalId" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "EsDefault" BOOLEAN NOT NULL DEFAULT false,
    "FechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioSucursal_pkey" PRIMARY KEY ("UsuarioId","SucursalId")
);

-- CreateTable
CREATE TABLE "ArticuloStock" (
    "Id" BIGSERIAL NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "SucursalId" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Stock" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "StockMinimo" DECIMAL(18,2),
    "Ubicacion" VARCHAR(200),
    "FechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticuloStock_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "PlanSaaS" (
    "Id" BIGSERIAL NOT NULL,
    "Nombre" VARCHAR(200) NOT NULL,
    "Descripcion" VARCHAR(800),
    "CostoMensual" DECIMAL(18,2) NOT NULL,
    "Caracteristicas" VARCHAR(4000),

    CONSTRAINT "PlanSaaS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Log" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT,
    "Fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Nivel" VARCHAR(50) NOT NULL,
    "Servicio" VARCHAR(200),
    "Mensaje" VARCHAR(4000) NOT NULL,
    "Metadata" VARCHAR(4000),

    CONSTRAINT "Log_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Articulo" (
    "Id" BIGSERIAL NOT NULL,
    "MarcaId" BIGINT NOT NULL,
    "RubroId" BIGINT NOT NULL,
    "UnidadMedidaId" BIGINT NOT NULL,
    "IvaId" BIGINT NOT NULL,
    "PrecioId" BIGINT NOT NULL,
    "Codigo" INTEGER NOT NULL,
    "CodigoBarra" VARCHAR(100) NOT NULL,
    "Abreviatura" VARCHAR(20),
    "Descripcion" VARCHAR(250) NOT NULL,
    "Detalle" VARCHAR(500),
    "Ubicacion" VARCHAR(500),
    "PorcentajeGanancia" DECIMAL(18,2) NOT NULL,
    "Foto" BYTEA NOT NULL,
    "ActivarLimiteVenta" BOOLEAN NOT NULL,
    "LimiteVenta" DECIMAL(18,2) NOT NULL,
    "ActivarHoraVenta" BOOLEAN NOT NULL,
    "HoraLimiteVentaDesde" TIMESTAMP(3) NOT NULL,
    "HoraLimiteVentaHasta" TIMESTAMP(3) NOT NULL,
    "PermiteStockNegativo" BOOLEAN NOT NULL,
    "DescuentaStock" BOOLEAN NOT NULL,
    "StockMinimo" DECIMAL(18,2) NOT NULL,
    "VencimientoDias" INTEGER NOT NULL,
    "TipoVenta" "TiposVenta" NOT NULL DEFAULT 'UNIDAD',
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Stock" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Articulo_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "BajaArticulo" (
    "Id" BIGSERIAL NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "MotivoBajaId" BIGINT NOT NULL,
    "Cantidad" DECIMAL(18,2) NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "Observacion" VARCHAR(400) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "BajaArticulo_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Banco" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Banco_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Caja" (
    "Id" BIGSERIAL NOT NULL,
    "UsuarioAperturaId" BIGINT NOT NULL,
    "MontoInicial" DECIMAL(18,2) NOT NULL,
    "FechaApertura" TIMESTAMP(3) NOT NULL,
    "UsuarioCierreId" BIGINT,
    "FechaCierre" TIMESTAMP(3),
    "MontoCierre" DECIMAL(18,2),
    "TotalEntradaEfectivo" DECIMAL(18,2) NOT NULL,
    "TotalSalidaEfectivo" DECIMAL(18,2) NOT NULL,
    "TotalEntradaTarjeta" DECIMAL(18,2) NOT NULL,
    "TotalSalidaTarjeta" DECIMAL(18,2) NOT NULL,
    "TotalEntradaCheque" DECIMAL(18,2) NOT NULL,
    "TotalSalidaCheque" DECIMAL(18,2) NOT NULL,
    "TotalEntradaCtaCte" DECIMAL(18,2) NOT NULL,
    "TotalSalidaCtaCte" DECIMAL(18,2) NOT NULL,
    "TotalEntradaTransf" DECIMAL(18,2) NOT NULL,
    "TotalSalidaTransf" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "Ganancia" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Cheque" (
    "Id" BIGSERIAL NOT NULL,
    "ClienteId" BIGINT NOT NULL,
    "BancoId" BIGINT NOT NULL,
    "Numero" VARCHAR(100) NOT NULL,
    "FechaVencimiento" TIMESTAMP(3) NOT NULL,
    "EstaRechazado" BOOLEAN NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "Cheque_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante" (
    "Id" BIGSERIAL NOT NULL,
    "EmpleadoId" BIGINT NOT NULL,
    "UsuarioId" BIGINT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "Numero" INTEGER NOT NULL,
    "SubTotal" DECIMAL(18,2) NOT NULL,
    "Descuento" DECIMAL(18,2) NOT NULL,
    "Total" DECIMAL(18,2) NOT NULL,
    "Iva21" DECIMAL(18,2) NOT NULL,
    "Iva105" DECIMAL(18,2) NOT NULL,
    "TipoComprobante" INTEGER NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante_Compra" (
    "Id" BIGINT NOT NULL,
    "ProveedorId" BIGINT NOT NULL,
    "FechaEntrega" TIMESTAMP(3) NOT NULL,
    "Iva27" DECIMAL(18,2) NOT NULL,
    "PrecepcionTemp" DECIMAL(18,2) NOT NULL,
    "PrecepcionPyP" DECIMAL(18,2) NOT NULL,
    "PrecepcionIva" DECIMAL(18,2) NOT NULL,
    "PrecepcionIB" DECIMAL(18,2) NOT NULL,
    "EstadoFactura" INTEGER NOT NULL,

    CONSTRAINT "Comprobante_Compra_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante_CtaCteProveedor" (
    "Id" BIGINT NOT NULL,
    "ProveedorId" BIGINT NOT NULL,
    "Estado" INTEGER NOT NULL,

    CONSTRAINT "Comprobante_CtaCteProveedor_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante_CuentaCorriente" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,
    "MovimientoCuentaCorrienteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_CuentaCorriente_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante_Factura" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,
    "Estado" INTEGER NOT NULL,

    CONSTRAINT "Comprobante_Factura_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante_NotaCredito" (
    "Id" BIGINT NOT NULL,
    "ComprobanteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_NotaCredito_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante_Presupuesto" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_Presupuesto_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Comprobante_Remito" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_Remito_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ConceptoGastos" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "ConceptoGastos_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CondicionIva" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(150) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,

    CONSTRAINT "CondicionIva_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "Id" BIGSERIAL NOT NULL,
    "RazonSocial" VARCHAR(250) NOT NULL,
    "NombreFantasia" VARCHAR(250),
    "Cuit" VARCHAR(13) NOT NULL,
    "Telefono" VARCHAR(25),
    "Celular" VARCHAR(25),
    "Direccion" VARCHAR(400) NOT NULL,
    "Email" VARCHAR(250),
    "LocalidadId" BIGINT,
    "FacturaDescuentaStock" BOOLEAN NOT NULL,
    "PresupuestoDescuentaStock" BOOLEAN NOT NULL,
    "RemitoDescuentaStock" BOOLEAN NOT NULL,
    "ActualizaCostoDesdeCompra" BOOLEAN NOT NULL,
    "ModificaPrecioVentaDesdeCompra" BOOLEAN NOT NULL,
    "Imprimir" BOOLEAN NOT NULL,
    "Instalada" INTEGER,
    "TipoFormaPagoPorDefectoVenta" INTEGER NOT NULL,
    "TipoFormaPagoPorDefectoCompra" INTEGER NOT NULL,
    "ObservacionEnPieFactura" VARCHAR(400),
    "UnificarRenglonesIngresarMismoProducto" BOOLEAN NOT NULL,
    "IngresoManualCajaInicial" BOOLEAN NOT NULL,
    "PuestoCajaSeparado" BOOLEAN NOT NULL,
    "ActivarRetiroDeCaja" BOOLEAN NOT NULL,
    "MontoMaximoRetiroCaja" DECIMAL(18,2) NOT NULL,
    "ActivarBascula" BOOLEAN NOT NULL,
    "EtiquetaPorPeso" BOOLEAN NOT NULL,
    "CodigoBascula" VARCHAR(8000),
    "EstaEliminado" BOOLEAN NOT NULL,
    "Foto" VARCHAR(8000),
    "ShowFoto" BOOLEAN NOT NULL DEFAULT false,
    "TenantId" BIGINT NOT NULL,
    "AbrirCajonEfectivo" BOOLEAN NOT NULL DEFAULT true,
    "MostrarPreciosConIva" BOOLEAN NOT NULL DEFAULT true,
    "NumerarPedidosPantalla" BOOLEAN NOT NULL DEFAULT true,
    "NotificacionesPush" BOOLEAN NOT NULL DEFAULT true,
    "NotificacionesResumenDiario" BOOLEAN NOT NULL DEFAULT false,
    "NotificacionesStockBajo" BOOLEAN NOT NULL DEFAULT true,
    "Moneda" VARCHAR(10) DEFAULT 'ARS',
    "ZonaHoraria" VARCHAR(100) DEFAULT 'America/Argentina/Buenos_Aires',
    "Idioma" VARCHAR(10) DEFAULT 'es-AR',
    "CondicionIvaId" BIGINT,
    "PuntoVenta" VARCHAR(10),
    "InicioActividades" TIMESTAMP(3),
    "Forzar2FA" BOOLEAN NOT NULL DEFAULT false,
    "ExpirarSesiones30Dias" BOOLEAN NOT NULL DEFAULT true,
    "BloquearTrasIntentos" INTEGER DEFAULT 5,
    "AlertarNuevoDispositivo" BOOLEAN NOT NULL DEFAULT true,
    "BloquearPorInactividad" BOOLEAN NOT NULL DEFAULT false,
    "TiempoInactividadMinutos" INTEGER DEFAULT 30,
    "RecordarSesion30Dias" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Contador" (
    "Id" BIGSERIAL NOT NULL,
    "TipoComprobante" INTEGER NOT NULL,
    "Valor" INTEGER NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "Contador_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CuentaBancarias" (
    "Id" BIGSERIAL NOT NULL,
    "BancoId" BIGINT NOT NULL,
    "Numero" VARCHAR(100) NOT NULL,
    "Titular" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "CuentaBancarias_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Provincia" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(100) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "Id" BIGSERIAL NOT NULL,
    "ProvinciaId" BIGINT NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Localidad" (
    "Id" BIGSERIAL NOT NULL,
    "DepartamentoId" BIGINT NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Localidad_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "DepositoCheques" (
    "Id" BIGSERIAL NOT NULL,
    "ChequeId" BIGINT NOT NULL,
    "CuentaBancariaId" BIGINT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "DepositoCheques_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "DetalleCaja" (
    "Id" BIGSERIAL NOT NULL,
    "CajaId" BIGINT NOT NULL,
    "TipoPago" INTEGER NOT NULL,
    "Monto" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "DetalleCaja_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "DetalleComprobante" (
    "Id" BIGSERIAL NOT NULL,
    "ComprobanteId" BIGINT NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "Codigo" VARCHAR(8000) NOT NULL,
    "Descripcion" VARCHAR(8000) NOT NULL,
    "Cantidad" DECIMAL(18,3) NOT NULL,
    "Iva" DECIMAL(18,2) NOT NULL,
    "Precio" DECIMAL(18,2) NOT NULL,
    "SubTotal" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "Costo" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "DetalleComprobante_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "FormaPago" (
    "Id" BIGSERIAL NOT NULL,
    "ComprobanteId" BIGINT NOT NULL,
    "TipoPago" INTEGER NOT NULL,
    "Monto" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "FormaPago_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "FormaPago_Cheque" (
    "Id" BIGINT NOT NULL,
    "ChequeId" BIGINT NOT NULL,

    CONSTRAINT "FormaPago_Cheque_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "FormaPago_CtaCte" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "FormaPago_CtaCte_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "FormaPago_Tarjeta" (
    "Id" BIGINT NOT NULL,
    "TarjetaId" BIGINT NOT NULL,
    "NumeroTarjeta" VARCHAR(100) NOT NULL,
    "CuponPago" VARCHAR(100) NOT NULL,
    "CantidadCuotas" INTEGER NOT NULL,

    CONSTRAINT "FormaPago_Tarjeta_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "FormularioPerfil" (
    "Formulario_Id" BIGINT NOT NULL,
    "Perfil_Id" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "FormularioPerfil_pkey" PRIMARY KEY ("Formulario_Id","Perfil_Id")
);

-- CreateTable
CREATE TABLE "Formularios" (
    "Id" BIGSERIAL NOT NULL,
    "Codigo" INTEGER NOT NULL,
    "Nombre" VARCHAR(250) NOT NULL,
    "NombreCompleto" VARCHAR(400) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Formularios_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "Id" BIGSERIAL NOT NULL,
    "CajaId" BIGINT NOT NULL,
    "ConceptoGastoId" BIGINT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "Descripcion" VARCHAR(400) NOT NULL,
    "Monto" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Iva" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "Porcentaje" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,

    CONSTRAINT "Iva_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "MotivoBajas" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "MotivoBajas_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Perfiles" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Tipo" "PerfilTipo" NOT NULL DEFAULT 'EMPLEADO',

    CONSTRAINT "Perfiles_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "Id" BIGSERIAL NOT NULL,
    "Clave" VARCHAR(100) NOT NULL,
    "Descripcion" VARCHAR(250),
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "PerfilPermiso" (
    "PerfilId" BIGINT NOT NULL,
    "PermisoId" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "PerfilPermiso_pkey" PRIMARY KEY ("PerfilId","PermisoId")
);

-- CreateTable
CREATE TABLE "PerfilUsuario" (
    "Perfil_Id" BIGINT NOT NULL,
    "Usuario_Id" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "PerfilUsuario_pkey" PRIMARY KEY ("Perfil_Id","Usuario_Id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "Id" BIGSERIAL NOT NULL,
    "Apellido" VARCHAR(150) NOT NULL,
    "Nombre" VARCHAR(200) NOT NULL,
    "Dni" VARCHAR(8),
    "Direccion" VARCHAR(400) NOT NULL,
    "Telefono" VARCHAR(25),
    "Mail" VARCHAR(250),
    "LocalidadId" BIGINT NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Persona_Cliente" (
    "Id" BIGINT NOT NULL,
    "CondicionIvaId" BIGINT NOT NULL,
    "ActivarCtaCte" BOOLEAN NOT NULL,
    "TieneLimiteCompra" BOOLEAN NOT NULL,
    "MontoMaximoCtaCte" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "Persona_Cliente_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Persona_Empleado" (
    "Id" BIGINT NOT NULL,
    "Legajo" INTEGER NOT NULL,
    "Foto" BYTEA NOT NULL,

    CONSTRAINT "Persona_Empleado_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Precio" (
    "Id" BIGSERIAL NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "PrecioCosto" DECIMAL(18,2) NOT NULL,
    "PorcentajeGanancia" DECIMAL(18,2) NOT NULL,
    "PrecioPublico" DECIMAL(18,2) NOT NULL,
    "PorcentajeGanancia2" DECIMAL(18,2) NOT NULL,
    "PrecioPublico2" DECIMAL(18,2) NOT NULL,
    "FechaActualizacion" TIMESTAMP(3) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Precio_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "Id" BIGSERIAL NOT NULL,
    "RazonSocial" VARCHAR(250) NOT NULL,
    "CUIT" VARCHAR(15) NOT NULL,
    "Direccion" VARCHAR(400) NOT NULL,
    "Telefono" VARCHAR(25),
    "Mail" VARCHAR(250) NOT NULL,
    "LocalidadId" BIGINT NOT NULL,
    "CondicionIvaId" BIGINT NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Rubro" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Tarjeta" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Tarjeta_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "Id" BIGSERIAL NOT NULL,
    "EmpleadoId" BIGINT NOT NULL,
    "Nombre" VARCHAR(50) NOT NULL,
    "EstaBloqueado" BOOLEAN NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "AuthUserId" VARCHAR(255) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "Id" BIGSERIAL NOT NULL,
    "CajaId" BIGINT NOT NULL,
    "ComprobanteId" BIGINT NOT NULL,
    "UsuarioId" BIGINT NOT NULL,
    "Monto" DECIMAL(18,2) NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "Descripcion" VARCHAR(4000) NOT NULL,
    "TipoMovimiento" INTEGER NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "SucursalId" BIGINT,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Movimiento_CuentaCorriente" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "Movimiento_CuentaCorriente_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Movimiento_CuentaCorrienteProveedor" (
    "Id" BIGINT NOT NULL,
    "ProveedorId" BIGINT NOT NULL,

    CONSTRAINT "Movimiento_CuentaCorrienteProveedor_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AuditoriaEmpleado" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UsuarioId" BIGINT NOT NULL,
    "Accion" VARCHAR(100) NOT NULL,
    "EmpleadoId" BIGINT,
    "UsuarioAfectadoId" BIGINT,
    "Detalle" VARCHAR(1000),
    "ValorAnterior" VARCHAR(2000),
    "ValorNuevo" VARCHAR(2000),
    "IpAddress" VARCHAR(50),
    "UserAgent" VARCHAR(500),
    "Severidad" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "SucursalId" BIGINT,

    CONSTRAINT "AuditoriaEmpleado_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "SesionActiva" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "UsuarioId" BIGINT NOT NULL,
    "TokenHash" VARCHAR(255) NOT NULL,
    "IpAddress" VARCHAR(50),
    "UserAgent" VARCHAR(500),
    "Dispositivo" VARCHAR(100),
    "Ubicacion" VARCHAR(200),
    "FechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaUltimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EstaActiva" BOOLEAN NOT NULL DEFAULT true,
    "EsConfiable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SesionActiva_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "DispositivoConfiable" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "UsuarioId" BIGINT NOT NULL,
    "NombreDispositivo" VARCHAR(100) NOT NULL,
    "UserAgent" VARCHAR(500),
    "IpAddress" VARCHAR(50),
    "FechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaUltimoUso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EstaActivo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DispositivoConfiable_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "IntentoLogin" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "Email" VARCHAR(250) NOT NULL,
    "IpAddress" VARCHAR(50),
    "UserAgent" VARCHAR(500),
    "Exitoso" BOOLEAN NOT NULL DEFAULT false,
    "MotivoFallo" VARCHAR(200),
    "FechaIntento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UsuarioId" BIGINT,

    CONSTRAINT "IntentoLogin_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "IpBloqueada" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "IpAddress" VARCHAR(50) NOT NULL,
    "Motivo" VARCHAR(200),
    "FechaBloqueo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaDesbloqueo" TIMESTAMP(3),
    "EstaActiva" BOOLEAN NOT NULL DEFAULT true,
    "IntentosFallidos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IpBloqueada_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "TokenCsrf" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "UsuarioId" BIGINT,
    "Token" VARCHAR(255) NOT NULL,
    "FechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaExpiracion" TIMESTAMP(3) NOT NULL,
    "Usado" BOOLEAN NOT NULL DEFAULT false,
    "IpAddress" VARCHAR(50),
    "UserAgent" VARCHAR(500),

    CONSTRAINT "TokenCsrf_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Codigo2FA" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "UsuarioId" BIGINT NOT NULL,
    "Secret" VARCHAR(255) NOT NULL,
    "EstaActivo" BOOLEAN NOT NULL DEFAULT false,
    "FechaActivacion" TIMESTAMP(3),
    "BackupCodes" VARCHAR(2000),

    CONSTRAINT "Codigo2FA_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AlertaSeguridad" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "UsuarioId" BIGINT,
    "Tipo" VARCHAR(50) NOT NULL,
    "Severidad" VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    "Mensaje" VARCHAR(500) NOT NULL,
    "Detalles" VARCHAR(2000),
    "IpAddress" VARCHAR(50),
    "UserAgent" VARCHAR(500),
    "FechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EstaResuelta" BOOLEAN NOT NULL DEFAULT false,
    "FechaResolucion" TIMESTAMP(3),
    "ResueltoPor" BIGINT,

    CONSTRAINT "AlertaSeguridad_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_Dominio_key" ON "Tenant"("Dominio");

-- CreateIndex
CREATE INDEX "Tenant_PlanId_idx" ON "Tenant"("PlanId");

-- CreateIndex
CREATE INDEX "Sucursal_TenantId_idx" ON "Sucursal"("TenantId");

-- CreateIndex
CREATE INDEX "Sucursal_TenantId_EsPrincipal_idx" ON "Sucursal"("TenantId", "EsPrincipal");

-- CreateIndex
CREATE INDEX "Sucursal_TenantId_EstaActiva_idx" ON "Sucursal"("TenantId", "EstaActiva");

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_TenantId_Nombre_key" ON "Sucursal"("TenantId", "Nombre");

-- CreateIndex
CREATE INDEX "UsuarioSucursal_TenantId_idx" ON "UsuarioSucursal"("TenantId");

-- CreateIndex
CREATE INDEX "UsuarioSucursal_UsuarioId_idx" ON "UsuarioSucursal"("UsuarioId");

-- CreateIndex
CREATE INDEX "UsuarioSucursal_SucursalId_idx" ON "UsuarioSucursal"("SucursalId");

-- CreateIndex
CREATE INDEX "ArticuloStock_TenantId_idx" ON "ArticuloStock"("TenantId");

-- CreateIndex
CREATE INDEX "ArticuloStock_TenantId_SucursalId_idx" ON "ArticuloStock"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "ArticuloStock_ArticuloId_idx" ON "ArticuloStock"("ArticuloId");

-- CreateIndex
CREATE INDEX "ArticuloStock_SucursalId_idx" ON "ArticuloStock"("SucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticuloStock_ArticuloId_SucursalId_key" ON "ArticuloStock"("ArticuloId", "SucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanSaaS_Nombre_key" ON "PlanSaaS"("Nombre");

-- CreateIndex
CREATE INDEX "Log_TenantId_idx" ON "Log"("TenantId");

-- CreateIndex
CREATE INDEX "Log_Fecha_idx" ON "Log"("Fecha");

-- CreateIndex
CREATE INDEX "Articulo_TenantId_idx" ON "Articulo"("TenantId");

-- CreateIndex
CREATE INDEX "Articulo_IvaId_idx" ON "Articulo"("IvaId");

-- CreateIndex
CREATE INDEX "Articulo_MarcaId_idx" ON "Articulo"("MarcaId");

-- CreateIndex
CREATE INDEX "Articulo_PrecioId_idx" ON "Articulo"("PrecioId");

-- CreateIndex
CREATE INDEX "Articulo_RubroId_idx" ON "Articulo"("RubroId");

-- CreateIndex
CREATE INDEX "Articulo_UnidadMedidaId_idx" ON "Articulo"("UnidadMedidaId");

-- CreateIndex
CREATE INDEX "BajaArticulo_TenantId_idx" ON "BajaArticulo"("TenantId");

-- CreateIndex
CREATE INDEX "BajaArticulo_TenantId_SucursalId_idx" ON "BajaArticulo"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "BajaArticulo_SucursalId_idx" ON "BajaArticulo"("SucursalId");

-- CreateIndex
CREATE INDEX "BajaArticulo_ArticuloId_idx" ON "BajaArticulo"("ArticuloId");

-- CreateIndex
CREATE INDEX "BajaArticulo_MotivoBajaId_idx" ON "BajaArticulo"("MotivoBajaId");

-- CreateIndex
CREATE INDEX "Banco_TenantId_idx" ON "Banco"("TenantId");

-- CreateIndex
CREATE INDEX "Caja_TenantId_idx" ON "Caja"("TenantId");

-- CreateIndex
CREATE INDEX "Caja_TenantId_SucursalId_idx" ON "Caja"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "Caja_SucursalId_idx" ON "Caja"("SucursalId");

-- CreateIndex
CREATE INDEX "Caja_UsuarioAperturaId_idx" ON "Caja"("UsuarioAperturaId");

-- CreateIndex
CREATE INDEX "Caja_UsuarioCierreId_idx" ON "Caja"("UsuarioCierreId");

-- CreateIndex
CREATE INDEX "Cheque_TenantId_idx" ON "Cheque"("TenantId");

-- CreateIndex
CREATE INDEX "Cheque_TenantId_SucursalId_idx" ON "Cheque"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "Cheque_SucursalId_idx" ON "Cheque"("SucursalId");

-- CreateIndex
CREATE INDEX "Cheque_BancoId_idx" ON "Cheque"("BancoId");

-- CreateIndex
CREATE INDEX "Cheque_ClienteId_idx" ON "Cheque"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_TenantId_idx" ON "Comprobante"("TenantId");

-- CreateIndex
CREATE INDEX "Comprobante_TenantId_SucursalId_idx" ON "Comprobante"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "Comprobante_SucursalId_idx" ON "Comprobante"("SucursalId");

-- CreateIndex
CREATE INDEX "Comprobante_EmpleadoId_idx" ON "Comprobante"("EmpleadoId");

-- CreateIndex
CREATE INDEX "Comprobante_UsuarioId_idx" ON "Comprobante"("UsuarioId");

-- CreateIndex
CREATE INDEX "Comprobante_Compra_Id_idx" ON "Comprobante_Compra"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_Compra_ProveedorId_idx" ON "Comprobante_Compra"("ProveedorId");

-- CreateIndex
CREATE INDEX "Comprobante_CtaCteProveedor_Id_idx" ON "Comprobante_CtaCteProveedor"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_CtaCteProveedor_ProveedorId_idx" ON "Comprobante_CtaCteProveedor"("ProveedorId");

-- CreateIndex
CREATE INDEX "Comprobante_CuentaCorriente_ClienteId_idx" ON "Comprobante_CuentaCorriente"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_CuentaCorriente_Id_idx" ON "Comprobante_CuentaCorriente"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_CuentaCorriente_MovimientoCuentaCorrienteId_idx" ON "Comprobante_CuentaCorriente"("MovimientoCuentaCorrienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Factura_ClienteId_idx" ON "Comprobante_Factura"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Factura_Id_idx" ON "Comprobante_Factura"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_NotaCredito_ComprobanteId_idx" ON "Comprobante_NotaCredito"("ComprobanteId");

-- CreateIndex
CREATE INDEX "Comprobante_NotaCredito_Id_idx" ON "Comprobante_NotaCredito"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_Presupuesto_ClienteId_idx" ON "Comprobante_Presupuesto"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Presupuesto_Id_idx" ON "Comprobante_Presupuesto"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_Remito_ClienteId_idx" ON "Comprobante_Remito"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Remito_Id_idx" ON "Comprobante_Remito"("Id");

-- CreateIndex
CREATE INDEX "ConceptoGastos_TenantId_idx" ON "ConceptoGastos"("TenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CondicionIva_Descripcion_key" ON "CondicionIva"("Descripcion");

-- CreateIndex
CREATE INDEX "Configuracion_TenantId_idx" ON "Configuracion"("TenantId");

-- CreateIndex
CREATE INDEX "Configuracion_LocalidadId_idx" ON "Configuracion"("LocalidadId");

-- CreateIndex
CREATE INDEX "Configuracion_CondicionIvaId_idx" ON "Configuracion"("CondicionIvaId");

-- CreateIndex
CREATE INDEX "Contador_TenantId_idx" ON "Contador"("TenantId");

-- CreateIndex
CREATE INDEX "Contador_TenantId_SucursalId_idx" ON "Contador"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "Contador_SucursalId_idx" ON "Contador"("SucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "Contador_TenantId_SucursalId_TipoComprobante_key" ON "Contador"("TenantId", "SucursalId", "TipoComprobante");

-- CreateIndex
CREATE INDEX "CuentaBancarias_TenantId_idx" ON "CuentaBancarias"("TenantId");

-- CreateIndex
CREATE INDEX "CuentaBancarias_BancoId_idx" ON "CuentaBancarias"("BancoId");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_Descripcion_key" ON "Provincia"("Descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_ProvinciaId_Descripcion_key" ON "Departamento"("ProvinciaId", "Descripcion");

-- CreateIndex
CREATE INDEX "DepositoCheques_TenantId_idx" ON "DepositoCheques"("TenantId");

-- CreateIndex
CREATE INDEX "DepositoCheques_TenantId_SucursalId_idx" ON "DepositoCheques"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "DepositoCheques_SucursalId_idx" ON "DepositoCheques"("SucursalId");

-- CreateIndex
CREATE INDEX "DepositoCheques_ChequeId_idx" ON "DepositoCheques"("ChequeId");

-- CreateIndex
CREATE INDEX "DepositoCheques_CuentaBancariaId_idx" ON "DepositoCheques"("CuentaBancariaId");

-- CreateIndex
CREATE INDEX "DetalleCaja_TenantId_idx" ON "DetalleCaja"("TenantId");

-- CreateIndex
CREATE INDEX "DetalleCaja_CajaId_idx" ON "DetalleCaja"("CajaId");

-- CreateIndex
CREATE INDEX "DetalleComprobante_TenantId_idx" ON "DetalleComprobante"("TenantId");

-- CreateIndex
CREATE INDEX "DetalleComprobante_ArticuloId_idx" ON "DetalleComprobante"("ArticuloId");

-- CreateIndex
CREATE INDEX "DetalleComprobante_ComprobanteId_idx" ON "DetalleComprobante"("ComprobanteId");

-- CreateIndex
CREATE INDEX "FormaPago_TenantId_idx" ON "FormaPago"("TenantId");

-- CreateIndex
CREATE INDEX "FormaPago_ComprobanteId_idx" ON "FormaPago"("ComprobanteId");

-- CreateIndex
CREATE INDEX "FormaPago_Cheque_ChequeId_idx" ON "FormaPago_Cheque"("ChequeId");

-- CreateIndex
CREATE INDEX "FormaPago_Cheque_Id_idx" ON "FormaPago_Cheque"("Id");

-- CreateIndex
CREATE INDEX "FormaPago_CtaCte_ClienteId_idx" ON "FormaPago_CtaCte"("ClienteId");

-- CreateIndex
CREATE INDEX "FormaPago_CtaCte_Id_idx" ON "FormaPago_CtaCte"("Id");

-- CreateIndex
CREATE INDEX "FormaPago_Tarjeta_Id_idx" ON "FormaPago_Tarjeta"("Id");

-- CreateIndex
CREATE INDEX "FormaPago_Tarjeta_TarjetaId_idx" ON "FormaPago_Tarjeta"("TarjetaId");

-- CreateIndex
CREATE INDEX "FormularioPerfil_TenantId_idx" ON "FormularioPerfil"("TenantId");

-- CreateIndex
CREATE INDEX "FormularioPerfil_Formulario_Id_idx" ON "FormularioPerfil"("Formulario_Id");

-- CreateIndex
CREATE INDEX "FormularioPerfil_Perfil_Id_idx" ON "FormularioPerfil"("Perfil_Id");

-- CreateIndex
CREATE INDEX "Formularios_TenantId_idx" ON "Formularios"("TenantId");

-- CreateIndex
CREATE INDEX "Gasto_TenantId_idx" ON "Gasto"("TenantId");

-- CreateIndex
CREATE INDEX "Gasto_TenantId_SucursalId_idx" ON "Gasto"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "Gasto_SucursalId_idx" ON "Gasto"("SucursalId");

-- CreateIndex
CREATE INDEX "Gasto_CajaId_idx" ON "Gasto"("CajaId");

-- CreateIndex
CREATE INDEX "Gasto_ConceptoGastoId_idx" ON "Gasto"("ConceptoGastoId");

-- CreateIndex
CREATE INDEX "Marca_TenantId_idx" ON "Marca"("TenantId");

-- CreateIndex
CREATE INDEX "MotivoBajas_TenantId_idx" ON "MotivoBajas"("TenantId");

-- CreateIndex
CREATE INDEX "Perfiles_TenantId_idx" ON "Perfiles"("TenantId");

-- CreateIndex
CREATE INDEX "Permiso_TenantId_idx" ON "Permiso"("TenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_Clave_TenantId_key" ON "Permiso"("Clave", "TenantId");

-- CreateIndex
CREATE INDEX "PerfilPermiso_TenantId_idx" ON "PerfilPermiso"("TenantId");

-- CreateIndex
CREATE INDEX "PerfilUsuario_TenantId_idx" ON "PerfilUsuario"("TenantId");

-- CreateIndex
CREATE INDEX "PerfilUsuario_Perfil_Id_idx" ON "PerfilUsuario"("Perfil_Id");

-- CreateIndex
CREATE INDEX "PerfilUsuario_Usuario_Id_idx" ON "PerfilUsuario"("Usuario_Id");

-- CreateIndex
CREATE INDEX "Persona_TenantId_idx" ON "Persona"("TenantId");

-- CreateIndex
CREATE INDEX "Persona_LocalidadId_idx" ON "Persona"("LocalidadId");

-- CreateIndex
CREATE INDEX "Persona_Cliente_CondicionIvaId_idx" ON "Persona_Cliente"("CondicionIvaId");

-- CreateIndex
CREATE INDEX "Persona_Cliente_Id_idx" ON "Persona_Cliente"("Id");

-- CreateIndex
CREATE INDEX "Persona_Empleado_Id_idx" ON "Persona_Empleado"("Id");

-- CreateIndex
CREATE INDEX "Precio_TenantId_idx" ON "Precio"("TenantId");

-- CreateIndex
CREATE INDEX "Proveedor_TenantId_idx" ON "Proveedor"("TenantId");

-- CreateIndex
CREATE INDEX "Proveedor_CondicionIvaId_idx" ON "Proveedor"("CondicionIvaId");

-- CreateIndex
CREATE INDEX "Proveedor_LocalidadId_idx" ON "Proveedor"("LocalidadId");

-- CreateIndex
CREATE INDEX "Rubro_TenantId_idx" ON "Rubro"("TenantId");

-- CreateIndex
CREATE INDEX "Tarjeta_TenantId_idx" ON "Tarjeta"("TenantId");

-- CreateIndex
CREATE INDEX "UnidadMedida_TenantId_idx" ON "UnidadMedida"("TenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_AuthUserId_key" ON "Usuario"("AuthUserId");

-- CreateIndex
CREATE INDEX "Usuario_TenantId_idx" ON "Usuario"("TenantId");

-- CreateIndex
CREATE INDEX "Usuario_EmpleadoId_idx" ON "Usuario"("EmpleadoId");

-- CreateIndex
CREATE INDEX "Movimiento_TenantId_idx" ON "Movimiento"("TenantId");

-- CreateIndex
CREATE INDEX "Movimiento_TenantId_SucursalId_idx" ON "Movimiento"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "Movimiento_SucursalId_idx" ON "Movimiento"("SucursalId");

-- CreateIndex
CREATE INDEX "Movimiento_CajaId_idx" ON "Movimiento"("CajaId");

-- CreateIndex
CREATE INDEX "Movimiento_ComprobanteId_idx" ON "Movimiento"("ComprobanteId");

-- CreateIndex
CREATE INDEX "Movimiento_UsuarioId_idx" ON "Movimiento"("UsuarioId");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorriente_ClienteId_idx" ON "Movimiento_CuentaCorriente"("ClienteId");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorriente_Id_idx" ON "Movimiento_CuentaCorriente"("Id");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorrienteProveedor_Id_idx" ON "Movimiento_CuentaCorrienteProveedor"("Id");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorrienteProveedor_ProveedorId_idx" ON "Movimiento_CuentaCorrienteProveedor"("ProveedorId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_TenantId_idx" ON "AuditoriaEmpleado"("TenantId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_TenantId_SucursalId_idx" ON "AuditoriaEmpleado"("TenantId", "SucursalId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_SucursalId_idx" ON "AuditoriaEmpleado"("SucursalId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_Fecha_idx" ON "AuditoriaEmpleado"("Fecha");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_UsuarioId_idx" ON "AuditoriaEmpleado"("UsuarioId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_EmpleadoId_idx" ON "AuditoriaEmpleado"("EmpleadoId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_Accion_idx" ON "AuditoriaEmpleado"("Accion");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_Severidad_idx" ON "AuditoriaEmpleado"("Severidad");

-- CreateIndex
CREATE INDEX "SesionActiva_TenantId_idx" ON "SesionActiva"("TenantId");

-- CreateIndex
CREATE INDEX "SesionActiva_UsuarioId_idx" ON "SesionActiva"("UsuarioId");

-- CreateIndex
CREATE INDEX "SesionActiva_TokenHash_idx" ON "SesionActiva"("TokenHash");

-- CreateIndex
CREATE INDEX "SesionActiva_EstaActiva_idx" ON "SesionActiva"("EstaActiva");

-- CreateIndex
CREATE INDEX "SesionActiva_FechaUltimaActividad_idx" ON "SesionActiva"("FechaUltimaActividad");

-- CreateIndex
CREATE INDEX "DispositivoConfiable_TenantId_idx" ON "DispositivoConfiable"("TenantId");

-- CreateIndex
CREATE INDEX "DispositivoConfiable_UsuarioId_idx" ON "DispositivoConfiable"("UsuarioId");

-- CreateIndex
CREATE INDEX "DispositivoConfiable_EstaActivo_idx" ON "DispositivoConfiable"("EstaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoConfiable_TenantId_UsuarioId_UserAgent_IpAddress_key" ON "DispositivoConfiable"("TenantId", "UsuarioId", "UserAgent", "IpAddress");

-- CreateIndex
CREATE INDEX "IntentoLogin_TenantId_idx" ON "IntentoLogin"("TenantId");

-- CreateIndex
CREATE INDEX "IntentoLogin_Email_idx" ON "IntentoLogin"("Email");

-- CreateIndex
CREATE INDEX "IntentoLogin_IpAddress_idx" ON "IntentoLogin"("IpAddress");

-- CreateIndex
CREATE INDEX "IntentoLogin_FechaIntento_idx" ON "IntentoLogin"("FechaIntento");

-- CreateIndex
CREATE INDEX "IntentoLogin_Exitoso_idx" ON "IntentoLogin"("Exitoso");

-- CreateIndex
CREATE INDEX "IpBloqueada_TenantId_idx" ON "IpBloqueada"("TenantId");

-- CreateIndex
CREATE INDEX "IpBloqueada_IpAddress_idx" ON "IpBloqueada"("IpAddress");

-- CreateIndex
CREATE INDEX "IpBloqueada_EstaActiva_idx" ON "IpBloqueada"("EstaActiva");

-- CreateIndex
CREATE INDEX "IpBloqueada_FechaBloqueo_idx" ON "IpBloqueada"("FechaBloqueo");

-- CreateIndex
CREATE UNIQUE INDEX "IpBloqueada_TenantId_IpAddress_key" ON "IpBloqueada"("TenantId", "IpAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TokenCsrf_Token_key" ON "TokenCsrf"("Token");

-- CreateIndex
CREATE INDEX "TokenCsrf_TenantId_idx" ON "TokenCsrf"("TenantId");

-- CreateIndex
CREATE INDEX "TokenCsrf_Token_idx" ON "TokenCsrf"("Token");

-- CreateIndex
CREATE INDEX "TokenCsrf_FechaExpiracion_idx" ON "TokenCsrf"("FechaExpiracion");

-- CreateIndex
CREATE INDEX "TokenCsrf_UsuarioId_idx" ON "TokenCsrf"("UsuarioId");

-- CreateIndex
CREATE INDEX "Codigo2FA_TenantId_idx" ON "Codigo2FA"("TenantId");

-- CreateIndex
CREATE INDEX "Codigo2FA_UsuarioId_idx" ON "Codigo2FA"("UsuarioId");

-- CreateIndex
CREATE INDEX "Codigo2FA_EstaActivo_idx" ON "Codigo2FA"("EstaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "Codigo2FA_TenantId_UsuarioId_key" ON "Codigo2FA"("TenantId", "UsuarioId");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_TenantId_idx" ON "AlertaSeguridad"("TenantId");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_UsuarioId_idx" ON "AlertaSeguridad"("UsuarioId");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_Tipo_idx" ON "AlertaSeguridad"("Tipo");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_Severidad_idx" ON "AlertaSeguridad"("Severidad");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_FechaCreacion_idx" ON "AlertaSeguridad"("FechaCreacion");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_EstaResuelta_idx" ON "AlertaSeguridad"("EstaResuelta");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_PlanId_fkey" FOREIGN KEY ("PlanId") REFERENCES "PlanSaaS"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioSucursal" ADD CONSTRAINT "UsuarioSucursal_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioSucursal" ADD CONSTRAINT "UsuarioSucursal_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioSucursal" ADD CONSTRAINT "UsuarioSucursal_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticuloStock" ADD CONSTRAINT "ArticuloStock_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "Articulo"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticuloStock" ADD CONSTRAINT "ArticuloStock_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticuloStock" ADD CONSTRAINT "ArticuloStock_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_IvaId_fkey" FOREIGN KEY ("IvaId") REFERENCES "Iva"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_MarcaId_fkey" FOREIGN KEY ("MarcaId") REFERENCES "Marca"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_PrecioId_fkey" FOREIGN KEY ("PrecioId") REFERENCES "Precio"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_RubroId_fkey" FOREIGN KEY ("RubroId") REFERENCES "Rubro"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_UnidadMedidaId_fkey" FOREIGN KEY ("UnidadMedidaId") REFERENCES "UnidadMedida"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BajaArticulo" ADD CONSTRAINT "BajaArticulo_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "Articulo"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BajaArticulo" ADD CONSTRAINT "BajaArticulo_MotivoBajaId_fkey" FOREIGN KEY ("MotivoBajaId") REFERENCES "MotivoBajas"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BajaArticulo" ADD CONSTRAINT "BajaArticulo_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BajaArticulo" ADD CONSTRAINT "BajaArticulo_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banco" ADD CONSTRAINT "Banco_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_UsuarioAperturaId_fkey" FOREIGN KEY ("UsuarioAperturaId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_UsuarioCierreId_fkey" FOREIGN KEY ("UsuarioCierreId") REFERENCES "Usuario"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_BancoId_fkey" FOREIGN KEY ("BancoId") REFERENCES "Banco"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_EmpleadoId_fkey" FOREIGN KEY ("EmpleadoId") REFERENCES "Persona_Empleado"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Compra" ADD CONSTRAINT "Comprobante_Compra_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Compra" ADD CONSTRAINT "Comprobante_Compra_ProveedorId_fkey" FOREIGN KEY ("ProveedorId") REFERENCES "Proveedor"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_CtaCteProveedor" ADD CONSTRAINT "Comprobante_CtaCteProveedor_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_CtaCteProveedor" ADD CONSTRAINT "Comprobante_CtaCteProveedor_ProveedorId_fkey" FOREIGN KEY ("ProveedorId") REFERENCES "Proveedor"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_CuentaCorriente" ADD CONSTRAINT "Comprobante_CuentaCorriente_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_CuentaCorriente" ADD CONSTRAINT "Comprobante_CuentaCorriente_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_CuentaCorriente" ADD CONSTRAINT "Comprobante_CuentaCorriente_MovimientoCuentaCorrienteId_fkey" FOREIGN KEY ("MovimientoCuentaCorrienteId") REFERENCES "Movimiento_CuentaCorriente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Factura" ADD CONSTRAINT "Comprobante_Factura_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Factura" ADD CONSTRAINT "Comprobante_Factura_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_NotaCredito" ADD CONSTRAINT "Comprobante_NotaCredito_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_NotaCredito" ADD CONSTRAINT "Comprobante_NotaCredito_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Presupuesto" ADD CONSTRAINT "Comprobante_Presupuesto_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Presupuesto" ADD CONSTRAINT "Comprobante_Presupuesto_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Remito" ADD CONSTRAINT "Comprobante_Remito_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comprobante_Remito" ADD CONSTRAINT "Comprobante_Remito_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConceptoGastos" ADD CONSTRAINT "ConceptoGastos_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_CondicionIvaId_fkey" FOREIGN KEY ("CondicionIvaId") REFERENCES "CondicionIva"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_LocalidadId_fkey" FOREIGN KEY ("LocalidadId") REFERENCES "Localidad"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contador" ADD CONSTRAINT "Contador_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contador" ADD CONSTRAINT "Contador_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaBancarias" ADD CONSTRAINT "CuentaBancarias_BancoId_fkey" FOREIGN KEY ("BancoId") REFERENCES "Banco"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CuentaBancarias" ADD CONSTRAINT "CuentaBancarias_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_ProvinciaId_fkey" FOREIGN KEY ("ProvinciaId") REFERENCES "Provincia"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Localidad" ADD CONSTRAINT "Localidad_DepartamentoId_fkey" FOREIGN KEY ("DepartamentoId") REFERENCES "Departamento"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepositoCheques" ADD CONSTRAINT "DepositoCheques_ChequeId_fkey" FOREIGN KEY ("ChequeId") REFERENCES "Cheque"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepositoCheques" ADD CONSTRAINT "DepositoCheques_CuentaBancariaId_fkey" FOREIGN KEY ("CuentaBancariaId") REFERENCES "CuentaBancarias"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepositoCheques" ADD CONSTRAINT "DepositoCheques_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositoCheques" ADD CONSTRAINT "DepositoCheques_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCaja" ADD CONSTRAINT "DetalleCaja_CajaId_fkey" FOREIGN KEY ("CajaId") REFERENCES "Caja"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleCaja" ADD CONSTRAINT "DetalleCaja_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "Articulo"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormaPago" ADD CONSTRAINT "FormaPago_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormaPago" ADD CONSTRAINT "FormaPago_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormaPago_Cheque" ADD CONSTRAINT "FormaPago_Cheque_ChequeId_fkey" FOREIGN KEY ("ChequeId") REFERENCES "Cheque"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormaPago_Cheque" ADD CONSTRAINT "FormaPago_Cheque_Id_fkey" FOREIGN KEY ("Id") REFERENCES "FormaPago"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormaPago_CtaCte" ADD CONSTRAINT "FormaPago_CtaCte_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormaPago_CtaCte" ADD CONSTRAINT "FormaPago_CtaCte_Id_fkey" FOREIGN KEY ("Id") REFERENCES "FormaPago"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormaPago_Tarjeta" ADD CONSTRAINT "FormaPago_Tarjeta_Id_fkey" FOREIGN KEY ("Id") REFERENCES "FormaPago"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormaPago_Tarjeta" ADD CONSTRAINT "FormaPago_Tarjeta_TarjetaId_fkey" FOREIGN KEY ("TarjetaId") REFERENCES "Tarjeta"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormularioPerfil" ADD CONSTRAINT "FormularioPerfil_Formulario_Id_fkey" FOREIGN KEY ("Formulario_Id") REFERENCES "Formularios"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormularioPerfil" ADD CONSTRAINT "FormularioPerfil_Perfil_Id_fkey" FOREIGN KEY ("Perfil_Id") REFERENCES "Perfiles"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormularioPerfil" ADD CONSTRAINT "FormularioPerfil_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formularios" ADD CONSTRAINT "Formularios_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_CajaId_fkey" FOREIGN KEY ("CajaId") REFERENCES "Caja"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_ConceptoGastoId_fkey" FOREIGN KEY ("ConceptoGastoId") REFERENCES "ConceptoGastos"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marca" ADD CONSTRAINT "Marca_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivoBajas" ADD CONSTRAINT "MotivoBajas_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfiles" ADD CONSTRAINT "Perfiles_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permiso" ADD CONSTRAINT "Permiso_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_PerfilId_fkey" FOREIGN KEY ("PerfilId") REFERENCES "Perfiles"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_PermisoId_fkey" FOREIGN KEY ("PermisoId") REFERENCES "Permiso"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_Perfil_Id_fkey" FOREIGN KEY ("Perfil_Id") REFERENCES "Perfiles"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_Usuario_Id_fkey" FOREIGN KEY ("Usuario_Id") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_LocalidadId_fkey" FOREIGN KEY ("LocalidadId") REFERENCES "Localidad"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona_Cliente" ADD CONSTRAINT "Persona_Cliente_CondicionIvaId_fkey" FOREIGN KEY ("CondicionIvaId") REFERENCES "CondicionIva"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Persona_Cliente" ADD CONSTRAINT "Persona_Cliente_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Persona"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Persona_Empleado" ADD CONSTRAINT "Persona_Empleado_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Persona"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Precio" ADD CONSTRAINT "Precio_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_CondicionIvaId_fkey" FOREIGN KEY ("CondicionIvaId") REFERENCES "CondicionIva"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_LocalidadId_fkey" FOREIGN KEY ("LocalidadId") REFERENCES "Localidad"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubro" ADD CONSTRAINT "Rubro_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadMedida" ADD CONSTRAINT "UnidadMedida_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_EmpleadoId_fkey" FOREIGN KEY ("EmpleadoId") REFERENCES "Persona_Empleado"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_CajaId_fkey" FOREIGN KEY ("CajaId") REFERENCES "Caja"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento_CuentaCorriente" ADD CONSTRAINT "Movimiento_CuentaCorriente_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento_CuentaCorriente" ADD CONSTRAINT "Movimiento_CuentaCorriente_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Movimiento"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento_CuentaCorrienteProveedor" ADD CONSTRAINT "Movimiento_CuentaCorrienteProveedor_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Movimiento"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento_CuentaCorrienteProveedor" ADD CONSTRAINT "Movimiento_CuentaCorrienteProveedor_ProveedorId_fkey" FOREIGN KEY ("ProveedorId") REFERENCES "Proveedor"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_EmpleadoId_fkey" FOREIGN KEY ("EmpleadoId") REFERENCES "Persona_Empleado"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_SucursalId_fkey" FOREIGN KEY ("SucursalId") REFERENCES "Sucursal"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_UsuarioAfectadoId_fkey" FOREIGN KEY ("UsuarioAfectadoId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SesionActiva" ADD CONSTRAINT "SesionActiva_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionActiva" ADD CONSTRAINT "SesionActiva_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DispositivoConfiable" ADD CONSTRAINT "DispositivoConfiable_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispositivoConfiable" ADD CONSTRAINT "DispositivoConfiable_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "IntentoLogin" ADD CONSTRAINT "IntentoLogin_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoLogin" ADD CONSTRAINT "IntentoLogin_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "IpBloqueada" ADD CONSTRAINT "IpBloqueada_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenCsrf" ADD CONSTRAINT "TokenCsrf_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenCsrf" ADD CONSTRAINT "TokenCsrf_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Codigo2FA" ADD CONSTRAINT "Codigo2FA_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Codigo2FA" ADD CONSTRAINT "Codigo2FA_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_ResueltoPor_fkey" FOREIGN KEY ("ResueltoPor") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;
