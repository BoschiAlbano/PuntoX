/*
  Warnings:

  - Added the required column `TenantId` to the `Articulo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `BajaArticulo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Banco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Caja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Cheque` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Comprobante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `ConceptoGastos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Configuracion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Contador` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `CuentaBancarias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Deposito` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `DepositoCheques` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `DetalleCaja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `DetalleComprobante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `FormaPago` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `FormularioPerfil` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Formularios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Gasto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Marca` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `MotivoBajas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Movimiento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Perfiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `PerfilUsuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Persona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Precio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Proveedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `PuestoTrabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Rubro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Tarjeta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `UnidadMedida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `TenantId` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Articulo] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[BajaArticulo] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Banco] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Caja] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Cheque] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Comprobante] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[ConceptoGastos] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Configuracion] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Contador] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[CuentaBancarias] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Deposito] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[DepositoCheques] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[DetalleCaja] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[DetalleComprobante] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[FormaPago] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[FormularioPerfil] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Formularios] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Gasto] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Marca] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[MotivoBajas] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Movimiento] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Perfiles] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[PerfilUsuario] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Persona] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Precio] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Proveedor] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[PuestoTrabajo] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Rubro] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Stock] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Tarjeta] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[UnidadMedida] ADD [TenantId] BIGINT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Usuario] ADD [TenantId] BIGINT NOT NULL;

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

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Tenant_PlanId] ON [dbo].[Tenant]([PlanId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Log_TenantId_idx] ON [dbo].[Log]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Log_Fecha_idx] ON [dbo].[Log]([Fecha]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Articulo_TenantId_idx] ON [dbo].[Articulo]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BajaArticulo_TenantId_idx] ON [dbo].[BajaArticulo]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Banco_TenantId_idx] ON [dbo].[Banco]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Caja_TenantId_idx] ON [dbo].[Caja]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Cheque_TenantId_idx] ON [dbo].[Cheque]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Comprobante_TenantId_idx] ON [dbo].[Comprobante]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ConceptoGastos_TenantId_idx] ON [dbo].[ConceptoGastos]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Configuracion_TenantId_idx] ON [dbo].[Configuracion]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contador_TenantId_idx] ON [dbo].[Contador]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CuentaBancarias_TenantId_idx] ON [dbo].[CuentaBancarias]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Deposito_TenantId_idx] ON [dbo].[Deposito]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DepositoCheques_TenantId_idx] ON [dbo].[DepositoCheques]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DetalleCaja_TenantId_idx] ON [dbo].[DetalleCaja]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DetalleComprobante_TenantId_idx] ON [dbo].[DetalleComprobante]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FormaPago_TenantId_idx] ON [dbo].[FormaPago]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FormularioPerfil_TenantId_idx] ON [dbo].[FormularioPerfil]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Formularios_TenantId_idx] ON [dbo].[Formularios]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Gasto_TenantId_idx] ON [dbo].[Gasto]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Marca_TenantId_idx] ON [dbo].[Marca]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MotivoBajas_TenantId_idx] ON [dbo].[MotivoBajas]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Movimiento_TenantId_idx] ON [dbo].[Movimiento]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Perfiles_TenantId_idx] ON [dbo].[Perfiles]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PerfilUsuario_TenantId_idx] ON [dbo].[PerfilUsuario]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Persona_TenantId_idx] ON [dbo].[Persona]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Precio_TenantId_idx] ON [dbo].[Precio]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Proveedor_TenantId_idx] ON [dbo].[Proveedor]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PuestoTrabajo_TenantId_idx] ON [dbo].[PuestoTrabajo]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Rubro_TenantId_idx] ON [dbo].[Rubro]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Stock_TenantId_idx] ON [dbo].[Stock]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Tarjeta_TenantId_idx] ON [dbo].[Tarjeta]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UnidadMedida_TenantId_idx] ON [dbo].[UnidadMedida]([TenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Usuario_TenantId_idx] ON [dbo].[Usuario]([TenantId]);

-- AddForeignKey
ALTER TABLE [dbo].[Tenant] ADD CONSTRAINT [Tenant_PlanId_fkey] FOREIGN KEY ([PlanId]) REFERENCES [dbo].[PlanSaaS]([Id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Log] ADD CONSTRAINT [Log_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Articulo] ADD CONSTRAINT [Articulo_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BajaArticulo] ADD CONSTRAINT [BajaArticulo_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Banco] ADD CONSTRAINT [Banco_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Caja] ADD CONSTRAINT [Caja_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Cheque] ADD CONSTRAINT [Cheque_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Comprobante] ADD CONSTRAINT [Comprobante_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ConceptoGastos] ADD CONSTRAINT [ConceptoGastos_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Configuracion] ADD CONSTRAINT [Configuracion_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Contador] ADD CONSTRAINT [Contador_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CuentaBancarias] ADD CONSTRAINT [CuentaBancarias_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Deposito] ADD CONSTRAINT [Deposito_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DepositoCheques] ADD CONSTRAINT [DepositoCheques_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DetalleCaja] ADD CONSTRAINT [DetalleCaja_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DetalleComprobante] ADD CONSTRAINT [DetalleComprobante_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[FormaPago] ADD CONSTRAINT [FormaPago_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[FormularioPerfil] ADD CONSTRAINT [FormularioPerfil_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Formularios] ADD CONSTRAINT [Formularios_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gasto] ADD CONSTRAINT [Gasto_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Marca] ADD CONSTRAINT [Marca_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MotivoBajas] ADD CONSTRAINT [MotivoBajas_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Movimiento] ADD CONSTRAINT [Movimiento_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Perfiles] ADD CONSTRAINT [Perfiles_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PerfilUsuario] ADD CONSTRAINT [PerfilUsuario_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Persona] ADD CONSTRAINT [Persona_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Precio] ADD CONSTRAINT [Precio_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Proveedor] ADD CONSTRAINT [Proveedor_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PuestoTrabajo] ADD CONSTRAINT [PuestoTrabajo_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Rubro] ADD CONSTRAINT [Rubro_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Stock] ADD CONSTRAINT [Stock_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tarjeta] ADD CONSTRAINT [Tarjeta_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UnidadMedida] ADD CONSTRAINT [UnidadMedida_TenantId_fkey] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenant]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

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
