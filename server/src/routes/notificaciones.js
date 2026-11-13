import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";
import { generarAvisosVencimiento } from "../notificaciones.js";

const router = express.Router();

// Notificaciones del usuario (las 50 más recientes) y cantidad sin leer.
// Antes de responder se generan los avisos de contratos próximos a vencer.
router.get("/", requireAuth, async (req, res) => {
  const usuarioId = req.user.id;
  await generarAvisosVencimiento(usuarioId);

  const [notificaciones, noLeidas] = await Promise.all([
    prisma.notification.findMany({
      where: { usuarioId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, tipo: true, mensaje: true, leido: true, createdAt: true, contratoId: true }
    }),
    prisma.notification.count({ where: { usuarioId, leido: false } })
  ]);

  res.json({ notificaciones, noLeidas });
});

// Marcar todas como leídas (antes de /:id para que no la capture)
router.put("/leidas", requireAuth, async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { usuarioId: req.user.id, leido: false },
    data: { leido: true }
  });
  res.json({ marcadas: count });
});

// Marcar una notificación como leída
router.put("/:id/leido", requireAuth, async (req, res) => {
  const notifId = Number(req.params.id);

  const { count } = await prisma.notification.updateMany({
    where: { id: notifId, usuarioId: req.user.id },
    data: { leido: true }
  });

  if (count === 0) {
    return res.status(404).json({ error: "Notificación no encontrada." });
  }

  res.json({ id: notifId, leido: true });
});

export default router;
