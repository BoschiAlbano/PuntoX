-- AlterTable
ALTER TABLE "public"."Configuracion" ADD COLUMN "Moneda" VARCHAR(10) DEFAULT 'ARS',
ADD COLUMN "ZonaHoraria" VARCHAR(100) DEFAULT 'America/Argentina/Buenos_Aires',
ADD COLUMN "Idioma" VARCHAR(10) DEFAULT 'es-AR',
ADD COLUMN "CondicionIvaId" BIGINT,
ADD COLUMN "PuntoVenta" VARCHAR(10),
ADD COLUMN "InicioActividades" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Configuracion_CondicionIvaId_idx" ON "public"."Configuracion"("CondicionIvaId");

-- AddForeignKey
ALTER TABLE "public"."Configuracion" ADD CONSTRAINT "Configuracion_CondicionIvaId_fkey" FOREIGN KEY ("CondicionIvaId") REFERENCES "public"."CondicionIva"("Id") ON UPDATE NO ACTION ON DELETE NO ACTION;

