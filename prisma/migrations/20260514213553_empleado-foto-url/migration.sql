-- AlterTable: Persona_Empleado.Foto de ByteA a VarChar(8000) nullable
-- Los valores existentes (binarios) se limpian a NULL; a partir de ahora se almacena la URL pública de Supabase Storage.
ALTER TABLE "Persona_Empleado"
  ALTER COLUMN "Foto" DROP NOT NULL,
  ALTER COLUMN "Foto" TYPE VARCHAR(8000) USING NULL;
