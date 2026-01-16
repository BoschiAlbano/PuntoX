import db from "@/DB/prisma";
import { Iva } from "./generated/prisma";
import { Decimal } from "./generated/prisma/runtime/library";
// Condiciones de IVA estándar de Argentina
const condicionesIva = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "No Responsable",
  "Consumidor Final",
];

const ivas: Iva[] = [
  {
    Descripcion: "21",
    Porcentaje: Decimal(21),
    EstaEliminado: false,
    Id: BigInt(1),
  },
  {
    Descripcion: "10,5",
    Porcentaje: Decimal(10.5),
    EstaEliminado: false,
    Id: BigInt(2),
  },
];
async function main() {
  console.log("🌱 Iniciando seed...");
  for (const descripcion of condicionesIva) {
    await db.condicionIva.create({
      data: {
        Descripcion: descripcion,
        EstaEliminado: false,
      },
    });
    console.log("✨ Seed de condiciones de IVA completado!");
  }

  for (const iva of ivas) {
    await db.iva.create({
      data: {
        Descripcion: iva.Descripcion,
        Porcentaje: iva.Porcentaje,
        EstaEliminado: false,
      },
    });
  }
  console.log("✨ Seed de IVA completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
