import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import requireAuth from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

router.post("/", requireAuth, async (req, res) => {
    try {
      const { title, description, type, content, extraFields } = req.body;
      if (!title?.trim() || !content?.trim()) {
        return res.status(400).json({ error: "Faltan datos por completar"});
      }
  
      const newContract = await prisma.contract.create({
        data: {
          title,
          description: description || "",
          status: "Pendiente",
          type: type || "INDEFINIDO",
          content: JSON.stringify(extraFields || {}),
          ownerId: req.user.sub
        }
      });
  
      res.status(201).json(newContract);
    } catch (err) {
      console.error("Error al crear contrato:", err);
      res.status(500).json({ error: "Error al crear contrato", detail: err.message });
    }
  });  

router.get("/", requireAuth, async (req, res) => {
    try {
    console.log("Payload JWT:", req.user)
    const contracts = await prisma.contract.findMany({
      where: { ownerId: req.user.sub },
    });
    res.json(contracts);
} catch (err) {
    console.error("Error en GET /contracts:", err);
    res.status(500).json({ error: "Error al listar contratos", detail: err.message });
}
});  


export default router;
