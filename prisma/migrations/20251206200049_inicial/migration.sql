BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[__MigrationHistory] (
    [MigrationId] NVARCHAR(150) NOT NULL,
    [ContextKey] NVARCHAR(300) NOT NULL,
    [Model] VARBINARY(max) NOT NULL,
    [ProductVersion] NVARCHAR(32) NOT NULL,
    CONSTRAINT [PK_dbo.__MigrationHistory] PRIMARY KEY CLUSTERED ([MigrationId],[ContextKey])
);

-- CreateTable
CREATE TABLE [dbo].[Tenant] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Nombre] VARCHAR(250) NOT NULL,
    [Dominio] VARCHAR(400),
    [RazonSocial] VARCHAR(250),
    [Cuit] VARCHAR(20),
    [Email] VARCHAR(250),
    [Telefono] VARCHAR(25),
    [EstaActivo] BIT NOT NULL CONSTRAINT [Tenant_EstaActivo_df] DEFAULT 1,
    [PlanId] BIGINT,
    CONSTRAINT [Tenant_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_Tenant_Dominio] UNIQUE NONCLUSTERED ([Dominio])
);

-- CreateTable
CREATE TABLE [dbo].[PlanSaaS] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Nombre] VARCHAR(200) NOT NULL,
    [Descripcion] VARCHAR(800),
    [CostoMensual] DECIMAL(18,2) NOT NULL,
    [Caracteristicas] VARCHAR(4000),
    CONSTRAINT [PlanSaaS_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_PlanSaaS_Nombre] UNIQUE NONCLUSTERED ([Nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Log] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [TenantId] BIGINT,
    [Fecha] DATETIME NOT NULL CONSTRAINT [Log_Fecha_df] DEFAULT CURRENT_TIMESTAMP,
    [Nivel] VARCHAR(50) NOT NULL,
    [Servicio] VARCHAR(200),
    [Mensaje] VARCHAR(4000) NOT NULL,
    [Metadata] VARCHAR(4000),
    CONSTRAINT [Log_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Articulo] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [MarcaId] BIGINT NOT NULL,
    [RubroId] BIGINT NOT NULL,
    [UnidadMedidaId] BIGINT NOT NULL,
    [IvaId] BIGINT NOT NULL,
    [PrecioId] BIGINT NOT NULL,
    [Codigo] INT NOT NULL,
    [CodigoBarra] VARCHAR(100) NOT NULL,
    [Abreviatura] VARCHAR(20),
    [Descripcion] VARCHAR(250) NOT NULL,
    [Detalle] VARCHAR(500),
    [Ubicacion] VARCHAR(500),
    [PrecioCosto] DECIMAL(18,2) NOT NULL,
    [PorcentajeGanancia] DECIMAL(18,2) NOT NULL,
    [Foto] VARBINARY(max) NOT NULL,
    [ActivarLimiteVenta] BIT NOT NULL,
    [LimiteVenta] DECIMAL(18,2) NOT NULL,
    [ActivarHoraVenta] BIT NOT NULL,
    [HoraLimiteVentaDesde] DATETIME NOT NULL,
    [HoraLimiteVentaHasta] DATETIME NOT NULL,
    [PermiteStockNegativo] BIT NOT NULL,
    [DescuentaStock] BIT NOT NULL,
    [StockMinimo] DECIMAL(18,2) NOT NULL,
    [VencimientoDias] INT NOT NULL,
    [TipoVenta] INT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Articulo] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[BajaArticulo] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [ArticuloId] BIGINT NOT NULL,
    [MotivoBajaId] BIGINT NOT NULL,
    [Cantidad] DECIMAL(18,2) NOT NULL,
    [Fecha] DATETIME NOT NULL,
    [Observacion] VARCHAR(400) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.BajaArticulo] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Banco] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Banco] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Caja] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [UsuarioAperturaId] BIGINT NOT NULL,
    [MontoInicial] DECIMAL(18,2) NOT NULL,
    [FechaApertura] DATETIME NOT NULL,
    [UsuarioCierreId] BIGINT,
    [FechaCierre] DATETIME,
    [MontoCierre] DECIMAL(18,2),
    [TotalEntradaEfectivo] DECIMAL(18,2) NOT NULL,
    [TotalSalidaEfectivo] DECIMAL(18,2) NOT NULL,
    [TotalEntradaTarjeta] DECIMAL(18,2) NOT NULL,
    [TotalSalidaTarjeta] DECIMAL(18,2) NOT NULL,
    [TotalEntradaCheque] DECIMAL(18,2) NOT NULL,
    [TotalSalidaCheque] DECIMAL(18,2) NOT NULL,
    [TotalEntradaCtaCte] DECIMAL(18,2) NOT NULL,
    [TotalSalidaCtaCte] DECIMAL(18,2) NOT NULL,
    [TotalEntradaTransf] DECIMAL(18,2) NOT NULL,
    [TotalSalidaTransf] DECIMAL(18,2) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [Ganancia] DECIMAL(18,2) NOT NULL CONSTRAINT [DF__Caja__Ganancia__0880433F] DEFAULT 0,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Caja] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Cheque] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [ClienteId] BIGINT NOT NULL,
    [BancoId] BIGINT NOT NULL,
    [Numero] VARCHAR(100) NOT NULL,
    [FechaVencimiento] DATETIME NOT NULL,
    [EstaRechazado] BIT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Cheque] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [EmpleadoId] BIGINT NOT NULL,
    [UsuarioId] BIGINT NOT NULL,
    [Fecha] DATETIME NOT NULL,
    [Numero] INT NOT NULL,
    [SubTotal] DECIMAL(18,2) NOT NULL,
    [Descuento] DECIMAL(18,2) NOT NULL,
    [Total] DECIMAL(18,2) NOT NULL,
    [Iva21] DECIMAL(18,2) NOT NULL,
    [Iva105] DECIMAL(18,2) NOT NULL,
    [TipoComprobante] INT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante_Compra] (
    [Id] BIGINT NOT NULL,
    [ProveedorId] BIGINT NOT NULL,
    [FechaEntrega] DATETIME NOT NULL,
    [Iva27] DECIMAL(18,2) NOT NULL,
    [PrecepcionTemp] DECIMAL(18,2) NOT NULL,
    [PrecepcionPyP] DECIMAL(18,2) NOT NULL,
    [PrecepcionIva] DECIMAL(18,2) NOT NULL,
    [PrecepcionIB] DECIMAL(18,2) NOT NULL,
    [EstadoFactura] INT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante_Compra] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante_CtaCteProveedor] (
    [Id] BIGINT NOT NULL,
    [ProveedorId] BIGINT NOT NULL,
    [Estado] INT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante_CtaCteProveedor] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante_CuentaCorriente] (
    [Id] BIGINT NOT NULL,
    [ClienteId] BIGINT NOT NULL,
    [MovimientoCuentaCorrienteId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante_CuentaCorriente] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante_Factura] (
    [Id] BIGINT NOT NULL,
    [ClienteId] BIGINT NOT NULL,
    [PuestoTrabajoId] BIGINT NOT NULL,
    [Estado] INT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante_Factura] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante_NotaCredito] (
    [Id] BIGINT NOT NULL,
    [ComprobanteId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante_NotaCredito] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante_Presupuesto] (
    [Id] BIGINT NOT NULL,
    [ClienteId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante_Presupuesto] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Comprobante_Remito] (
    [Id] BIGINT NOT NULL,
    [ClienteId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Comprobante_Remito] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ConceptoGastos] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.ConceptoGastos] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[CondicionIva] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(150) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    CONSTRAINT [PK_dbo.CondicionIva] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [Index_Descripcion_CondicionIva] UNIQUE NONCLUSTERED ([Descripcion])
);

-- CreateTable
CREATE TABLE [dbo].[Configuracion] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [RazonSocial] VARCHAR(250) NOT NULL,
    [NombreFantasia] VARCHAR(250),
    [Cuit] VARCHAR(13) NOT NULL,
    [Telefono] VARCHAR(25),
    [Celular] VARCHAR(25),
    [Direccion] VARCHAR(400) NOT NULL,
    [Email] VARCHAR(250),
    [LocalidadId] BIGINT NOT NULL,
    [FacturaDescuentaStock] BIT NOT NULL,
    [PresupuestoDescuentaStock] BIT NOT NULL,
    [RemitoDescuentaStock] BIT NOT NULL,
    [ActualizaCostoDesdeCompra] BIT NOT NULL,
    [ModificaPrecioVentaDesdeCompra] BIT NOT NULL,
    [DepositoId] BIGINT NOT NULL,
    [Imprimir] BIT NOT NULL,
    [Instalada] INT,
    [TipoFormaPagoPorDefectoVenta] INT NOT NULL,
    [TipoFormaPagoPorDefectoCompra] INT NOT NULL,
    [ObservacionEnPieFactura] VARCHAR(400),
    [UnificarRenglonesIngresarMismoProducto] BIT NOT NULL,
    [IngresoManualCajaInicial] BIT NOT NULL,
    [PuestoCajaSeparado] BIT NOT NULL,
    [ActivarRetiroDeCaja] BIT NOT NULL,
    [MontoMaximoRetiroCaja] DECIMAL(18,2) NOT NULL,
    [ActivarBascula] BIT NOT NULL,
    [EtiquetaPorPeso] BIT NOT NULL,
    [CodigoBascula] VARCHAR(8000),
    [EstaEliminado] BIT NOT NULL,
    [Foto] VARBINARY(max),
    [ShowFoto] BIT NOT NULL CONSTRAINT [DF__Configura__ShowF__19AACF41] DEFAULT 0,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Configuracion] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Contador] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [TipoComprobante] INT NOT NULL,
    [Valor] INT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Contador] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[CuentaBancarias] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [BancoId] BIGINT NOT NULL,
    [Numero] VARCHAR(100) NOT NULL,
    [Titular] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.CuentaBancarias] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Departamento] (
    [Id] BIGINT NOT NULL,
    [ProvinciaId] BIGINT NOT NULL,
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    CONSTRAINT [PK_dbo.Departamento] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_Departamento_Id] UNIQUE NONCLUSTERED ([Id]),
    CONSTRAINT [Index_ProvinciaId_Descripcion_Departamento] UNIQUE NONCLUSTERED ([ProvinciaId],[Descripcion])
);

-- CreateTable
CREATE TABLE [dbo].[Deposito] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [Ubicacion] VARCHAR(400),
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Deposito] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [Index_Descripcion_Deposito] UNIQUE NONCLUSTERED ([Descripcion])
);

-- CreateTable
CREATE TABLE [dbo].[DepositoCheques] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [ChequeId] BIGINT NOT NULL,
    [CuentaBancariaId] BIGINT NOT NULL,
    [Fecha] DATETIME NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.DepositoCheques] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[DetalleCaja] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [CajaId] BIGINT NOT NULL,
    [TipoPago] INT NOT NULL,
    [Monto] DECIMAL(18,2) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.DetalleCaja] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[DetalleComprobante] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [ComprobanteId] BIGINT NOT NULL,
    [ArticuloId] BIGINT NOT NULL,
    [Codigo] VARCHAR(8000) NOT NULL,
    [Descripcion] VARCHAR(8000) NOT NULL,
    [Cantidad] DECIMAL(18,3) NOT NULL,
    [Iva] DECIMAL(18,2) NOT NULL,
    [Precio] DECIMAL(18,2) NOT NULL,
    [SubTotal] DECIMAL(18,2) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [Costo] DECIMAL(18,2) NOT NULL CONSTRAINT [DF__DetalleCo__Costo__078C1F06] DEFAULT 0,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.DetalleComprobante] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[FormaPago] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [ComprobanteId] BIGINT NOT NULL,
    [TipoPago] INT NOT NULL,
    [Monto] DECIMAL(18,2) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.FormaPago] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[FormaPago_Cheque] (
    [Id] BIGINT NOT NULL,
    [ChequeId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.FormaPago_Cheque] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[FormaPago_CtaCte] (
    [Id] BIGINT NOT NULL,
    [ClienteId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.FormaPago_CtaCte] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[FormaPago_Tarjeta] (
    [Id] BIGINT NOT NULL,
    [TarjetaId] BIGINT NOT NULL,
    [NumeroTarjeta] VARCHAR(100) NOT NULL,
    [CuponPago] VARCHAR(100) NOT NULL,
    [CantidadCuotas] INT NOT NULL,
    CONSTRAINT [PK_dbo.FormaPago_Tarjeta] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[FormularioPerfil] (
    [Formulario_Id] BIGINT NOT NULL,
    [Perfil_Id] BIGINT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.FormularioPerfil] PRIMARY KEY CLUSTERED ([Formulario_Id],[Perfil_Id])
);

-- CreateTable
CREATE TABLE [dbo].[Formularios] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Codigo] INT NOT NULL,
    [Nombre] VARCHAR(250) NOT NULL,
    [NombreCompleto] VARCHAR(400) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Formularios] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Gasto] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [CajaId] BIGINT NOT NULL,
    [ConceptoGastoId] BIGINT NOT NULL,
    [Fecha] DATETIME NOT NULL,
    [Descripcion] VARCHAR(400) NOT NULL,
    [Monto] DECIMAL(18,2) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Gasto] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Iva] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [Porcentaje] DECIMAL(18,2) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    CONSTRAINT [PK_dbo.Iva] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Localidad] (
    [Id] BIGINT NOT NULL,
    [DepartamentoId] BIGINT NOT NULL,
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    CONSTRAINT [PK_dbo.Localidad] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_Localidad_Id] UNIQUE NONCLUSTERED ([Id]),
    CONSTRAINT [Index_DepartamentoId_Descripcion_Localidad] UNIQUE NONCLUSTERED ([DepartamentoId],[Descripcion])
);

-- CreateTable
CREATE TABLE [dbo].[Marca] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Marca] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[MotivoBajas] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.MotivoBajas] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Movimiento] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [CajaId] BIGINT NOT NULL,
    [ComprobanteId] BIGINT NOT NULL,
    [UsuarioId] BIGINT NOT NULL,
    [Monto] DECIMAL(18,2) NOT NULL,
    [Fecha] DATETIME NOT NULL,
    [Descripcion] VARCHAR(4000) NOT NULL,
    [TipoMovimiento] INT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Movimiento] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Movimiento_CuentaCorriente] (
    [Id] BIGINT NOT NULL,
    [ClienteId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Movimiento_CuentaCorriente] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Movimiento_CuentaCorrienteProveedor] (
    [Id] BIGINT NOT NULL,
    [ProveedorId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Movimiento_CuentaCorrienteProveedor] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Perfiles] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Perfiles] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[PerfilUsuario] (
    [Perfil_Id] BIGINT NOT NULL,
    [Usuario_Id] BIGINT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.PerfilUsuario] PRIMARY KEY CLUSTERED ([Perfil_Id],[Usuario_Id])
);

-- CreateTable
CREATE TABLE [dbo].[Persona] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Apellido] VARCHAR(150) NOT NULL,
    [Nombre] VARCHAR(200) NOT NULL,
    [Dni] VARCHAR(8),
    [Direccion] VARCHAR(400) NOT NULL,
    [Telefono] VARCHAR(25),
    [Mail] VARCHAR(250) NOT NULL,
    [LocalidadId] BIGINT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Persona] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Persona_Cliente] (
    [Id] BIGINT NOT NULL,
    [CondicionIvaId] BIGINT NOT NULL,
    [ActivarCtaCte] BIT NOT NULL,
    [TieneLimiteCompra] BIT NOT NULL,
    [MontoMaximoCtaCte] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [PK_dbo.Persona_Cliente] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Persona_Empleado] (
    [Id] BIGINT NOT NULL,
    [Legajo] INT NOT NULL,
    [Foto] VARBINARY(max) NOT NULL,
    CONSTRAINT [PK_dbo.Persona_Empleado] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Precio] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [ArticuloId] BIGINT NOT NULL,
    [PrecioCosto] DECIMAL(18,2) NOT NULL,
    [PorcentajeGanancia] DECIMAL(18,2) NOT NULL,
    [PrecioPublico] DECIMAL(18,2) NOT NULL,
    [PorcentajeGanancia2] DECIMAL(18,2) NOT NULL,
    [PrecioPublico2] DECIMAL(18,2) NOT NULL,
    [FechaActualizacion] DATETIME NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Precio] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Proveedor] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [RazonSocial] VARCHAR(250) NOT NULL,
    [CUIT] VARCHAR(15) NOT NULL,
    [Direccion] VARCHAR(400) NOT NULL,
    [Telefono] VARCHAR(25),
    [Mail] VARCHAR(250) NOT NULL,
    [LocalidadId] BIGINT NOT NULL,
    [CondicionIvaId] BIGINT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Proveedor] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Provincia] (
    [Id] BIGINT NOT NULL,
    [Descripcion] VARCHAR(100) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    CONSTRAINT [PK_dbo.Provincia] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_Provincia_Id] UNIQUE NONCLUSTERED ([Id]),
    CONSTRAINT [Index_Descripcion_Provincia] UNIQUE NONCLUSTERED ([Descripcion])
);

-- CreateTable
CREATE TABLE [dbo].[PuestoTrabajo] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Codigo] INT NOT NULL,
    [Descripcion] VARCHAR(8000),
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.PuestoTrabajo] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Rubro] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Rubro] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Stock] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [ArticuloId] BIGINT NOT NULL,
    [DepositoId] BIGINT NOT NULL,
    [Cantidad] DECIMAL(18,3) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Stock] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B614B68736B] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- CreateTable
CREATE TABLE [dbo].[Tarjeta] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Tarjeta] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[UnidadMedida] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [Descripcion] VARCHAR(250) NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.UnidadMedida] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[Usuario] (
    [Id] BIGINT NOT NULL IDENTITY(1,1),
    [EmpleadoId] BIGINT NOT NULL,
    [Nombre] VARCHAR(50) NOT NULL,
    [Password] VARCHAR(400) NOT NULL,
    [EstaBloqueado] BIT NOT NULL,
    [EstaEliminado] BIT NOT NULL,
    [TenantId] BIGINT NOT NULL,
    CONSTRAINT [PK_dbo.Usuario] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Tenant_PlanId] ON [dbo].[Tenant]([PlanId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Log_TenantId_idx] ON [dbo].[Log]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Log_Fecha_idx] ON [dbo].[Log]([Fecha]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Articulo_TenantId_idx] ON [dbo].[Articulo]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_IvaId] ON [dbo].[Articulo]([IvaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_MarcaId] ON [dbo].[Articulo]([MarcaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PrecioId] ON [dbo].[Articulo]([PrecioId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_RubroId] ON [dbo].[Articulo]([RubroId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_UnidadMedidaId] ON [dbo].[Articulo]([UnidadMedidaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BajaArticulo_TenantId_idx] ON [dbo].[BajaArticulo]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ArticuloId] ON [dbo].[BajaArticulo]([ArticuloId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_MotivoBajaId] ON [dbo].[BajaArticulo]([MotivoBajaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Banco_TenantId_idx] ON [dbo].[Banco]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Caja_TenantId_idx] ON [dbo].[Caja]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_UsuarioAperturaId] ON [dbo].[Caja]([UsuarioAperturaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_UsuarioCierreId] ON [dbo].[Caja]([UsuarioCierreId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Cheque_TenantId_idx] ON [dbo].[Cheque]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BancoId] ON [dbo].[Cheque]([BancoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClienteId] ON [dbo].[Cheque]([ClienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Comprobante_TenantId_idx] ON [dbo].[Comprobante]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_EmpleadoId] ON [dbo].[Comprobante]([EmpleadoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_UsuarioId] ON [dbo].[Comprobante]([UsuarioId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Comprobante_Compra]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProveedorId] ON [dbo].[Comprobante_Compra]([ProveedorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Comprobante_CtaCteProveedor]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProveedorId] ON [dbo].[Comprobante_CtaCteProveedor]([ProveedorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClienteId] ON [dbo].[Comprobante_CuentaCorriente]([ClienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Comprobante_CuentaCorriente]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_MovimientoCuentaCorrienteId] ON [dbo].[Comprobante_CuentaCorriente]([MovimientoCuentaCorrienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClienteId] ON [dbo].[Comprobante_Factura]([ClienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Comprobante_Factura]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PuestoTrabajoId] ON [dbo].[Comprobante_Factura]([PuestoTrabajoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ComprobanteId] ON [dbo].[Comprobante_NotaCredito]([ComprobanteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Comprobante_NotaCredito]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClienteId] ON [dbo].[Comprobante_Presupuesto]([ClienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Comprobante_Presupuesto]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClienteId] ON [dbo].[Comprobante_Remito]([ClienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Comprobante_Remito]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ConceptoGastos_TenantId_idx] ON [dbo].[ConceptoGastos]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Configuracion_TenantId_idx] ON [dbo].[Configuracion]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_DepositoId] ON [dbo].[Configuracion]([DepositoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_LocalidadId] ON [dbo].[Configuracion]([LocalidadId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contador_TenantId_idx] ON [dbo].[Contador]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CuentaBancarias_TenantId_idx] ON [dbo].[CuentaBancarias]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BancoId] ON [dbo].[CuentaBancarias]([BancoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Deposito_TenantId_idx] ON [dbo].[Deposito]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DepositoCheques_TenantId_idx] ON [dbo].[DepositoCheques]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChequeId] ON [dbo].[DepositoCheques]([ChequeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_CuentaBancariaId] ON [dbo].[DepositoCheques]([CuentaBancariaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DetalleCaja_TenantId_idx] ON [dbo].[DetalleCaja]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_CajaId] ON [dbo].[DetalleCaja]([CajaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DetalleComprobante_TenantId_idx] ON [dbo].[DetalleComprobante]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ArticuloId] ON [dbo].[DetalleComprobante]([ArticuloId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ComprobanteId] ON [dbo].[DetalleComprobante]([ComprobanteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FormaPago_TenantId_idx] ON [dbo].[FormaPago]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ComprobanteId] ON [dbo].[FormaPago]([ComprobanteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChequeId] ON [dbo].[FormaPago_Cheque]([ChequeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[FormaPago_Cheque]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClienteId] ON [dbo].[FormaPago_CtaCte]([ClienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[FormaPago_CtaCte]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[FormaPago_Tarjeta]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_TarjetaId] ON [dbo].[FormaPago_Tarjeta]([TarjetaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FormularioPerfil_TenantId_idx] ON [dbo].[FormularioPerfil]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Formulario_Id] ON [dbo].[FormularioPerfil]([Formulario_Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Perfil_Id] ON [dbo].[FormularioPerfil]([Perfil_Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Formularios_TenantId_idx] ON [dbo].[Formularios]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Gasto_TenantId_idx] ON [dbo].[Gasto]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_CajaId] ON [dbo].[Gasto]([CajaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ConceptoGastoId] ON [dbo].[Gasto]([ConceptoGastoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Marca_TenantId_idx] ON [dbo].[Marca]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MotivoBajas_TenantId_idx] ON [dbo].[MotivoBajas]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Movimiento_TenantId_idx] ON [dbo].[Movimiento]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_CajaId] ON [dbo].[Movimiento]([CajaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ComprobanteId] ON [dbo].[Movimiento]([ComprobanteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_UsuarioId] ON [dbo].[Movimiento]([UsuarioId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ClienteId] ON [dbo].[Movimiento_CuentaCorriente]([ClienteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Movimiento_CuentaCorriente]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Movimiento_CuentaCorrienteProveedor]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProveedorId] ON [dbo].[Movimiento_CuentaCorrienteProveedor]([ProveedorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Perfiles_TenantId_idx] ON [dbo].[Perfiles]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PerfilUsuario_TenantId_idx] ON [dbo].[PerfilUsuario]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Perfil_Id] ON [dbo].[PerfilUsuario]([Perfil_Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Usuario_Id] ON [dbo].[PerfilUsuario]([Usuario_Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Persona_TenantId_idx] ON [dbo].[Persona]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_LocalidadId] ON [dbo].[Persona]([LocalidadId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_CondicionIvaId] ON [dbo].[Persona_Cliente]([CondicionIvaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Persona_Cliente]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Id] ON [dbo].[Persona_Empleado]([Id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Precio_TenantId_idx] ON [dbo].[Precio]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Proveedor_TenantId_idx] ON [dbo].[Proveedor]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_CondicionIvaId] ON [dbo].[Proveedor]([CondicionIvaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_LocalidadId] ON [dbo].[Proveedor]([LocalidadId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PuestoTrabajo_TenantId_idx] ON [dbo].[PuestoTrabajo]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Rubro_TenantId_idx] ON [dbo].[Rubro]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Stock_TenantId_idx] ON [dbo].[Stock]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ArticuloId] ON [dbo].[Stock]([ArticuloId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_DepositoId] ON [dbo].[Stock]([DepositoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Tarjeta_TenantId_idx] ON [dbo].[Tarjeta]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UnidadMedida_TenantId_idx] ON [dbo].[UnidadMedida]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Usuario_TenantId_idx] ON [dbo].[Usuario]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_EmpleadoId] ON [dbo].[Usuario]([EmpleadoId]);

-- AddForeignKey
ALTER TABLE [dbo].[Tenant] ADD CONSTRAINT [Tenant_PlanId_fkey] FOREIGN KEY ([PlanId]) REFERENCES [dbo].[PlanSaaS]([Id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Log] ADD CONSTRAINT [Log_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Articulo] ADD CONSTRAINT [Articulo_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Articulo] ADD CONSTRAINT [FK_dbo.Articulo_dbo.Iva_IvaId] FOREIGN KEY ([IvaId]) REFERENCES [dbo].[Iva]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Articulo] ADD CONSTRAINT [FK_dbo.Articulo_dbo.Marca_MarcaId] FOREIGN KEY ([MarcaId]) REFERENCES [dbo].[Marca]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Articulo] ADD CONSTRAINT [FK_dbo.Articulo_dbo.Precio_PrecioId] FOREIGN KEY ([PrecioId]) REFERENCES [dbo].[Precio]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Articulo] ADD CONSTRAINT [FK_dbo.Articulo_dbo.Rubro_RubroId] FOREIGN KEY ([RubroId]) REFERENCES [dbo].[Rubro]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Articulo] ADD CONSTRAINT [FK_dbo.Articulo_dbo.UnidadMedida_UnidadMedidaId] FOREIGN KEY ([UnidadMedidaId]) REFERENCES [dbo].[UnidadMedida]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BajaArticulo] ADD CONSTRAINT [BajaArticulo_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BajaArticulo] ADD CONSTRAINT [FK_dbo.BajaArticulo_dbo.Articulo_ArticuloId] FOREIGN KEY ([ArticuloId]) REFERENCES [dbo].[Articulo]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BajaArticulo] ADD CONSTRAINT [FK_dbo.BajaArticulo_dbo.MotivoBajas_MotivoBajaId] FOREIGN KEY ([MotivoBajaId]) REFERENCES [dbo].[MotivoBajas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Banco] ADD CONSTRAINT [Banco_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Caja] ADD CONSTRAINT [Caja_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Caja] ADD CONSTRAINT [FK_dbo.Caja_dbo.Usuario_UsuarioAperturaId] FOREIGN KEY ([UsuarioAperturaId]) REFERENCES [dbo].[Usuario]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Caja] ADD CONSTRAINT [FK_dbo.Caja_dbo.Usuario_UsuarioCierreId] FOREIGN KEY ([UsuarioCierreId]) REFERENCES [dbo].[Usuario]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cheque] ADD CONSTRAINT [Cheque_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Cheque] ADD CONSTRAINT [FK_dbo.Cheque_dbo.Banco_BancoId] FOREIGN KEY ([BancoId]) REFERENCES [dbo].[Banco]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cheque] ADD CONSTRAINT [FK_dbo.Cheque_dbo.Persona_Cliente_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [dbo].[Persona_Cliente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante] ADD CONSTRAINT [Comprobante_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante] ADD CONSTRAINT [FK_dbo.Comprobante_dbo.Persona_Empleado_EmpleadoId] FOREIGN KEY ([EmpleadoId]) REFERENCES [dbo].[Persona_Empleado]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante] ADD CONSTRAINT [FK_dbo.Comprobante_dbo.Usuario_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuario]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Compra] ADD CONSTRAINT [FK_dbo.Comprobante_Compra_dbo.Comprobante_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Compra] ADD CONSTRAINT [FK_dbo.Comprobante_Compra_dbo.Proveedor_ProveedorId] FOREIGN KEY ([ProveedorId]) REFERENCES [dbo].[Proveedor]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_CtaCteProveedor] ADD CONSTRAINT [FK_dbo.Comprobante_CtaCteProveedor_dbo.Comprobante_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_CtaCteProveedor] ADD CONSTRAINT [FK_dbo.Comprobante_CtaCteProveedor_dbo.Proveedor_ProveedorId] FOREIGN KEY ([ProveedorId]) REFERENCES [dbo].[Proveedor]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_CuentaCorriente] ADD CONSTRAINT [FK_dbo.Comprobante_CuentaCorriente_dbo.Comprobante_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_CuentaCorriente] ADD CONSTRAINT [FK_dbo.Comprobante_CuentaCorriente_dbo.Movimiento_CuentaCorriente_MovimientoCuentaCorrienteId] FOREIGN KEY ([MovimientoCuentaCorrienteId]) REFERENCES [dbo].[Movimiento_CuentaCorriente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_CuentaCorriente] ADD CONSTRAINT [FK_dbo.Comprobante_CuentaCorriente_dbo.Persona_Cliente_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [dbo].[Persona_Cliente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Factura] ADD CONSTRAINT [FK_dbo.Comprobante_Factura_dbo.Comprobante_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Factura] ADD CONSTRAINT [FK_dbo.Comprobante_Factura_dbo.Persona_Cliente_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [dbo].[Persona_Cliente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Factura] ADD CONSTRAINT [FK_dbo.Comprobante_Factura_dbo.PuestoTrabajo_PuestoTrabajoId] FOREIGN KEY ([PuestoTrabajoId]) REFERENCES [dbo].[PuestoTrabajo]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_NotaCredito] ADD CONSTRAINT [FK_dbo.Comprobante_NotaCredito_dbo.Comprobante_ComprobanteId] FOREIGN KEY ([ComprobanteId]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_NotaCredito] ADD CONSTRAINT [FK_dbo.Comprobante_NotaCredito_dbo.Comprobante_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Presupuesto] ADD CONSTRAINT [FK_dbo.Comprobante_Presupuesto_dbo.Comprobante_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Presupuesto] ADD CONSTRAINT [FK_dbo.Comprobante_Presupuesto_dbo.Persona_Cliente_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [dbo].[Persona_Cliente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Remito] ADD CONSTRAINT [FK_dbo.Comprobante_Remito_dbo.Comprobante_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante_Remito] ADD CONSTRAINT [FK_dbo.Comprobante_Remito_dbo.Persona_Cliente_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [dbo].[Persona_Cliente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ConceptoGastos] ADD CONSTRAINT [ConceptoGastos_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Configuracion] ADD CONSTRAINT [Configuracion_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Configuracion] ADD CONSTRAINT [FK_dbo.Configuracion_dbo.Deposito_DepositoId] FOREIGN KEY ([DepositoId]) REFERENCES [dbo].[Deposito]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Configuracion] ADD CONSTRAINT [FK_dbo.Configuracion_dbo.Localidad_LocalidadId] FOREIGN KEY ([LocalidadId]) REFERENCES [dbo].[Localidad]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Contador] ADD CONSTRAINT [Contador_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CuentaBancarias] ADD CONSTRAINT [CuentaBancarias_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CuentaBancarias] ADD CONSTRAINT [FK_dbo.CuentaBancarias_dbo.Banco_BancoId] FOREIGN KEY ([BancoId]) REFERENCES [dbo].[Banco]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Departamento] ADD CONSTRAINT [FK_dbo.Departamento_dbo.Provincia_ProvinciaId] FOREIGN KEY ([ProvinciaId]) REFERENCES [dbo].[Provincia]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Deposito] ADD CONSTRAINT [Deposito_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DepositoCheques] ADD CONSTRAINT [DepositoCheques_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DepositoCheques] ADD CONSTRAINT [FK_dbo.DepositoCheques_dbo.Cheque_ChequeId] FOREIGN KEY ([ChequeId]) REFERENCES [dbo].[Cheque]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepositoCheques] ADD CONSTRAINT [FK_dbo.DepositoCheques_dbo.CuentaBancarias_CuentaBancariaId] FOREIGN KEY ([CuentaBancariaId]) REFERENCES [dbo].[CuentaBancarias]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DetalleCaja] ADD CONSTRAINT [DetalleCaja_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DetalleCaja] ADD CONSTRAINT [FK_dbo.DetalleCaja_dbo.Caja_CajaId] FOREIGN KEY ([CajaId]) REFERENCES [dbo].[Caja]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DetalleComprobante] ADD CONSTRAINT [DetalleComprobante_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DetalleComprobante] ADD CONSTRAINT [FK_dbo.DetalleComprobante_dbo.Articulo_ArticuloId] FOREIGN KEY ([ArticuloId]) REFERENCES [dbo].[Articulo]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DetalleComprobante] ADD CONSTRAINT [FK_dbo.DetalleComprobante_dbo.Comprobante_ComprobanteId] FOREIGN KEY ([ComprobanteId]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago] ADD CONSTRAINT [FK_dbo.FormaPago_dbo.Comprobante_ComprobanteId] FOREIGN KEY ([ComprobanteId]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago] ADD CONSTRAINT [FormaPago_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago_Cheque] ADD CONSTRAINT [FK_dbo.FormaPago_Cheque_dbo.Cheque_ChequeId] FOREIGN KEY ([ChequeId]) REFERENCES [dbo].[Cheque]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago_Cheque] ADD CONSTRAINT [FK_dbo.FormaPago_Cheque_dbo.FormaPago_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[FormaPago]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago_CtaCte] ADD CONSTRAINT [FK_dbo.FormaPago_CtaCte_dbo.FormaPago_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[FormaPago]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago_CtaCte] ADD CONSTRAINT [FK_dbo.FormaPago_CtaCte_dbo.Persona_Cliente_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [dbo].[Persona_Cliente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago_Tarjeta] ADD CONSTRAINT [FK_dbo.FormaPago_Tarjeta_dbo.FormaPago_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[FormaPago]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago_Tarjeta] ADD CONSTRAINT [FK_dbo.FormaPago_Tarjeta_dbo.Tarjeta_TarjetaId] FOREIGN KEY ([TarjetaId]) REFERENCES [dbo].[Tarjeta]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormularioPerfil] ADD CONSTRAINT [FK_dbo.FormularioPerfil_dbo.Formularios_Formulario_Id] FOREIGN KEY ([Formulario_Id]) REFERENCES [dbo].[Formularios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormularioPerfil] ADD CONSTRAINT [FK_dbo.FormularioPerfil_dbo.Perfiles_Perfil_Id] FOREIGN KEY ([Perfil_Id]) REFERENCES [dbo].[Perfiles]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FormularioPerfil] ADD CONSTRAINT [FormularioPerfil_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Formularios] ADD CONSTRAINT [Formularios_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gasto] ADD CONSTRAINT [FK_dbo.Gasto_dbo.Caja_CajaId] FOREIGN KEY ([CajaId]) REFERENCES [dbo].[Caja]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Gasto] ADD CONSTRAINT [FK_dbo.Gasto_dbo.ConceptoGastos_ConceptoGastoId] FOREIGN KEY ([ConceptoGastoId]) REFERENCES [dbo].[ConceptoGastos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Gasto] ADD CONSTRAINT [Gasto_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Localidad] ADD CONSTRAINT [FK_dbo.Localidad_dbo.Departamento_DepartamentoId] FOREIGN KEY ([DepartamentoId]) REFERENCES [dbo].[Departamento]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Marca] ADD CONSTRAINT [Marca_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MotivoBajas] ADD CONSTRAINT [MotivoBajas_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento] ADD CONSTRAINT [FK_dbo.Movimiento_dbo.Caja_CajaId] FOREIGN KEY ([CajaId]) REFERENCES [dbo].[Caja]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento] ADD CONSTRAINT [FK_dbo.Movimiento_dbo.Comprobante_ComprobanteId] FOREIGN KEY ([ComprobanteId]) REFERENCES [dbo].[Comprobante]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento] ADD CONSTRAINT [FK_dbo.Movimiento_dbo.Usuario_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuario]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento] ADD CONSTRAINT [Movimiento_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento_CuentaCorriente] ADD CONSTRAINT [FK_dbo.Movimiento_CuentaCorriente_dbo.Movimiento_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Movimiento]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento_CuentaCorriente] ADD CONSTRAINT [FK_dbo.Movimiento_CuentaCorriente_dbo.Persona_Cliente_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [dbo].[Persona_Cliente]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento_CuentaCorrienteProveedor] ADD CONSTRAINT [FK_dbo.Movimiento_CuentaCorrienteProveedor_dbo.Movimiento_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Movimiento]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento_CuentaCorrienteProveedor] ADD CONSTRAINT [FK_dbo.Movimiento_CuentaCorrienteProveedor_dbo.Proveedor_ProveedorId] FOREIGN KEY ([ProveedorId]) REFERENCES [dbo].[Proveedor]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Perfiles] ADD CONSTRAINT [Perfiles_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PerfilUsuario] ADD CONSTRAINT [FK_dbo.PerfilUsuario_dbo.Perfiles_Perfil_Id] FOREIGN KEY ([Perfil_Id]) REFERENCES [dbo].[Perfiles]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PerfilUsuario] ADD CONSTRAINT [FK_dbo.PerfilUsuario_dbo.Usuario_Usuario_Id] FOREIGN KEY ([Usuario_Id]) REFERENCES [dbo].[Usuario]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PerfilUsuario] ADD CONSTRAINT [PerfilUsuario_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Persona] ADD CONSTRAINT [FK_dbo.Persona_dbo.Localidad_LocalidadId] FOREIGN KEY ([LocalidadId]) REFERENCES [dbo].[Localidad]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Persona] ADD CONSTRAINT [Persona_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Persona_Cliente] ADD CONSTRAINT [FK_dbo.Persona_Cliente_dbo.CondicionIva_CondicionIvaId] FOREIGN KEY ([CondicionIvaId]) REFERENCES [dbo].[CondicionIva]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Persona_Cliente] ADD CONSTRAINT [FK_dbo.Persona_Cliente_dbo.Persona_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Persona]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Persona_Empleado] ADD CONSTRAINT [FK_dbo.Persona_Empleado_dbo.Persona_Id] FOREIGN KEY ([Id]) REFERENCES [dbo].[Persona]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Precio] ADD CONSTRAINT [Precio_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Proveedor] ADD CONSTRAINT [FK_dbo.Proveedor_dbo.CondicionIva_CondicionIvaId] FOREIGN KEY ([CondicionIvaId]) REFERENCES [dbo].[CondicionIva]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Proveedor] ADD CONSTRAINT [FK_dbo.Proveedor_dbo.Localidad_LocalidadId] FOREIGN KEY ([LocalidadId]) REFERENCES [dbo].[Localidad]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Proveedor] ADD CONSTRAINT [Proveedor_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PuestoTrabajo] ADD CONSTRAINT [PuestoTrabajo_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Rubro] ADD CONSTRAINT [Rubro_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Stock] ADD CONSTRAINT [FK_dbo.Stock_dbo.Articulo_ArticuloId] FOREIGN KEY ([ArticuloId]) REFERENCES [dbo].[Articulo]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Stock] ADD CONSTRAINT [FK_dbo.Stock_dbo.Deposito_DepositoId] FOREIGN KEY ([DepositoId]) REFERENCES [dbo].[Deposito]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Stock] ADD CONSTRAINT [Stock_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tarjeta] ADD CONSTRAINT [Tarjeta_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UnidadMedida] ADD CONSTRAINT [UnidadMedida_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [FK_dbo.Usuario_dbo.Persona_Empleado_EmpleadoId] FOREIGN KEY ([EmpleadoId]) REFERENCES [dbo].[Persona_Empleado]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
