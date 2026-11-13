// Firma electrónica simple con trazabilidad: verificación de contraseña + PIN
// (con bloqueo por intentos fallidos) y huella SHA-256 del contenido firmado.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";

export const MAX_INTENTOS_FIRMA = 5;
const MINUTOS_BLOQUEO = 15;

// JSON con claves ordenadas, para que el mismo contenido produzca la misma huella
function jsonCanonico(valor) {
  if (Array.isArray(valor)) return `[${valor.map(jsonCanonico).join(",")}]`;
  if (valor && typeof valor === "object") {
    return `{${Object.keys(valor).sort().map((k) => `${JSON.stringify(k)}:${jsonCanonico(valor[k])}`).join(",")}}`;
  }
  return JSON.stringify(valor ?? null);
}

// Huella del contenido acordado: partes, tipo, datos, condiciones y, si los
// hay, los documentos adjuntos (por su propia huella). Requiere que
// `contrato.documentos` venga cargado con { hash } (ver INCLUIR_DOCUMENTOS).
// Sin documentos, la huella es la misma que antes de existir los adjuntos.
export function hashContenido(contrato) {
  if (!Array.isArray(contrato.documentos)) {
    throw new Error("hashContenido requiere el contrato con sus documentos cargados");
  }
  const contenido = {
    contratoId: contrato.id,
    tipo: contrato.tipo,
    solicitanteId: contrato.solicitanteId,
    contraparteId: contrato.contraparteId,
    datos: contrato.datos,
    modalidad: contrato.modalidad ?? null,
    fechaTermino: contrato.fechaTermino ? new Date(contrato.fechaTermino).toISOString().slice(0, 10) : null
  };
  if (contrato.documentos.length > 0) {
    contenido.documentos = contrato.documentos.map((d) => d.hash).sort();
  }
  return crypto.createHash("sha256").update(jsonCanonico(contenido)).digest("hex");
}

// Para cargar un contrato con lo que necesita hashContenido
export const INCLUIR_DOCUMENTOS = { documentos: { select: { hash: true } } };

// 6 dígitos, sin secuencias ni dígitos repetidos (000000, 123456, 654321…)
export function errorFormatoPin(pin) {
  if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) return "El PIN debe tener exactamente 6 dígitos.";
  if (/^(\d)\1{5}$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) {
    return "El PIN es demasiado simple. Evita secuencias y dígitos repetidos.";
  }
  return null;
}

export const hashearPin = (pin) => bcrypt.hash(pin, 10);

// Verifica contraseña y PIN del usuario. Devuelve null si son correctos, o
// { status, error } si no. Cuenta los intentos fallidos y bloquea la firma.
export async function verificarCredencialesFirma(usuario, password, pin) {
  if (usuario.firmaBloqueadaHasta && usuario.firmaBloqueadaHasta > new Date()) {
    const minutos = Math.ceil((usuario.firmaBloqueadaHasta - Date.now()) / 60000);
    return { status: 423, error: `Firma bloqueada por intentos fallidos. Intenta nuevamente en ${minutos} minuto(s).` };
  }
  if (!usuario.pinFirmaHash) {
    return { status: 400, error: "Primero debes crear tu PIN de firma." };
  }

  const passwordOk = typeof password === "string" && (await bcrypt.compare(password, usuario.passwordHash));
  const pinOk = typeof pin === "string" && (await bcrypt.compare(pin, usuario.pinFirmaHash));

  if (passwordOk && pinOk) {
    if (usuario.intentosFirmaFallidos > 0 || usuario.firmaBloqueadaHasta) {
      await prisma.user.update({
        where: { id: usuario.id },
        data: { intentosFirmaFallidos: 0, firmaBloqueadaHasta: null }
      });
    }
    return null;
  }

  const intentos = usuario.intentosFirmaFallidos + 1;
  const bloquear = intentos >= MAX_INTENTOS_FIRMA;
  await prisma.user.update({
    where: { id: usuario.id },
    data: bloquear
      ? { intentosFirmaFallidos: 0, firmaBloqueadaHasta: new Date(Date.now() + MINUTOS_BLOQUEO * 60000) }
      : { intentosFirmaFallidos: intentos }
  });

  if (bloquear) {
    return { status: 423, error: `Demasiados intentos fallidos. La firma quedó bloqueada por ${MINUTOS_BLOQUEO} minutos.` };
  }
  const restantes = MAX_INTENTOS_FIRMA - intentos;
  // 422 y no 401: el cliente interpreta un 401 como sesión expirada
  return { status: 422, error: `Contraseña o PIN incorrectos. Te quedan ${restantes} intento(s).` };
}
