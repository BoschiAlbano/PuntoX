-- CreateTable
CREATE TABLE "Notificacion" (
    "Id" BIGSERIAL NOT NULL,
    "TenantId" BIGINT NOT NULL,
    "UsuarioId" BIGINT,
    "Tipo" VARCHAR(50) NOT NULL,
    "Titulo" VARCHAR(200) NOT NULL,
    "Mensaje" VARCHAR(500) NOT NULL,
    "Leida" BOOLEAN NOT NULL DEFAULT false,
    "AccionUrl" VARCHAR(500),
    "Fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "EntidadTipo" VARCHAR(100),
    "EntidadId" VARCHAR(100),

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "Notificacion_TenantId_UsuarioId_Leida_idx" ON "Notificacion"("TenantId", "UsuarioId", "Leida");

-- CreateIndex
CREATE INDEX "Notificacion_EntidadTipo_EntidadId_Leida_idx" ON "Notificacion"("EntidadTipo", "EntidadId", "Leida");

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
