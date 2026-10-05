import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// Obtener notificaciones del usuario
router.get("/", requireAuth, async (req, res) => {
  const usuarioId = req.user?.id || req.user?.sub;

  if (!usuarioId) {
    return res.status(400).json({ error: "No se pudo determinar el usuario." });
  }

  const notifs = await prisma.notification.findMany({
    where: { usuarioId },
    orderBy: { createdAt: "desc" }
  });

  res.json(notifs);
});

// Marcar notificación como leída
router.put("/:id/leido", requireAuth, async (req, res) => {
  const notifId = parseInt(req.params.id);

  const notif = await prisma.notification.update({
    where: { id: notifId },
    data: { leido: true }
  });

  res.json(notif);
});

export default router;
