// Se ejecuta una vez antes de todas las pruebas: aplica las migraciones en la
// base de pruebas (Prisma la crea si no existe) y la deja vacía.
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { CARPETA_TEMPORAL, RAIZ_SERVIDOR, urlBasePruebas } from "./baseDatos.js";

export default async function preparar() {
  const url = urlBasePruebas();
  execSync("npx prisma migrate deploy", {
    cwd: RAIZ_SERVIDOR,
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe"
  });

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const tablas = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tablas.length > 0) {
    const lista = tablas.map((t) => `"public"."${t.tablename}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`);
  }
  await prisma.$disconnect();

  await fs.rm(CARPETA_TEMPORAL, { recursive: true, force: true });
}
