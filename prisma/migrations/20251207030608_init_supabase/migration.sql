-- CreateTable
CREATE TABLE "public"."Tenant" (
    "Id" BIGSERIAL NOT NULL,
    "Nombre" VARCHAR(250) NOT NULL,
    "Dominio" VARCHAR(400),
    "RazonSocial" VARCHAR(250),
    "Cuit" VARCHAR(20),
    "Email" VARCHAR(250),
    "Telefono" VARCHAR(25),
    "EstaActivo" BOOLEAN NOT NULL DEFAULT true,
    "PlanId" BIGINT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."PlanSaaS" (
    "Id" BIGSERIAL NOT NULL,
    "Nombre" VARCHAR(200) NOT NULL,
    "Descripcion" VARCHAR(800),
    "CostoMensual" DECIMAL(18,2) NOT NULL,
    "Caracteristicas" VARCHAR(4000),

    CONSTRAINT "PlanSaaS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Log" (
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
CREATE TABLE "public"."Articulo" (
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
    "PrecioCosto" DECIMAL(18,2) NOT NULL,
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
    "TipoVenta" INTEGER NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Articulo_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."BajaArticulo" (
    "Id" BIGSERIAL NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "MotivoBajaId" BIGINT NOT NULL,
    "Cantidad" DECIMAL(18,2) NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "Observacion" VARCHAR(400) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "BajaArticulo_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Banco" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Banco_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Caja" (
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

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Cheque" (
    "Id" BIGSERIAL NOT NULL,
    "ClienteId" BIGINT NOT NULL,
    "BancoId" BIGINT NOT NULL,
    "Numero" VARCHAR(100) NOT NULL,
    "FechaVencimiento" TIMESTAMP(3) NOT NULL,
    "EstaRechazado" BOOLEAN NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Cheque_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Comprobante" (
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

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Comprobante_Compra" (
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
CREATE TABLE "public"."Comprobante_CtaCteProveedor" (
    "Id" BIGINT NOT NULL,
    "ProveedorId" BIGINT NOT NULL,
    "Estado" INTEGER NOT NULL,

    CONSTRAINT "Comprobante_CtaCteProveedor_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Comprobante_CuentaCorriente" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,
    "MovimientoCuentaCorrienteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_CuentaCorriente_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Comprobante_Factura" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,
    "PuestoTrabajoId" BIGINT NOT NULL,
    "Estado" INTEGER NOT NULL,

    CONSTRAINT "Comprobante_Factura_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Comprobante_NotaCredito" (
    "Id" BIGINT NOT NULL,
    "ComprobanteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_NotaCredito_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Comprobante_Presupuesto" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_Presupuesto_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Comprobante_Remito" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "Comprobante_Remito_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."ConceptoGastos" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "ConceptoGastos_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."CondicionIva" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(150) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,

    CONSTRAINT "CondicionIva_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Configuracion" (
    "Id" BIGSERIAL NOT NULL,
    "RazonSocial" VARCHAR(250) NOT NULL,
    "NombreFantasia" VARCHAR(250),
    "Cuit" VARCHAR(13) NOT NULL,
    "Telefono" VARCHAR(25),
    "Celular" VARCHAR(25),
    "Direccion" VARCHAR(400) NOT NULL,
    "Email" VARCHAR(250),
    "LocalidadId" BIGINT NOT NULL,
    "FacturaDescuentaStock" BOOLEAN NOT NULL,
    "PresupuestoDescuentaStock" BOOLEAN NOT NULL,
    "RemitoDescuentaStock" BOOLEAN NOT NULL,
    "ActualizaCostoDesdeCompra" BOOLEAN NOT NULL,
    "ModificaPrecioVentaDesdeCompra" BOOLEAN NOT NULL,
    "DepositoId" BIGINT NOT NULL,
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
    "Foto" BYTEA,
    "ShowFoto" BOOLEAN NOT NULL DEFAULT false,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Contador" (
    "Id" BIGSERIAL NOT NULL,
    "TipoComprobante" INTEGER NOT NULL,
    "Valor" INTEGER NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Contador_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."CuentaBancarias" (
    "Id" BIGSERIAL NOT NULL,
    "BancoId" BIGINT NOT NULL,
    "Numero" VARCHAR(100) NOT NULL,
    "Titular" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "CuentaBancarias_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Departamento" (
    "Id" BIGINT NOT NULL,
    "ProvinciaId" BIGINT NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Deposito" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "Ubicacion" VARCHAR(400),
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Deposito_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."DepositoCheques" (
    "Id" BIGSERIAL NOT NULL,
    "ChequeId" BIGINT NOT NULL,
    "CuentaBancariaId" BIGINT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "DepositoCheques_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."DetalleCaja" (
    "Id" BIGSERIAL NOT NULL,
    "CajaId" BIGINT NOT NULL,
    "TipoPago" INTEGER NOT NULL,
    "Monto" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "DetalleCaja_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."DetalleComprobante" (
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
CREATE TABLE "public"."FormaPago" (
    "Id" BIGSERIAL NOT NULL,
    "ComprobanteId" BIGINT NOT NULL,
    "TipoPago" INTEGER NOT NULL,
    "Monto" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "FormaPago_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."FormaPago_Cheque" (
    "Id" BIGINT NOT NULL,
    "ChequeId" BIGINT NOT NULL,

    CONSTRAINT "FormaPago_Cheque_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."FormaPago_CtaCte" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "FormaPago_CtaCte_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."FormaPago_Tarjeta" (
    "Id" BIGINT NOT NULL,
    "TarjetaId" BIGINT NOT NULL,
    "NumeroTarjeta" VARCHAR(100) NOT NULL,
    "CuponPago" VARCHAR(100) NOT NULL,
    "CantidadCuotas" INTEGER NOT NULL,

    CONSTRAINT "FormaPago_Tarjeta_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."FormularioPerfil" (
    "Formulario_Id" BIGINT NOT NULL,
    "Perfil_Id" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "FormularioPerfil_pkey" PRIMARY KEY ("Formulario_Id","Perfil_Id")
);

-- CreateTable
CREATE TABLE "public"."Formularios" (
    "Id" BIGSERIAL NOT NULL,
    "Codigo" INTEGER NOT NULL,
    "Nombre" VARCHAR(250) NOT NULL,
    "NombreCompleto" VARCHAR(400) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Formularios_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Gasto" (
    "Id" BIGSERIAL NOT NULL,
    "CajaId" BIGINT NOT NULL,
    "ConceptoGastoId" BIGINT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL,
    "Descripcion" VARCHAR(400) NOT NULL,
    "Monto" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Iva" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "Porcentaje" DECIMAL(18,2) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,

    CONSTRAINT "Iva_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Localidad" (
    "Id" BIGINT NOT NULL,
    "DepartamentoId" BIGINT NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,

    CONSTRAINT "Localidad_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Marca" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."MotivoBajas" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "MotivoBajas_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Movimiento" (
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

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Movimiento_CuentaCorriente" (
    "Id" BIGINT NOT NULL,
    "ClienteId" BIGINT NOT NULL,

    CONSTRAINT "Movimiento_CuentaCorriente_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Movimiento_CuentaCorrienteProveedor" (
    "Id" BIGINT NOT NULL,
    "ProveedorId" BIGINT NOT NULL,

    CONSTRAINT "Movimiento_CuentaCorrienteProveedor_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Perfiles" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Perfiles_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."PerfilUsuario" (
    "Perfil_Id" BIGINT NOT NULL,
    "Usuario_Id" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "PerfilUsuario_pkey" PRIMARY KEY ("Perfil_Id","Usuario_Id")
);

-- CreateTable
CREATE TABLE "public"."Persona" (
    "Id" BIGSERIAL NOT NULL,
    "Apellido" VARCHAR(150) NOT NULL,
    "Nombre" VARCHAR(200) NOT NULL,
    "Dni" VARCHAR(8),
    "Direccion" VARCHAR(400) NOT NULL,
    "Telefono" VARCHAR(25),
    "Mail" VARCHAR(250) NOT NULL,
    "LocalidadId" BIGINT NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Persona_Cliente" (
    "Id" BIGINT NOT NULL,
    "CondicionIvaId" BIGINT NOT NULL,
    "ActivarCtaCte" BOOLEAN NOT NULL,
    "TieneLimiteCompra" BOOLEAN NOT NULL,
    "MontoMaximoCtaCte" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "Persona_Cliente_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Persona_Empleado" (
    "Id" BIGINT NOT NULL,
    "Legajo" INTEGER NOT NULL,
    "Foto" BYTEA NOT NULL,

    CONSTRAINT "Persona_Empleado_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Precio" (
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
CREATE TABLE "public"."Proveedor" (
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
CREATE TABLE "public"."Provincia" (
    "Id" BIGINT NOT NULL,
    "Descripcion" VARCHAR(100) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."PuestoTrabajo" (
    "Id" BIGSERIAL NOT NULL,
    "Codigo" INTEGER NOT NULL,
    "Descripcion" VARCHAR(8000),
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "PuestoTrabajo_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Rubro" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Stock" (
    "Id" BIGSERIAL NOT NULL,
    "ArticuloId" BIGINT NOT NULL,
    "DepositoId" BIGINT NOT NULL,
    "Cantidad" DECIMAL(18,3) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Tarjeta" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Tarjeta_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."UnidadMedida" (
    "Id" BIGSERIAL NOT NULL,
    "Descripcion" VARCHAR(250) NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "Id" BIGSERIAL NOT NULL,
    "EmpleadoId" BIGINT NOT NULL,
    "Nombre" VARCHAR(50) NOT NULL,
    "Password" VARCHAR(400) NOT NULL,
    "EstaBloqueado" BOOLEAN NOT NULL,
    "EstaEliminado" BOOLEAN NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_Dominio_key" ON "public"."Tenant"("Dominio");

-- CreateIndex
CREATE INDEX "Tenant_PlanId_idx" ON "public"."Tenant"("PlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanSaaS_Nombre_key" ON "public"."PlanSaaS"("Nombre");

-- CreateIndex
CREATE INDEX "Log_TenantId_idx" ON "public"."Log"("TenantId");

-- CreateIndex
CREATE INDEX "Log_Fecha_idx" ON "public"."Log"("Fecha");

-- CreateIndex
CREATE INDEX "Articulo_TenantId_idx" ON "public"."Articulo"("TenantId");

-- CreateIndex
CREATE INDEX "Articulo_IvaId_idx" ON "public"."Articulo"("IvaId");

-- CreateIndex
CREATE INDEX "Articulo_MarcaId_idx" ON "public"."Articulo"("MarcaId");

-- CreateIndex
CREATE INDEX "Articulo_PrecioId_idx" ON "public"."Articulo"("PrecioId");

-- CreateIndex
CREATE INDEX "Articulo_RubroId_idx" ON "public"."Articulo"("RubroId");

-- CreateIndex
CREATE INDEX "Articulo_UnidadMedidaId_idx" ON "public"."Articulo"("UnidadMedidaId");

-- CreateIndex
CREATE INDEX "BajaArticulo_TenantId_idx" ON "public"."BajaArticulo"("TenantId");

-- CreateIndex
CREATE INDEX "BajaArticulo_ArticuloId_idx" ON "public"."BajaArticulo"("ArticuloId");

-- CreateIndex
CREATE INDEX "BajaArticulo_MotivoBajaId_idx" ON "public"."BajaArticulo"("MotivoBajaId");

-- CreateIndex
CREATE INDEX "Banco_TenantId_idx" ON "public"."Banco"("TenantId");

-- CreateIndex
CREATE INDEX "Caja_TenantId_idx" ON "public"."Caja"("TenantId");

-- CreateIndex
CREATE INDEX "Caja_UsuarioAperturaId_idx" ON "public"."Caja"("UsuarioAperturaId");

-- CreateIndex
CREATE INDEX "Caja_UsuarioCierreId_idx" ON "public"."Caja"("UsuarioCierreId");

-- CreateIndex
CREATE INDEX "Cheque_TenantId_idx" ON "public"."Cheque"("TenantId");

-- CreateIndex
CREATE INDEX "Cheque_BancoId_idx" ON "public"."Cheque"("BancoId");

-- CreateIndex
CREATE INDEX "Cheque_ClienteId_idx" ON "public"."Cheque"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_TenantId_idx" ON "public"."Comprobante"("TenantId");

-- CreateIndex
CREATE INDEX "Comprobante_EmpleadoId_idx" ON "public"."Comprobante"("EmpleadoId");

-- CreateIndex
CREATE INDEX "Comprobante_UsuarioId_idx" ON "public"."Comprobante"("UsuarioId");

-- CreateIndex
CREATE INDEX "Comprobante_Compra_Id_idx" ON "public"."Comprobante_Compra"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_Compra_ProveedorId_idx" ON "public"."Comprobante_Compra"("ProveedorId");

-- CreateIndex
CREATE INDEX "Comprobante_CtaCteProveedor_Id_idx" ON "public"."Comprobante_CtaCteProveedor"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_CtaCteProveedor_ProveedorId_idx" ON "public"."Comprobante_CtaCteProveedor"("ProveedorId");

-- CreateIndex
CREATE INDEX "Comprobante_CuentaCorriente_ClienteId_idx" ON "public"."Comprobante_CuentaCorriente"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_CuentaCorriente_Id_idx" ON "public"."Comprobante_CuentaCorriente"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_CuentaCorriente_MovimientoCuentaCorrienteId_idx" ON "public"."Comprobante_CuentaCorriente"("MovimientoCuentaCorrienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Factura_ClienteId_idx" ON "public"."Comprobante_Factura"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Factura_Id_idx" ON "public"."Comprobante_Factura"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_Factura_PuestoTrabajoId_idx" ON "public"."Comprobante_Factura"("PuestoTrabajoId");

-- CreateIndex
CREATE INDEX "Comprobante_NotaCredito_ComprobanteId_idx" ON "public"."Comprobante_NotaCredito"("ComprobanteId");

-- CreateIndex
CREATE INDEX "Comprobante_NotaCredito_Id_idx" ON "public"."Comprobante_NotaCredito"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_Presupuesto_ClienteId_idx" ON "public"."Comprobante_Presupuesto"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Presupuesto_Id_idx" ON "public"."Comprobante_Presupuesto"("Id");

-- CreateIndex
CREATE INDEX "Comprobante_Remito_ClienteId_idx" ON "public"."Comprobante_Remito"("ClienteId");

-- CreateIndex
CREATE INDEX "Comprobante_Remito_Id_idx" ON "public"."Comprobante_Remito"("Id");

-- CreateIndex
CREATE INDEX "ConceptoGastos_TenantId_idx" ON "public"."ConceptoGastos"("TenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CondicionIva_Descripcion_key" ON "public"."CondicionIva"("Descripcion");

-- CreateIndex
CREATE INDEX "Configuracion_TenantId_idx" ON "public"."Configuracion"("TenantId");

-- CreateIndex
CREATE INDEX "Configuracion_DepositoId_idx" ON "public"."Configuracion"("DepositoId");

-- CreateIndex
CREATE INDEX "Configuracion_LocalidadId_idx" ON "public"."Configuracion"("LocalidadId");

-- CreateIndex
CREATE INDEX "Contador_TenantId_idx" ON "public"."Contador"("TenantId");

-- CreateIndex
CREATE INDEX "CuentaBancarias_TenantId_idx" ON "public"."CuentaBancarias"("TenantId");

-- CreateIndex
CREATE INDEX "CuentaBancarias_BancoId_idx" ON "public"."CuentaBancarias"("BancoId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_Id_key" ON "public"."Departamento"("Id");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_ProvinciaId_Descripcion_key" ON "public"."Departamento"("ProvinciaId", "Descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "Deposito_Descripcion_key" ON "public"."Deposito"("Descripcion");

-- CreateIndex
CREATE INDEX "Deposito_TenantId_idx" ON "public"."Deposito"("TenantId");

-- CreateIndex
CREATE INDEX "DepositoCheques_TenantId_idx" ON "public"."DepositoCheques"("TenantId");

-- CreateIndex
CREATE INDEX "DepositoCheques_ChequeId_idx" ON "public"."DepositoCheques"("ChequeId");

-- CreateIndex
CREATE INDEX "DepositoCheques_CuentaBancariaId_idx" ON "public"."DepositoCheques"("CuentaBancariaId");

-- CreateIndex
CREATE INDEX "DetalleCaja_TenantId_idx" ON "public"."DetalleCaja"("TenantId");

-- CreateIndex
CREATE INDEX "DetalleCaja_CajaId_idx" ON "public"."DetalleCaja"("CajaId");

-- CreateIndex
CREATE INDEX "DetalleComprobante_TenantId_idx" ON "public"."DetalleComprobante"("TenantId");

-- CreateIndex
CREATE INDEX "DetalleComprobante_ArticuloId_idx" ON "public"."DetalleComprobante"("ArticuloId");

-- CreateIndex
CREATE INDEX "DetalleComprobante_ComprobanteId_idx" ON "public"."DetalleComprobante"("ComprobanteId");

-- CreateIndex
CREATE INDEX "FormaPago_TenantId_idx" ON "public"."FormaPago"("TenantId");

-- CreateIndex
CREATE INDEX "FormaPago_ComprobanteId_idx" ON "public"."FormaPago"("ComprobanteId");

-- CreateIndex
CREATE INDEX "FormaPago_Cheque_ChequeId_idx" ON "public"."FormaPago_Cheque"("ChequeId");

-- CreateIndex
CREATE INDEX "FormaPago_Cheque_Id_idx" ON "public"."FormaPago_Cheque"("Id");

-- CreateIndex
CREATE INDEX "FormaPago_CtaCte_ClienteId_idx" ON "public"."FormaPago_CtaCte"("ClienteId");

-- CreateIndex
CREATE INDEX "FormaPago_CtaCte_Id_idx" ON "public"."FormaPago_CtaCte"("Id");

-- CreateIndex
CREATE INDEX "FormaPago_Tarjeta_Id_idx" ON "public"."FormaPago_Tarjeta"("Id");

-- CreateIndex
CREATE INDEX "FormaPago_Tarjeta_TarjetaId_idx" ON "public"."FormaPago_Tarjeta"("TarjetaId");

-- CreateIndex
CREATE INDEX "FormularioPerfil_TenantId_idx" ON "public"."FormularioPerfil"("TenantId");

-- CreateIndex
CREATE INDEX "FormularioPerfil_Formulario_Id_idx" ON "public"."FormularioPerfil"("Formulario_Id");

-- CreateIndex
CREATE INDEX "FormularioPerfil_Perfil_Id_idx" ON "public"."FormularioPerfil"("Perfil_Id");

-- CreateIndex
CREATE INDEX "Formularios_TenantId_idx" ON "public"."Formularios"("TenantId");

-- CreateIndex
CREATE INDEX "Gasto_TenantId_idx" ON "public"."Gasto"("TenantId");

-- CreateIndex
CREATE INDEX "Gasto_CajaId_idx" ON "public"."Gasto"("CajaId");

-- CreateIndex
CREATE INDEX "Gasto_ConceptoGastoId_idx" ON "public"."Gasto"("ConceptoGastoId");

-- CreateIndex
CREATE UNIQUE INDEX "Localidad_Id_key" ON "public"."Localidad"("Id");

-- CreateIndex
CREATE INDEX "Marca_TenantId_idx" ON "public"."Marca"("TenantId");

-- CreateIndex
CREATE INDEX "MotivoBajas_TenantId_idx" ON "public"."MotivoBajas"("TenantId");

-- CreateIndex
CREATE INDEX "Movimiento_TenantId_idx" ON "public"."Movimiento"("TenantId");

-- CreateIndex
CREATE INDEX "Movimiento_CajaId_idx" ON "public"."Movimiento"("CajaId");

-- CreateIndex
CREATE INDEX "Movimiento_ComprobanteId_idx" ON "public"."Movimiento"("ComprobanteId");

-- CreateIndex
CREATE INDEX "Movimiento_UsuarioId_idx" ON "public"."Movimiento"("UsuarioId");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorriente_ClienteId_idx" ON "public"."Movimiento_CuentaCorriente"("ClienteId");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorriente_Id_idx" ON "public"."Movimiento_CuentaCorriente"("Id");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorrienteProveedor_Id_idx" ON "public"."Movimiento_CuentaCorrienteProveedor"("Id");

-- CreateIndex
CREATE INDEX "Movimiento_CuentaCorrienteProveedor_ProveedorId_idx" ON "public"."Movimiento_CuentaCorrienteProveedor"("ProveedorId");

-- CreateIndex
CREATE INDEX "Perfiles_TenantId_idx" ON "public"."Perfiles"("TenantId");

-- CreateIndex
CREATE INDEX "PerfilUsuario_TenantId_idx" ON "public"."PerfilUsuario"("TenantId");

-- CreateIndex
CREATE INDEX "PerfilUsuario_Perfil_Id_idx" ON "public"."PerfilUsuario"("Perfil_Id");

-- CreateIndex
CREATE INDEX "PerfilUsuario_Usuario_Id_idx" ON "public"."PerfilUsuario"("Usuario_Id");

-- CreateIndex
CREATE INDEX "Persona_TenantId_idx" ON "public"."Persona"("TenantId");

-- CreateIndex
CREATE INDEX "Persona_LocalidadId_idx" ON "public"."Persona"("LocalidadId");

-- CreateIndex
CREATE INDEX "Persona_Cliente_CondicionIvaId_idx" ON "public"."Persona_Cliente"("CondicionIvaId");

-- CreateIndex
CREATE INDEX "Persona_Cliente_Id_idx" ON "public"."Persona_Cliente"("Id");

-- CreateIndex
CREATE INDEX "Persona_Empleado_Id_idx" ON "public"."Persona_Empleado"("Id");

-- CreateIndex
CREATE INDEX "Precio_TenantId_idx" ON "public"."Precio"("TenantId");

-- CreateIndex
CREATE INDEX "Proveedor_TenantId_idx" ON "public"."Proveedor"("TenantId");

-- CreateIndex
CREATE INDEX "Proveedor_CondicionIvaId_idx" ON "public"."Proveedor"("CondicionIvaId");

-- CreateIndex
CREATE INDEX "Proveedor_LocalidadId_idx" ON "public"."Proveedor"("LocalidadId");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_Id_key" ON "public"."Provincia"("Id");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_Descripcion_key" ON "public"."Provincia"("Descripcion");

-- CreateIndex
CREATE INDEX "PuestoTrabajo_TenantId_idx" ON "public"."PuestoTrabajo"("TenantId");

-- CreateIndex
CREATE INDEX "Rubro_TenantId_idx" ON "public"."Rubro"("TenantId");

-- CreateIndex
CREATE INDEX "Stock_TenantId_idx" ON "public"."Stock"("TenantId");

-- CreateIndex
CREATE INDEX "Stock_ArticuloId_idx" ON "public"."Stock"("ArticuloId");

-- CreateIndex
CREATE INDEX "Stock_DepositoId_idx" ON "public"."Stock"("DepositoId");

-- CreateIndex
CREATE INDEX "Tarjeta_TenantId_idx" ON "public"."Tarjeta"("TenantId");

-- CreateIndex
CREATE INDEX "UnidadMedida_TenantId_idx" ON "public"."UnidadMedida"("TenantId");

-- CreateIndex
CREATE INDEX "Usuario_TenantId_idx" ON "public"."Usuario"("TenantId");

-- CreateIndex
CREATE INDEX "Usuario_EmpleadoId_idx" ON "public"."Usuario"("EmpleadoId");

-- AddForeignKey
ALTER TABLE "public"."Tenant" ADD CONSTRAINT "Tenant_PlanId_fkey" FOREIGN KEY ("PlanId") REFERENCES "public"."PlanSaaS"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Articulo" ADD CONSTRAINT "Articulo_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Articulo" ADD CONSTRAINT "Articulo_IvaId_fkey" FOREIGN KEY ("IvaId") REFERENCES "public"."Iva"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Articulo" ADD CONSTRAINT "Articulo_MarcaId_fkey" FOREIGN KEY ("MarcaId") REFERENCES "public"."Marca"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Articulo" ADD CONSTRAINT "Articulo_PrecioId_fkey" FOREIGN KEY ("PrecioId") REFERENCES "public"."Precio"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Articulo" ADD CONSTRAINT "Articulo_RubroId_fkey" FOREIGN KEY ("RubroId") REFERENCES "public"."Rubro"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Articulo" ADD CONSTRAINT "Articulo_UnidadMedidaId_fkey" FOREIGN KEY ("UnidadMedidaId") REFERENCES "public"."UnidadMedida"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."BajaArticulo" ADD CONSTRAINT "BajaArticulo_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BajaArticulo" ADD CONSTRAINT "BajaArticulo_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "public"."Articulo"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."BajaArticulo" ADD CONSTRAINT "BajaArticulo_MotivoBajaId_fkey" FOREIGN KEY ("MotivoBajaId") REFERENCES "public"."MotivoBajas"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Banco" ADD CONSTRAINT "Banco_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Caja" ADD CONSTRAINT "Caja_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Caja" ADD CONSTRAINT "Caja_UsuarioAperturaId_fkey" FOREIGN KEY ("UsuarioAperturaId") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Caja" ADD CONSTRAINT "Caja_UsuarioCierreId_fkey" FOREIGN KEY ("UsuarioCierreId") REFERENCES "public"."Usuario"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Cheque" ADD CONSTRAINT "Cheque_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cheque" ADD CONSTRAINT "Cheque_BancoId_fkey" FOREIGN KEY ("BancoId") REFERENCES "public"."Banco"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Cheque" ADD CONSTRAINT "Cheque_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "public"."Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_EmpleadoId_fkey" FOREIGN KEY ("EmpleadoId") REFERENCES "public"."Persona_Empleado"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante" ADD CONSTRAINT "Comprobante_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Compra" ADD CONSTRAINT "Comprobante_Compra_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Compra" ADD CONSTRAINT "Comprobante_Compra_ProveedorId_fkey" FOREIGN KEY ("ProveedorId") REFERENCES "public"."Proveedor"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_CtaCteProveedor" ADD CONSTRAINT "Comprobante_CtaCteProveedor_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_CtaCteProveedor" ADD CONSTRAINT "Comprobante_CtaCteProveedor_ProveedorId_fkey" FOREIGN KEY ("ProveedorId") REFERENCES "public"."Proveedor"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_CuentaCorriente" ADD CONSTRAINT "Comprobante_CuentaCorriente_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_CuentaCorriente" ADD CONSTRAINT "Comprobante_CuentaCorriente_MovimientoCuentaCorrienteId_fkey" FOREIGN KEY ("MovimientoCuentaCorrienteId") REFERENCES "public"."Movimiento_CuentaCorriente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_CuentaCorriente" ADD CONSTRAINT "Comprobante_CuentaCorriente_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "public"."Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Factura" ADD CONSTRAINT "Comprobante_Factura_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Factura" ADD CONSTRAINT "Comprobante_Factura_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "public"."Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Factura" ADD CONSTRAINT "Comprobante_Factura_PuestoTrabajoId_fkey" FOREIGN KEY ("PuestoTrabajoId") REFERENCES "public"."PuestoTrabajo"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_NotaCredito" ADD CONSTRAINT "Comprobante_NotaCredito_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_NotaCredito" ADD CONSTRAINT "Comprobante_NotaCredito_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Presupuesto" ADD CONSTRAINT "Comprobante_Presupuesto_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Presupuesto" ADD CONSTRAINT "Comprobante_Presupuesto_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "public"."Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Remito" ADD CONSTRAINT "Comprobante_Remito_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Comprobante_Remito" ADD CONSTRAINT "Comprobante_Remito_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "public"."Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ConceptoGastos" ADD CONSTRAINT "ConceptoGastos_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Configuracion" ADD CONSTRAINT "Configuracion_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Configuracion" ADD CONSTRAINT "Configuracion_DepositoId_fkey" FOREIGN KEY ("DepositoId") REFERENCES "public"."Deposito"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Configuracion" ADD CONSTRAINT "Configuracion_LocalidadId_fkey" FOREIGN KEY ("LocalidadId") REFERENCES "public"."Localidad"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Contador" ADD CONSTRAINT "Contador_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CuentaBancarias" ADD CONSTRAINT "CuentaBancarias_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CuentaBancarias" ADD CONSTRAINT "CuentaBancarias_BancoId_fkey" FOREIGN KEY ("BancoId") REFERENCES "public"."Banco"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Departamento" ADD CONSTRAINT "Departamento_ProvinciaId_fkey" FOREIGN KEY ("ProvinciaId") REFERENCES "public"."Provincia"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Deposito" ADD CONSTRAINT "Deposito_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepositoCheques" ADD CONSTRAINT "DepositoCheques_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepositoCheques" ADD CONSTRAINT "DepositoCheques_ChequeId_fkey" FOREIGN KEY ("ChequeId") REFERENCES "public"."Cheque"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."DepositoCheques" ADD CONSTRAINT "DepositoCheques_CuentaBancariaId_fkey" FOREIGN KEY ("CuentaBancariaId") REFERENCES "public"."CuentaBancarias"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."DetalleCaja" ADD CONSTRAINT "DetalleCaja_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleCaja" ADD CONSTRAINT "DetalleCaja_CajaId_fkey" FOREIGN KEY ("CajaId") REFERENCES "public"."Caja"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "public"."Articulo"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."DetalleComprobante" ADD CONSTRAINT "DetalleComprobante_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormaPago" ADD CONSTRAINT "FormaPago_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormaPago" ADD CONSTRAINT "FormaPago_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormaPago_Cheque" ADD CONSTRAINT "FormaPago_Cheque_ChequeId_fkey" FOREIGN KEY ("ChequeId") REFERENCES "public"."Cheque"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormaPago_Cheque" ADD CONSTRAINT "FormaPago_Cheque_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."FormaPago"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormaPago_CtaCte" ADD CONSTRAINT "FormaPago_CtaCte_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."FormaPago"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormaPago_CtaCte" ADD CONSTRAINT "FormaPago_CtaCte_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "public"."Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormaPago_Tarjeta" ADD CONSTRAINT "FormaPago_Tarjeta_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."FormaPago"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormaPago_Tarjeta" ADD CONSTRAINT "FormaPago_Tarjeta_TarjetaId_fkey" FOREIGN KEY ("TarjetaId") REFERENCES "public"."Tarjeta"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormularioPerfil" ADD CONSTRAINT "FormularioPerfil_Formulario_Id_fkey" FOREIGN KEY ("Formulario_Id") REFERENCES "public"."Formularios"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormularioPerfil" ADD CONSTRAINT "FormularioPerfil_Perfil_Id_fkey" FOREIGN KEY ("Perfil_Id") REFERENCES "public"."Perfiles"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."FormularioPerfil" ADD CONSTRAINT "FormularioPerfil_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Formularios" ADD CONSTRAINT "Formularios_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Gasto" ADD CONSTRAINT "Gasto_CajaId_fkey" FOREIGN KEY ("CajaId") REFERENCES "public"."Caja"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Gasto" ADD CONSTRAINT "Gasto_ConceptoGastoId_fkey" FOREIGN KEY ("ConceptoGastoId") REFERENCES "public"."ConceptoGastos"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Gasto" ADD CONSTRAINT "Gasto_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Localidad" ADD CONSTRAINT "Localidad_DepartamentoId_fkey" FOREIGN KEY ("DepartamentoId") REFERENCES "public"."Departamento"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Marca" ADD CONSTRAINT "Marca_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MotivoBajas" ADD CONSTRAINT "MotivoBajas_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movimiento" ADD CONSTRAINT "Movimiento_CajaId_fkey" FOREIGN KEY ("CajaId") REFERENCES "public"."Caja"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Movimiento" ADD CONSTRAINT "Movimiento_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "public"."Comprobante"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Movimiento" ADD CONSTRAINT "Movimiento_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Movimiento" ADD CONSTRAINT "Movimiento_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movimiento_CuentaCorriente" ADD CONSTRAINT "Movimiento_CuentaCorriente_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Movimiento"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Movimiento_CuentaCorriente" ADD CONSTRAINT "Movimiento_CuentaCorriente_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "public"."Persona_Cliente"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Movimiento_CuentaCorrienteProveedor" ADD CONSTRAINT "Movimiento_CuentaCorrienteProveedor_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Movimiento"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Movimiento_CuentaCorrienteProveedor" ADD CONSTRAINT "Movimiento_CuentaCorrienteProveedor_ProveedorId_fkey" FOREIGN KEY ("ProveedorId") REFERENCES "public"."Proveedor"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Perfiles" ADD CONSTRAINT "Perfiles_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_Perfil_Id_fkey" FOREIGN KEY ("Perfil_Id") REFERENCES "public"."Perfiles"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_Usuario_Id_fkey" FOREIGN KEY ("Usuario_Id") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Persona" ADD CONSTRAINT "Persona_LocalidadId_fkey" FOREIGN KEY ("LocalidadId") REFERENCES "public"."Localidad"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Persona" ADD CONSTRAINT "Persona_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Persona_Cliente" ADD CONSTRAINT "Persona_Cliente_CondicionIvaId_fkey" FOREIGN KEY ("CondicionIvaId") REFERENCES "public"."CondicionIva"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Persona_Cliente" ADD CONSTRAINT "Persona_Cliente_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Persona"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Persona_Empleado" ADD CONSTRAINT "Persona_Empleado_Id_fkey" FOREIGN KEY ("Id") REFERENCES "public"."Persona"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Precio" ADD CONSTRAINT "Precio_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proveedor" ADD CONSTRAINT "Proveedor_CondicionIvaId_fkey" FOREIGN KEY ("CondicionIvaId") REFERENCES "public"."CondicionIva"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Proveedor" ADD CONSTRAINT "Proveedor_LocalidadId_fkey" FOREIGN KEY ("LocalidadId") REFERENCES "public"."Localidad"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Proveedor" ADD CONSTRAINT "Proveedor_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PuestoTrabajo" ADD CONSTRAINT "PuestoTrabajo_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rubro" ADD CONSTRAINT "Rubro_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stock" ADD CONSTRAINT "Stock_ArticuloId_fkey" FOREIGN KEY ("ArticuloId") REFERENCES "public"."Articulo"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Stock" ADD CONSTRAINT "Stock_DepositoId_fkey" FOREIGN KEY ("DepositoId") REFERENCES "public"."Deposito"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Stock" ADD CONSTRAINT "Stock_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarjeta" ADD CONSTRAINT "Tarjeta_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UnidadMedida" ADD CONSTRAINT "UnidadMedida_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_EmpleadoId_fkey" FOREIGN KEY ("EmpleadoId") REFERENCES "public"."Persona_Empleado"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
