-- DropForeignKey
ALTER TABLE "FormaPago" DROP CONSTRAINT "FormaPago_ComprobanteId_fkey";

-- AlterTable
ALTER TABLE "FormaPago" ADD COLUMN     "GastoId" BIGINT,
ALTER COLUMN "ComprobanteId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FormaPago_GastoId_idx" ON "FormaPago"("GastoId");

-- AddForeignKey
ALTER TABLE "FormaPago" ADD CONSTRAINT "FormaPago_ComprobanteId_fkey" FOREIGN KEY ("ComprobanteId") REFERENCES "Comprobante"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FormaPago" ADD CONSTRAINT "FormaPago_GastoId_fkey" FOREIGN KEY ("GastoId") REFERENCES "Gasto"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;
