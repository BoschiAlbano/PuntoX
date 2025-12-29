-- AlterTable
ALTER TABLE "Configuracion" ADD COLUMN "NotificacionesPush" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Configuracion" ADD COLUMN "NotificacionesResumenDiario" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Configuracion" ADD COLUMN "NotificacionesStockBajo" BOOLEAN NOT NULL DEFAULT true;

