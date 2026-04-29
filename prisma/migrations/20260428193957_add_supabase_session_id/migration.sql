-- AlterTable
ALTER TABLE "SesionActiva" ADD COLUMN     "SupabaseSessionId" VARCHAR(50);

-- CreateIndex
CREATE INDEX "SesionActiva_SupabaseSessionId_idx" ON "SesionActiva"("SupabaseSessionId");
