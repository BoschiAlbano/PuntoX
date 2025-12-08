-- DropIndex
DROP INDEX "public"."Departamento_Id_key";

-- DropIndex
DROP INDEX "public"."Localidad_Id_key";

-- DropIndex
DROP INDEX "public"."Provincia_Id_key";

-- AlterTable
CREATE SEQUENCE "public".departamento_id_seq;
ALTER TABLE "public"."Departamento" ALTER COLUMN "Id" SET DEFAULT nextval('"public".departamento_id_seq');
ALTER SEQUENCE "public".departamento_id_seq OWNED BY "public"."Departamento"."Id";

-- AlterTable
CREATE SEQUENCE "public".localidad_id_seq;
ALTER TABLE "public"."Localidad" ALTER COLUMN "Id" SET DEFAULT nextval('"public".localidad_id_seq');
ALTER SEQUENCE "public".localidad_id_seq OWNED BY "public"."Localidad"."Id";

-- AlterTable
CREATE SEQUENCE "public".provincia_id_seq;
ALTER TABLE "public"."Provincia" ALTER COLUMN "Id" SET DEFAULT nextval('"public".provincia_id_seq');
ALTER SEQUENCE "public".provincia_id_seq OWNED BY "public"."Provincia"."Id";
