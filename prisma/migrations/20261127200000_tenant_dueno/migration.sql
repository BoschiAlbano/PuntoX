-- Dueño del comercio: el usuario que se crea con la tienda. Se distingue de
-- otros usuarios con rol Administrador y nadie más del comercio puede
-- bloquearlo, cambiarle la contraseña ni eliminarlo.

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "UsuarioDuenoId" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_UsuarioDuenoId_key" ON "Tenant"("UsuarioDuenoId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_UsuarioDuenoId_fkey" FOREIGN KEY ("UsuarioDuenoId") REFERENCES "Usuario"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Comercios existentes: el dueño es el primer administrador creado (o el
-- superadmin en el comercio de administración).
UPDATE "Tenant" t
SET "UsuarioDuenoId" = (
  SELECT u."Id"
  FROM "Usuario" u
  JOIN "PerfilUsuario" pu ON pu."Usuario_Id" = u."Id"
  JOIN "Perfiles" pf ON pf."Id" = pu."Perfil_Id"
  WHERE u."TenantId" = t."Id"
    AND u."EstaEliminado" = false
    AND pf."Tipo" IN ('ADMINISTRADOR', 'SUPERADMIN')
  ORDER BY u."Id"
  LIMIT 1
);
