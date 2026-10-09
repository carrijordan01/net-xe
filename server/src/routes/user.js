import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// Listar usuarios (excepto el propio). Filtro opcional: ?role=CONTRAPARTE
router.get("/", requireAuth, async (req, res) => {
  try {
    const where = { id: { not: req.user.id } };
    const role = req.query.role?.toString().toUpperCase();
    if (role === "SOLICITANTE" || role === "CONTRAPARTE") {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        accountType: true,
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
