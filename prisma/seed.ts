import db from "@/DB/prisma";
import * as fs from "fs";
import * as path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const provincias = JSON.parse(
  fs.readFileSync(path.join(__dirname, "json/provincias.json"), "utf-8")
);
const departamentos = JSON.parse(
  fs.readFileSync(path.join(__dirname, "json/departamentos.json"), "utf-8")
);
const localidades = JSON.parse(
  fs.readFileSync(path.join(__dirname, "json/localidades.json"), "utf-8")
);

async function main() {
  // for (const prov of provincias.provincias) {
  //   await db.provincia.create({
  //     data: {
  //       Id: Number(prov.id),
  //       Descripcion: prov.nombre,
  //       EstaEliminado: false,
  //     },
  //   });
  // }
  // for (const dep of departamentos.departamentos) {
  //   await db.departamento.create({
  //     data: {
  //       Id: Number(dep.id),
  //       Descripcion: dep.nombre,
  //       ProvinciaId: Number(dep.provincia.id),
  //       EstaEliminado: false,
  //     },
  //   });
  // }
  // for (const loc of localidades.localidades) {
  //   await db.localidad.upsert({
  //     where: { Id: Number(loc.id) },
  //     create: {
  //       Id: Number(loc.id),
  //       Descripcion: loc.nombre,
  //       DepartamentoId: Number(loc.departamento.id),
  //       EstaEliminado: false,
  //     },
  //     update: {
  //       Descripcion: loc.nombre,
  //       DepartamentoId: Number(loc.departamento.id),
  //       EstaEliminado: false,
  //     },
  //   });
  // }
  // ivas
  // await db.iva.create({
  //   data: {
  //     Descripcion: "21%",
  //     Porcentaje: 21,
  //     EstaEliminado: false,
  //   },
  // });
  // await db.iva.create({
  //   data: {
  //     Descripcion: "10.5%",
  //     Porcentaje: 10.5,
  //     EstaEliminado: false,
  //   },
  // });
  // await db.iva.create({
  //   data: {
  //     Descripcion: "0%",
  //     Porcentaje: 0,
  //     EstaEliminado: false,
  //   },
  // });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
