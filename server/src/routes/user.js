import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        tipoCuenta: true,
        role: true
      }
    });

    res.json(users);
  } catch (error) {
    console.error("Error listando usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

export default router;
