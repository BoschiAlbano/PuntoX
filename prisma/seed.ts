import db from "@/DB/prisma";
// import * as fs from "fs";
// import * as path from "path";

// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const provincias = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "json/provincias.json"), "utf-8")
// );

async function main() {}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
