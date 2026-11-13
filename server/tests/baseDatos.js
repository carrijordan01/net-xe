// Base de datos de las pruebas: la misma conexión de server/.env, pero con la
// base «netxe_test» (o la que indique DATABASE_URL_PRUEBAS). Nunca la de desarrollo.
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

export const RAIZ_SERVIDOR = fileURLToPath(new URL("..", import.meta.url));
export const CARPETA_TEMPORAL = path.join(os.tmpdir(), "netxe-pruebas");

export function urlBasePruebas() {
  dotenv.config({ path: path.join(RAIZ_SERVIDOR, ".env"), quiet: true });
  if (process.env.DATABASE_URL_PRUEBAS) return process.env.DATABASE_URL_PRUEBAS;

  const desarrollo = process.env.DATABASE_URL;
  if (!desarrollo) throw new Error("Falta DATABASE_URL en server/.env");
  const url = new URL(desarrollo);
  const nombre = url.pathname.slice(1);
  url.pathname = "/" + (nombre.endsWith("_dev") ? nombre.replace(/_dev$/, "_test") : `${nombre}_test`);
  if (url.toString() === desarrollo) throw new Error("La base de pruebas no puede ser la de desarrollo");
  return url.toString();
}
