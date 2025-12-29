import db from "@/DB/prisma";

// Condiciones de IVA estándar de Argentina
const condicionesIva = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "No Responsable",
  "Consumidor Final",
];

async function main() {
  console.log("🌱 Iniciando seed de condiciones de IVA...");

  for (const descripcion of condicionesIva) {
    // Verificar si ya existe
    const existe = await db.condicionIva.findFirst({
      where: {
        Descripcion: descripcion,
        EstaEliminado: false,
      },
    });

    if (!existe) {
      await db.condicionIva.create({
        data: {
          Descripcion: descripcion,
          EstaEliminado: false,
        },
      });
      console.log(`✅ Creada condición IVA: ${descripcion}`);
    } else {
      console.log(`⏭️  Condición IVA ya existe: ${descripcion}`);
    }
  }

  console.log("✨ Seed de condiciones de IVA completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
