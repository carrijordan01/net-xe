// Datos de demostración para desarrollo local. Desde server/:
//   npm run seed
//
// Crea (o restablece) las cuentas demo con las credenciales de abajo. Si la
// cuenta demo Solicitante aún no tiene contratos, crea además contratos de
// ejemplo en distintos estados. Se puede ejecutar varias veces sin duplicar.
//
// Credenciales SOLO para pruebas locales: no usar en ningún entorno real.
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";
import { validarContrato } from "../src/catalogo/plantillas.js";
import { hashContenido } from "../src/firma.js";

const PASSWORD_DEMO = "netxe-demo-2026";

const CUENTAS = [
  {
    clave: "solicitante",
    email: "demo.solicitante@test.local",
    firstName: "Demo",
    lastName: "Solicitante",
    role: "SOLICITANTE",
    pin: "482915"
  },
  {
    clave: "contraparte",
    email: "demo.contraparte@test.local",
    firstName: "Demo",
    lastName: "Contraparte",
    role: "CONTRAPARTE",
    company: "Demo SpA",
    pin: "739204"
  },
  {
    clave: "independiente",
    email: "demo.independiente@test.local",
    firstName: "Carla",
    lastName: "Rojas",
    role: "CONTRAPARTE",
    phone: "+56 9 5555 0101",
    pin: "615283"
  }
];

const COMUNES = {
  ciudad: "Santiago",
  fechaInicio: "2026-11-01",
  rutSolicitante: "11.111.111-1",
  domicilioSolicitante: "Av. Providencia 1234, Providencia"
};

async function crearCuentas() {
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  const cuentas = {};
  for (const c of CUENTAS) {
    const datos = {
      firstName: c.firstName,
      lastName: c.lastName,
      role: c.role,
      company: c.company ?? null,
      phone: c.phone ?? null,
      accountType: c.company ? "EMPRESA" : "INDIVIDUAL",
      passwordHash,
      pinFirmaHash: await bcrypt.hash(c.pin, 10),
      intentosFirmaFallidos: 0,
      firmaBloqueadaHasta: null
    };
    cuentas[c.clave] = await prisma.user.upsert({
      where: { email: c.email },
      update: datos,
      create: { email: c.email, ...datos }
    });
  }
  return cuentas;
}

async function crearContrato({ solicitante, contraparte, tipo, datos, modalidad = null, fechaTermino = null, estado, firmado = false }) {
  const v = validarContrato({ tipo, datos: { ...COMUNES, ...datos }, modalidad, fechaTermino });
  if (Object.keys(v.errores).length > 0) throw new Error(`Datos de ejemplo inválidos (${tipo}): ${JSON.stringify(v.errores)}`);

  const contrato = await prisma.contrato.create({
    data: {
      tipo,
      estado,
      solicitanteId: solicitante.id,
      contraparteId: contraparte.id,
      datos: v.datos,
      modalidad: v.modalidad,
      fechaTermino: v.fechaTermino
    }
  });
  const historial = [{ usuarioId: solicitante.id, evento: "Contrato creado" }];
  if (estado !== "PENDIENTE") historial.push({ usuarioId: contraparte.id, evento: "Contrato aceptado" });

  if (firmado) {
    const huella = hashContenido({ ...contrato, documentos: [] });
    const ahora = new Date();
    await prisma.contrato.update({
      where: { id: contrato.id },
      data: {
        firmadoSolicitante: true,
        firmadoContraparte: true,
        fechaFirmaSolicitante: ahora,
        fechaFirmaContraparte: ahora,
        ipFirmaSolicitante: "127.0.0.1",
        ipFirmaContraparte: "127.0.0.1",
        firmaSolicitanteHash: huella,
        firmaContraparteHash: huella
      }
    });
    historial.push(
      { usuarioId: solicitante.id, evento: "Contrato firmado", comentario: `Firma de la parte solicitante. Huella SHA-256: ${huella}` },
      { usuarioId: contraparte.id, evento: "Contrato firmado", comentario: `Firma de la parte contraparte. Huella SHA-256: ${huella}` }
    );
  }

  await prisma.accionHistorial.createMany({ data: historial.map((h) => ({ contratoId: contrato.id, ...h })) });
  return contrato;
}

async function crearContratosEjemplo({ solicitante, contraparte, independiente }) {
  const existentes = await prisma.contrato.count({ where: { solicitanteId: solicitante.id } });
  if (existentes > 0) {
    console.log(`La cuenta demo Solicitante ya tiene ${existentes} contrato(s): no se crean contratos de ejemplo.`);
    return;
  }

  await crearContrato({
    solicitante,
    contraparte: independiente,
    tipo: "SERVICIOS_PROFESIONALES",
    estado: "PENDIENTE",
    modalidad: "TRACTO_SUCESIVO",
    datos: {
      servicio: "Diseño y desarrollo del sitio web de la empresa.",
      honorarios: 1200000,
      periodicidadPago: "Por avance o hito",
      formaPago: "Transferencia bancaria",
      plazoEjecucion: "3 meses desde la fecha de inicio",
      confidencialidad: true
    }
  });
  await crearContrato({
    solicitante,
    contraparte,
    tipo: "MUTUO",
    estado: "ACEPTADO",
    modalidad: "TRACTO_SUCESIVO",
    fechaTermino: "2027-06-30",
    datos: { monto: 500000, formaDevolucion: "En cuotas", numeroCuotas: 5 }
  });
  await crearContrato({
    solicitante,
    contraparte,
    tipo: "CONTRATO_SIMPLE",
    estado: "FIRMADO",
    firmado: true,
    datos: {
      titulo: "Diseño de logo para cafetería",
      objeto: "Diseño de un logo y su manual básico de uso.",
      obligacionesSolicitante: "Pagar $150.000 al recibir los archivos finales.",
      obligacionesContraparte: "Entregar tres propuestas y los archivos finales en formato vectorial.",
      monto: 150000
    }
  });
  console.log("Se crearon 3 contratos de ejemplo (pendiente, aceptado y firmado).");
}

const cuentas = await crearCuentas();
await crearContratosEjemplo(cuentas);
await prisma.$disconnect();

console.log("\nCuentas demo listas (contraseña y PIN de cada una definidos en prisma/seed.js):");
for (const c of CUENTAS) console.log(`  · ${c.email} (${c.role === "SOLICITANTE" ? "Solicitante" : "Contraparte"})`);
