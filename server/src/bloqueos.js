import { prisma } from "./db.js";

// Relación de bloqueo entre el usuario en sesión y otro usuario
export async function relacionBloqueo(yoId, otroId) {
  const bloqueos = await prisma.bloqueo.findMany({
    where: {
      OR: [
        { bloqueadorId: yoId, bloqueadoId: otroId },
        { bloqueadorId: otroId, bloqueadoId: yoId }
      ]
    },
    select: { bloqueadorId: true }
  });
  return {
    bloqueadoPorMi: bloqueos.some((b) => b.bloqueadorId === yoId),
    meBloqueo: bloqueos.some((b) => b.bloqueadorId === otroId)
  };
}

export async function hayBloqueo(aId, bId) {
  const r = await relacionBloqueo(aId, bId);
  return r.bloqueadoPorMi || r.meBloqueo;
}

// Ids de los usuarios que bloqueé y de los que me bloquearon
export async function idsConBloqueo(yoId) {
  const bloqueos = await prisma.bloqueo.findMany({
    where: { OR: [{ bloqueadorId: yoId }, { bloqueadoId: yoId }] },
    select: { bloqueadorId: true, bloqueadoId: true }
  });
  return {
    bloqueadosPorMi: new Set(bloqueos.filter((b) => b.bloqueadorId === yoId).map((b) => b.bloqueadoId)),
    meBloquearon: new Set(bloqueos.filter((b) => b.bloqueadoId === yoId).map((b) => b.bloqueadorId))
  };
}
