import { prisma } from "../src/db.js";

// Cierra la conexión de Prisma al terminar cada archivo de pruebas
afterAll(() => prisma.$disconnect());
