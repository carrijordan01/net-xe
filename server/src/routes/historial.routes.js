import { Router } from "express";
import { prisma } from "../prisma/client.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/:contratoId", auth, async (req, res) => {
  const contratoId = Number(req.params.contratoId);

  try {
    const historial = await prisma.accionHistorial.findMany({
      where: { contratoId },
      orderBy: { fecha: "asc" },
      include: {
        usuario: {
          select: { firstName: true, lastName: true, role: true }
        }
      }
    });

    res.json(historial);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el historial" });
  }
});

await prisma.accionHistorial.create({
  data: {
    contratoId: contrato.id,
    usuarioId: req.user.id,
    evento: "Contrato creado"
  }
});

await prisma.accionHistorial.create({
  data: {
    contratoId,
    usuarioId: req.user.id,
    evento: "Contrato firmado",
    comentario: "Firma digital registrada"
  }
});

await prisma.accionHistorial.create({
  data: {
    contratoId,
    usuarioId: req.user.id,
    evento: "Documento subido",
    comentario: tipoDocumento
  }
});

await prisma.accionHistorial.create({
  data: {
    contratoId,
    usuarioId: req.user.id,
    evento: "Contrato editado",
    comentario: "Se actualizaron datos del contrato"
  }
});


export default router;
