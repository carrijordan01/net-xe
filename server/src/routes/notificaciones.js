import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// Obtener notificaciones del usuario
router.get("/", requireAuth, async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where: { usuarioId: req.user.id },
    orderBy: { createdAt: "desc" }
  });

  res.json(notifs);
});

// Marcar notificación como leída
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
