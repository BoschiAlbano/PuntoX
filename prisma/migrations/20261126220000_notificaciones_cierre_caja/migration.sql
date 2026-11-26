-- Email a los administradores al cerrar una caja (opt-in, desactivado por defecto)
ALTER TABLE "Configuracion" ADD COLUMN "NotificacionesCierreCaja" BOOLEAN NOT NULL DEFAULT false;
