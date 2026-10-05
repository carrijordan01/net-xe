import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";
// import PDFDocument from "pdfkit";

const router = express.Router();

// TODO: integrar servicio real de notificaciones
const enviarNotificacion = async () => {};

async function validarContratoFirmable(prismaClient, contratoId) {
  const contrato = await prismaClient.contrato.findUnique({
    where: { id: contratoId }
  });

  if (!contrato) return { error: "Contrato no encontrado" };

  if (contrato.firmadoProponente && contrato.firmadoSolicitante) {
    return { error: "El contrato ya está firmado por ambas partes." };
  }

  return { contrato };
}

// CREAR CONTRATO
router.post("/", requireAuth, async (req, res) => {
  try {
    const { tipo, proponenteId, datos } = req.body;

    if (!tipo || !proponenteId || !datos) {
      return res.status(400).json({ error: "Faltan datos del contrato." });
    }

    const solicitanteId = req.user.id;

    const contrato = await prisma.contrato.create({
      data: {
        tipo,
        solicitanteId,
        proponenteId,
        datos
      }
    });

    await enviarNotificacion(
      contrato.solicitanteId,
      "Has recibido un nuevo contrato para revisión."
    );

    res.json(contrato);
  } catch (err) {
    console.error("Error creando contrato:", err);
    res.status(500).json({ error: "Error al crear contrato." });
  }
});

// LISTAR CONTRATOS DEL SOLICITANTE
router.get("/mios", requireAuth, async (req, res) => {
  try {
    const contratos = await prisma.contrato.findMany({
      where: { solicitanteId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        proponente: { select: { nombre: true, apellido: true, email: true } }
      }
    });

    res.json(contratos);
  } catch (err) {
    console.error("Error listando contratos del usuario:", err);
    res.status(500).json({ error: "Error al obtener contratos." });
  }
});

// EDITAR CONTRATO
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const contratoId = parseInt(req.params.id);

    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoId }
    });

    if (!contrato) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Validar que el contrato no está firmado por ambas partes
    if (contrato.firmadoProponente && contrato.firmadoSolicitante) {
      return res.status(403).json({ msg: "El contrato ya no puede ser editado." });
    }

    const datosActualizados = req.body;

    const contratoActualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data: datosActualizados
    });

    return res.json({
      msg: "Contrato actualizado correctamente",
      contrato: contratoActualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error interno al actualizar contrato" });
  }
});

// LISTAR CONTRATOS DEL PROPONENTE
router.get("/recibidos", requireAuth, async (req, res) => {
  try {
    const contratos = await prisma.contrato.findMany({
      where: { proponenteId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        solicitante: { select: { nombre: true, apellido: true, email: true } }
      }
    });

    res.json(contratos);
  } catch (err) {
    console.error("Error listando contratos recibidos:", err);
    res.status(500).json({ error: "Error al obtener contratos recibidos." });
  }
});

// VER DETALLE DE CONTRATO
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        solicitante: { select: { nombre: true, apellido: true, email: true } },
        proponente: { select: { nombre: true, apellido: true, email: true } }
      }
    });

    if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

    if (
      contrato.solicitanteId !== req.user.id &&
      contrato.proponenteId !== req.user.id
    ) {
      return res.status(403).json({ error: "No tienes permiso para ver este contrato." });
    }

    res.json(contrato);
  } catch (err) {
    console.error("Error obteniendo contrato:", err);
    res.status(500).json({ error: "Error al obtener contrato." });
  }
});

// ELIMINAR CONTRATO
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

    if (contrato.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este contrato." });
    }

    await prisma.contrato.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ message: "Contrato eliminado correctamente." });
  } catch (err) {
    console.error("Error eliminando contrato:", err);
    res.status(500).json({ error: "Error al eliminar contrato." });
  }
});

// FIRMAR CONTRATO COMO PROPONENTE
router.post("/:id/firmar/proponente", requireAuth, async (req, res) => {
  try {
    const contratoId = parseInt(req.params.id);
    const { id: usuarioId } = req.user;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const { contrato, error } = await validarContratoFirmable(prisma, contratoId);
    if (error) return res.status(400).json({ msg: error });

    if (contrato.proponenteId !== usuarioId) {
      return res.status(403).json({ msg: "Solo el proponente puede firmar aquí." });
    }

    if (contrato.firmadoProponente) {
      return res.status(400).json({ msg: "El proponente ya firmó." });
    }

    const actualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        firmadoProponente: true,
        firmaProponenteAt: new Date(),
        firmaProponenteIP: ip
      }
    });
    await enviarNotificacion(contrato.solicitanteId, "El proponente ha firmado el contrato.");

    return res.json({ msg: "Firma registrada", contrato: actualizado });
  } catch (error) {
    return res.status(500).json({ msg: "Error interno" });
  }
});

// FIRMAR CONTRATO COMO SOLICITANTE
router.post("/:id/firmar/solicitante", requireAuth, async (req, res) => {
  try {
    const contratoId = parseInt(req.params.id);
    const { id: usuarioId } = req.user;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const { contrato, error } = await validarContratoFirmable(prisma, contratoId);
    if (error) return res.status(400).json({ msg: error });

    if (contrato.solicitanteId !== usuarioId) {
      return res.status(403).json({ msg: "Solo el solicitante puede firmar aquí." });
    }

    if (contrato.firmadoSolicitante) {
      return res.status(400).json({ msg: "El solicitante ya firmó." });
    }

    const actualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        firmadoSolicitante: true,
        firmaSolicitanteAt: new Date(),
        firmaSolicitanteIP: ip
      }
    });
    await enviarNotificacion(contrato.proponenteId, "El solicitante ha firmado el contrato.");

    return res.json({ msg: "Firma registrada", contrato: actualizado });
  } catch (error) {
    return res.status(500).json({ msg: "Error interno" });
  }
});

// BUSCAR CONTRATOS
router.get("/buscar", requireAuth, async (req, res) => {
  const { id: usuarioId, role } = req.user;
  const { q, tipo, estado } = req.query;

  let where = {};

  // por Rol
  if (role === "PROPONENTE") {
    where.proponenteId = usuarioId;
  } else if (role === "SOLICITANTE") {
    where.solicitanteId = usuarioId;
  }

  // por texto
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } }
    ];
  }

  // por tipo
  if (tipo && tipo !== "TODOS") {
    where.tipo = tipo;
  }

  // por estado
  if (estado && estado !== "TODOS") {
    if (estado === "FIRMADO") {
      where.AND = [
        { firmadoProponente: true },
        { firmadoSolicitante: true }
      ];
    } else if (estado === "NO_FIRMADO") {
      where.OR = [
        { firmadoProponente: false },
        { firmadoSolicitante: false }
      ];
    }
  }

  const contratos = await prisma.contrato.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  res.json(contratos);
});

// GENERAR PDF DEL CONTRATO (pendiente)
router.get("/:id/pdf", requireAuth, async (req, res) => {
  try {
    const contratoId = parseInt(req.params.id);
    const { id: usuarioId } = req.user;

    // Obtener contrato
    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoId },
    });

    if (!contrato) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Validar que el usuario tenga permiso
    if (
      usuarioId !== contrato.proponenteId &&
      usuarioId !== contrato.solicitanteId
    ) {
      return res.status(403).json({ msg: "No tienes permiso para este contrato." });
    }

    // PDF pendiente de implementación
    return res.status(501).json({ msg: "Generación de PDF en construcción." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error interno" });
  }
});

// HISTORIAL
router.get("/:id/historial", requireAuth, async (req, res) => {
  const historial = await prisma.accionHistorial.findMany({
    where: { contratoId: Number(req.params.id) },
    orderBy: { fecha: "asc" },
    include: { usuario: true }
  });
  res.json(historial);
});

export default router;
