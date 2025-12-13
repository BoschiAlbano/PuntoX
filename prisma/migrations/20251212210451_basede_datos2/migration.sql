-- CreateEnum
CREATE TYPE "public"."PerfilTipo" AS ENUM ('ADMINISTRADOR', 'EMPLEADO');

-- AlterTable
ALTER TABLE "public"."Departamento" ALTER COLUMN "EstaEliminado" SET DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Localidad" ALTER COLUMN "EstaEliminado" SET DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Perfiles" ADD COLUMN     "Tipo" "public"."PerfilTipo" NOT NULL DEFAULT 'EMPLEADO';

-- AlterTable
ALTER TABLE "public"."Provincia" ALTER COLUMN "EstaEliminado" SET DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Permiso" (
    "Id" BIGSERIAL NOT NULL,
    "Clave" VARCHAR(100) NOT NULL,
    "Descripcion" VARCHAR(250),
    "EstaEliminado" BOOLEAN NOT NULL DEFAULT false,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."PerfilPermiso" (
    "PerfilId" BIGINT NOT NULL,
    "PermisoId" BIGINT NOT NULL,
    "TenantId" BIGINT NOT NULL,

    CONSTRAINT "PerfilPermiso_pkey" PRIMARY KEY ("PerfilId","PermisoId")
);

-- CreateIndex
CREATE INDEX "Permiso_TenantId_idx" ON "public"."Permiso"("TenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_Clave_TenantId_key" ON "public"."Permiso"("Clave", "TenantId");

-- CreateIndex
CREATE INDEX "PerfilPermiso_TenantId_idx" ON "public"."PerfilPermiso"("TenantId");

-- AddForeignKey
ALTER TABLE "public"."Permiso" ADD CONSTRAINT "Permiso_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_PerfilId_fkey" FOREIGN KEY ("PerfilId") REFERENCES "public"."Perfiles"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_PermisoId_fkey" FOREIGN KEY ("PermisoId") REFERENCES "public"."Permiso"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_TenantId_fkey" FOREIGN KEY ("TenantId") REFERENCES "public"."Tenant"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
