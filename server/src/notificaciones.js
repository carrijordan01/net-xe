// Notificaciones en pantalla (campana). No hay servicios externos ni tareas
// programadas: los avisos de vencimiento se generan al consultar.
import { prisma } from "./db.js";
import { nombreContrato } from "./catalogo/plantillas.js";

export const DIAS_AVISO_VENCIMIENTO = 7;

export async function nombreUsuario(id) {
  const u = await prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
  return u ? `${u.firstName} ${u.lastName}` : "Un usuario";
}

// Crea una notificación. Un error aquí nunca debe impedir la acción que la originó.
export async function notificar({ usuarioId, tipo, contrato, mensaje, clave }) {
  try {
    await prisma.notification.create({
      data: { usuarioId, tipo, mensaje, contratoId: contrato?.id ?? null, clave: clave ?? null }
    });
  } catch (err) {
    // P2002: el aviso con esa clave ya existe (p. ej. el de vencimiento)
    if (err.code !== "P2002") console.error("Error creando notificación:", err);
  }
}

// Mensaje estándar: «Ana Pérez aceptó «Contrato de arriendo».»
export async function notificarEvento({ destinatarioId, actorId, tipo, contrato, accion, detalle }) {
  const actor = await nombreUsuario(actorId);
  const mensaje = `${actor} ${accion} «${nombreContrato(contrato)}».${detalle ? ` ${detalle}` : ""}`;
  await notificar({ usuarioId: destinatarioId, tipo, contrato, mensaje });
}

// Las fechas de término se guardan como medianoche UTC del día indicado; «hoy»
// se toma de la fecha local del servidor para comparar días calendario.
function hoyComoFechaUTC() {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
}

function inicioDelDia(fecha) {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

// Avisa (una sola vez por contrato y fecha) de los contratos vigentes del
// usuario cuya fecha de término está dentro de los próximos días.
export async function generarAvisosVencimiento(usuarioId) {
  const hoy = hoyComoFechaUTC();
  const limite = new Date(hoy.getTime() + DIAS_AVISO_VENCIMIENTO * 86400000);

  const contratos = await prisma.contrato.findMany({
    where: {
      OR: [{ solicitanteId: usuarioId }, { contraparteId: usuarioId }],
      estado: { in: ["PENDIENTE", "ACEPTADO", "FIRMADO"] },
      fechaTermino: { gte: hoy, lte: limite }
    }
  });

  for (const contrato of contratos) {
    const fecha = contrato.fechaTermino.toISOString().slice(0, 10);
    const dias = Math.round((inicioDelDia(contrato.fechaTermino) - hoy) / 86400000);
    const cuando = dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`;
    const [a, m, d] = fecha.split("-");
    await notificar({
      usuarioId,
      tipo: "VENCIMIENTO_PROXIMO",
      contrato,
      clave: `vencimiento:${contrato.id}:${fecha}`,
      mensaje: `«${nombreContrato(contrato)}» vence ${cuando} (${d}-${m}-${a}).`
    });
  }
}
