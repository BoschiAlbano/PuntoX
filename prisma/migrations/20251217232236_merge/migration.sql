-- AlterTable
ALTER TABLE "Configuracion" ADD COLUMN     "AbrirCajonEfectivo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "MostrarPreciosConIva" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "NumerarPedidosPantalla" BOOLEAN NOT NULL DEFAULT true;
