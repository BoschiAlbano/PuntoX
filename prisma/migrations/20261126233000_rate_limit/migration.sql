-- Límite de pedidos para rutas públicas (/api/auth/*)
CREATE TABLE "RateLimit" (
    "Clave" VARCHAR(200) NOT NULL,
    "VentanaInicio" TIMESTAMP(3) NOT NULL,
    "Conteo" INTEGER NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("Clave")
);
