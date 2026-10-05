import prisma from "../lib/prisma.js";

export async function enviarNotificacion(usuarioId, mensaje) {
  await prisma.notification.create({
    data: {
      usuarioId,
      mensaje
    }
  });
}
