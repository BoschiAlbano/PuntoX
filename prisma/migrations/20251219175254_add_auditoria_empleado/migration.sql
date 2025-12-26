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

    CONSTRAINT "AuditoriaEmpleado_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_TenantId_idx" ON "AuditoriaEmpleado"("TenantId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_Fecha_idx" ON "AuditoriaEmpleado"("Fecha");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_UsuarioId_idx" ON "AuditoriaEmpleado"("UsuarioId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_EmpleadoId_idx" ON "AuditoriaEmpleado"("EmpleadoId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_Accion_idx" ON "AuditoriaEmpleado"("Accion");

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_EmpleadoId_fkey" FOREIGN KEY ("EmpleadoId") REFERENCES "Persona_Empleado"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_UsuarioAfectadoId_fkey" FOREIGN KEY ("UsuarioAfectadoId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;
