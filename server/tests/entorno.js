// Variables de entorno de cada archivo de pruebas. Se cargan antes de importar
// la aplicación, para que Prisma, el correo y los adjuntos usen lo de pruebas.
import path from "node:path";
import { CARPETA_TEMPORAL, urlBasePruebas } from "./baseDatos.js";

process.env.DATABASE_URL = urlBasePruebas();
process.env.JWT_SECRET ||= "secreto-de-pruebas";
process.env.APP_URL = "http://localhost:5173";
// Correos siempre en modo local y en una carpeta temporal
delete process.env.SMTP_HOST;
process.env.CARPETA_CORREOS = path.join(CARPETA_TEMPORAL, "correos");
process.env.CARPETA_DOCUMENTOS = path.join(CARPETA_TEMPORAL, "documentos");
