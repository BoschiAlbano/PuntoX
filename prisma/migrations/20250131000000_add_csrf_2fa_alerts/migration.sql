-- CreateTable
CREATE TABLE "public"."TokenCsrf" (
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
CREATE TABLE "public"."Codigo2FA" (
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
CREATE TABLE "public"."AlertaSeguridad" (
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
CREATE UNIQUE INDEX "TokenCsrf_Token_key" ON "public"."TokenCsrf"("Token");

-- CreateIndex
CREATE INDEX "TokenCsrf_TenantId_idx" ON "public"."TokenCsrf"("TenantId");

-- CreateIndex
CREATE INDEX "TokenCsrf_Token_idx" ON "public"."TokenCsrf"("Token");

-- CreateIndex
CREATE INDEX "TokenCsrf_FechaExpiracion_idx" ON "public"."TokenCsrf"("FechaExpiracion");

-- CreateIndex
CREATE INDEX "TokenCsrf_UsuarioId_idx" ON "public"."TokenCsrf"("UsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Codigo2FA_TenantId_UsuarioId_key" ON "public"."Codigo2FA"("TenantId", "UsuarioId");

-- CreateIndex
CREATE INDEX "Codigo2FA_TenantId_idx" ON "public"."Codigo2FA"("TenantId");

-- CreateIndex
CREATE INDEX "Codigo2FA_UsuarioId_idx" ON "public"."Codigo2FA"("UsuarioId");

-- CreateIndex
CREATE INDEX "Codigo2FA_EstaActivo_idx" ON "public"."Codigo2FA"("EstaActivo");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_TenantId_idx" ON "public"."AlertaSeguridad"("TenantId");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_UsuarioId_idx" ON "public"."AlertaSeguridad"("UsuarioId");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_Tipo_idx" ON "public"."AlertaSeguridad"("Tipo");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_Severidad_idx" ON "public"."AlertaSeguridad"("Severidad");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_FechaCreacion_idx" ON "public"."AlertaSeguridad"("FechaCreacion");

-- CreateIndex
CREATE INDEX "AlertaSeguridad_EstaResuelta_idx" ON "public"."AlertaSeguridad"("EstaResuelta");

-- AddForeignKey
ALTER TABLE "public"."TokenCsrf" ADD CONSTRAINT "TokenCsrf_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenCsrf" ADD CONSTRAINT "TokenCsrf_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Codigo2FA" ADD CONSTRAINT "Codigo2FA_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Codigo2FA" ADD CONSTRAINT "Codigo2FA_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlertaSeguridad" ADD CONSTRAINT "AlertaSeguridad_ResueltoPor_fkey" FOREIGN KEY ("ResueltoPor") REFERENCES "public"."Usuario"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

