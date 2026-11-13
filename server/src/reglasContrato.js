// Reglas y ayudantes compartidos por las rutas de contratos y de solicitudes
import { prisma } from "./db.js";

export const usuarioPublico = { select: { id: true, firstName: true, lastName: true, email: true } };

export async function registrarAccion(contratoId, usuarioId, evento, comentario) {
  await prisma.accionHistorial.create({
    data: { contratoId, usuarioId, evento, comentario }
  });
}

export function esParte(contrato, usuarioId) {
  return contrato.solicitanteId === usuarioId || contrato.contraparteId === usuarioId;
}

export function tieneFirmas(contrato) {
  return contrato.firmadoSolicitante || contrato.firmadoContraparte;
}

// Editar o eliminar directamente solo es posible antes de cualquier firma.
// Con firmas, se requiere una solicitud a la otra parte (rutas de solicitudes).
export function motivoNoModificable(contrato) {
  if (contrato.estado === "ELIMINADO") return "El contrato fue eliminado.";
  if (tieneFirmas(contrato)) {
    return "El contrato ya tiene firmas. Para modificarlo o eliminarlo debes solicitarlo a la otra parte.";
  }
  if (contrato.estado === "RECHAZADO") return "El contrato fue rechazado por la contraparte.";
  return null;
}

// Datos que se borran cuando un contrato firmado cambia y debe volver a firmarse
export const FIRMAS_REINICIADAS = {
  firmadoSolicitante: false,
  firmadoContraparte: false,
  fechaFirmaSolicitante: null,
  fechaFirmaContraparte: null,
  ipFirmaSolicitante: null,
  ipFirmaContraparte: null,
  firmaSolicitanteHash: null,
  firmaContraparteHash: null
};

export async function solicitudPendiente(contratoId) {
  return prisma.solicitudCambio.findFirst({ where: { contratoId, estado: "PENDIENTE" } });
}
