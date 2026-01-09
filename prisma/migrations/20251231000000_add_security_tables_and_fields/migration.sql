-- Agregar campos de seguridad a Configuracion
ALTER TABLE "public"."Configuracion" 
ADD COLUMN IF NOT EXISTS "Forzar2FA" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "ExpirarSesiones30Dias" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "BloquearTrasIntentos" INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS "AlertarNuevoDispositivo" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "BloquearPorInactividad" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "TiempoInactividadMinutos" INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS "RecordarSesion30Dias" BOOLEAN DEFAULT true;

-- Crear tabla SesionActiva
CREATE TABLE IF NOT EXISTS "public"."SesionActiva" (
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

-- Crear tabla DispositivoConfiable
CREATE TABLE IF NOT EXISTS "public"."DispositivoConfiable" (
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

-- Crear tabla IntentoLogin
CREATE TABLE IF NOT EXISTS "public"."IntentoLogin" (
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

-- Crear tabla IpBloqueada
CREATE TABLE IF NOT EXISTS "public"."IpBloqueada" (
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

-- Agregar foreign keys
ALTER TABLE "public"."SesionActiva" ADD CONSTRAINT "SesionActiva_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."SesionActiva" ADD CONSTRAINT "SesionActiva_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."DispositivoConfiable" ADD CONSTRAINT "DispositivoConfiable_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."DispositivoConfiable" ADD CONSTRAINT "DispositivoConfiable_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."IntentoLogin" ADD CONSTRAINT "IntentoLogin_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."IntentoLogin" ADD CONSTRAINT "IntentoLogin_UsuarioId_fkey" FOREIGN KEY ("UsuarioId") REFERENCES "public"."Usuario"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."IpBloqueada" ADD CONSTRAINT "IpBloqueada_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Crear índices
CREATE INDEX IF NOT EXISTS "SesionActiva_TenantId_idx" ON "public"."SesionActiva"("TenantId");
CREATE INDEX IF NOT EXISTS "SesionActiva_UsuarioId_idx" ON "public"."SesionActiva"("UsuarioId");
CREATE INDEX IF NOT EXISTS "SesionActiva_TokenHash_idx" ON "public"."SesionActiva"("TokenHash");
CREATE INDEX IF NOT EXISTS "SesionActiva_EstaActiva_idx" ON "public"."SesionActiva"("EstaActiva");
CREATE INDEX IF NOT EXISTS "SesionActiva_FechaUltimaActividad_idx" ON "public"."SesionActiva"("FechaUltimaActividad");

CREATE UNIQUE INDEX IF NOT EXISTS "DispositivoConfiable_TenantId_UsuarioId_UserAgent_IpAddress_key" ON "public"."DispositivoConfiable"("TenantId", "UsuarioId", "UserAgent", "IpAddress");
CREATE INDEX IF NOT EXISTS "DispositivoConfiable_TenantId_idx" ON "public"."DispositivoConfiable"("TenantId");
CREATE INDEX IF NOT EXISTS "DispositivoConfiable_UsuarioId_idx" ON "public"."DispositivoConfiable"("UsuarioId");
CREATE INDEX IF NOT EXISTS "DispositivoConfiable_EstaActivo_idx" ON "public"."DispositivoConfiable"("EstaActivo");

CREATE INDEX IF NOT EXISTS "IntentoLogin_TenantId_idx" ON "public"."IntentoLogin"("TenantId");
CREATE INDEX IF NOT EXISTS "IntentoLogin_Email_idx" ON "public"."IntentoLogin"("Email");
CREATE INDEX IF NOT EXISTS "IntentoLogin_IpAddress_idx" ON "public"."IntentoLogin"("IpAddress");
CREATE INDEX IF NOT EXISTS "IntentoLogin_FechaIntento_idx" ON "public"."IntentoLogin"("FechaIntento");
CREATE INDEX IF NOT EXISTS "IntentoLogin_Exitoso_idx" ON "public"."IntentoLogin"("Exitoso");

CREATE UNIQUE INDEX IF NOT EXISTS "IpBloqueada_TenantId_IpAddress_key" ON "public"."IpBloqueada"("TenantId", "IpAddress");
CREATE INDEX IF NOT EXISTS "IpBloqueada_TenantId_idx" ON "public"."IpBloqueada"("TenantId");
CREATE INDEX IF NOT EXISTS "IpBloqueada_IpAddress_idx" ON "public"."IpBloqueada"("IpAddress");
CREATE INDEX IF NOT EXISTS "IpBloqueada_EstaActiva_idx" ON "public"."IpBloqueada"("EstaActiva");
CREATE INDEX IF NOT EXISTS "IpBloqueada_FechaBloqueo_idx" ON "public"."IpBloqueada"("FechaBloqueo");

