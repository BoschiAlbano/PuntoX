-- AlterTable
ALTER TABLE "AuditoriaEmpleado" ADD COLUMN     "Severidad" VARCHAR(20) NOT NULL DEFAULT 'INFO';

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_Severidad_idx" ON "AuditoriaEmpleado"("Severidad");
