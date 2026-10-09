import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
// import PDFDocument from "pdfkit";

const router = express.Router();

const usuarioPublico = { select: { id: true, firstName: true, lastName: true, email: true } };

// TODO: integrar servicio real de notificaciones (Etapa 8)
const enviarNotificacion = async () => {};

async function registrarAccion(contratoId, usuarioId, evento, comentario) {
  await prisma.accionHistorial.create({
    data: { contratoId, usuarioId, evento, comentario }
  });
}

function esParte(contrato, usuarioId) {
  return contrato.solicitanteId === usuarioId || contrato.contraparteId === usuarioId;
}

function obtenerIP(req) {
  return req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress;
}

// CREAR CONTRATO
router.post("/", requireAuth, requireRole(["SOLICITANTE"]), async (req, res) => {
  try {
    const { tipo, datos, modalidad, fechaTermino } = req.body;
    const contraparteId = Number(req.body.contraparteId);

    if (!tipo || !contraparteId || !datos) {
      return res.status(400).json({ error: "Faltan datos del contrato." });
    }

    const contraparte = await prisma.user.findUnique({ where: { id: contraparteId } });
    if (!contraparte || contraparte.role !== "CONTRAPARTE") {
      return res.status(400).json({ error: "La contraparte indicada no es válida." });
    }

    const solicitanteId = req.user.id;

    const contrato = await prisma.contrato.create({
      data: {
        tipo,
        solicitanteId,
        contraparteId,
        datos,
        modalidad: modalidad || null,
        fechaTermino: fechaTermino ? new Date(fechaTermino) : null
      }
    });

    await registrarAccion(contrato.id, solicitanteId, "Contrato creado");
    await enviarNotificacion(
      contrato.contraparteId,
      "Has recibido un nuevo contrato para revisión."
    );

    res.status(201).json(contrato);
  } catch (err) {
    console.error("Error creando contrato:", err);
    res.status(500).json({ error: "Error al crear contrato." });
  }
});

// LISTAR CONTRATOS DEL SOLICITANTE
router.get("/mios", requireAuth, async (req, res) => {
  try {
    const contratos = await prisma.contrato.findMany({
      where: { solicitanteId: req.user.id, estado: { not: "ELIMINADO" } },
      orderBy: { createdAt: "desc" },
      include: { contraparte: usuarioPublico }
    });

    res.json(contratos);
  } catch (err) {
    console.error("Error listando contratos del usuario:", err);
    res.status(500).json({ error: "Error al obtener contratos." });
  }
});

// LISTAR CONTRATOS DE LA CONTRAPARTE
router.get("/recibidos", requireAuth, async (req, res) => {
  try {
    const contratos = await prisma.contrato.findMany({
      where: { contraparteId: req.user.id, estado: { not: "ELIMINADO" } },
      orderBy: { createdAt: "desc" },
      include: { solicitante: usuarioPublico }
    });

    res.json(contratos);
  } catch (err) {
    console.error("Error listando contratos recibidos:", err);
    res.status(500).json({ error: "Error al obtener contratos recibidos." });
  }
});

// BUSCAR CONTRATOS (debe ir antes de /:id)
router.get("/buscar", requireAuth, async (req, res) => {
  const { id: usuarioId, role } = req.user;
  const { tipo, estado } = req.query;

  const where = role === "CONTRAPARTE"
    ? { contraparteId: usuarioId }
    : { solicitanteId: usuarioId };

  if (tipo && tipo !== "TODOS") {
    where.tipo = tipo;
  }

  if (estado && estado !== "TODOS") {
    where.estado = estado;
  } else {
    where.estado = { not: "ELIMINADO" };
  }

  try {
    const contratos = await prisma.contrato.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { solicitante: usuarioPublico, contraparte: usuarioPublico }
    });

    res.json(contratos);
  } catch (err) {
    console.error("Error buscando contratos:", err);
    res.status(400).json({ error: "Filtros de búsqueda inválidos." });
  }
});

// VER DETALLE DE CONTRATO
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id: Number(req.params.id) },
      include: { solicitante: usuarioPublico, contraparte: usuarioPublico }
    });

    if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

    if (!esParte(contrato, req.user.id)) {
      return res.status(403).json({ error: "No tienes permiso para ver este contrato." });
    }

    res.json(contrato);
  } catch (err) {
    console.error("Error obteniendo contrato:", err);
    res.status(500).json({ error: "Error al obtener contrato." });
  }
});

// EDITAR CONTRATO (solo el solicitante y antes de cualquier firma)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const contratoId = Number(req.params.id);

    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoId }
    });

    if (!contrato) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    if (contrato.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para editar este contrato." });
    }

    if (contrato.firmadoContraparte || contrato.firmadoSolicitante || contrato.estado === "ELIMINADO") {
      return res.status(403).json({ error: "El contrato ya no puede ser editado." });
    }

    const { datos, tipo, modalidad, fechaTermino } = req.body;
    const data = {};
    if (datos !== undefined) data.datos = datos;
    if (tipo !== undefined) data.tipo = tipo;
    if (modalidad !== undefined) data.modalidad = modalidad || null;
    if (fechaTermino !== undefined) data.fechaTermino = fechaTermino ? new Date(fechaTermino) : null;

    const contratoActualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data
    });

    await registrarAccion(contratoId, req.user.id, "Contrato editado", "Se actualizaron datos del contrato");

    return res.json({
      msg: "Contrato actualizado correctamente",
      contrato: contratoActualizado
    });
  } catch (error) {
    console.error("Error actualizando contrato:", error);
    res.status(500).json({ error: "Error interno al actualizar contrato." });
  }
});

// ELIMINAR CONTRATO (borrado lógico)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const contratoId = Number(req.params.id);
    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoId }
    });

    if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

    if (contrato.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este contrato." });
    }

    if (contrato.estado === "ELIMINADO") {
      return res.status(400).json({ error: "El contrato ya fue eliminado." });
    }

    await prisma.contrato.update({
      where: { id: contratoId },
      data: { estado: "ELIMINADO" }
    });

    await registrarAccion(contratoId, req.user.id, "Contrato eliminado");

    res.json({ message: "Contrato eliminado correctamente." });
  } catch (err) {
    console.error("Error eliminando contrato:", err);
    res.status(500).json({ error: "Error al eliminar contrato." });
  }
});

// FIRMAR CONTRATO (parte = "solicitante" | "contraparte")
async function firmar(req, res, parte) {
  try {
    const contratoId = Number(req.params.id);
    const usuarioId = req.user.id;

    const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });
    if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

    if (contrato.estado === "ELIMINADO" || contrato.estado === "RECHAZADO") {
      return res.status(400).json({ error: "Este contrato no se puede firmar." });
    }

    const esSolicitante = parte === "solicitante";
    const idParte = esSolicitante ? contrato.solicitanteId : contrato.contraparteId;
    const yaFirmo = esSolicitante ? contrato.firmadoSolicitante : contrato.firmadoContraparte;
    const otraFirmo = esSolicitante ? contrato.firmadoContraparte : contrato.firmadoSolicitante;

    if (idParte !== usuarioId) {
      return res.status(403).json({ error: `Solo la parte ${parte} puede firmar aquí.` });
    }

    if (yaFirmo) {
      return res.status(400).json({ error: "Ya firmaste este contrato." });
    }

    const ahora = new Date();
    const ip = obtenerIP(req);
    const data = esSolicitante
      ? { firmadoSolicitante: true, fechaFirmaSolicitante: ahora, ipFirmaSolicitante: ip }
      : { firmadoContraparte: true, fechaFirmaContraparte: ahora, ipFirmaContraparte: ip };
    if (otraFirmo) data.estado = "FIRMADO";

    const actualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data
    });

    await registrarAccion(contratoId, usuarioId, "Contrato firmado", `Firma de la parte ${parte}`);
    await enviarNotificacion(
      esSolicitante ? contrato.contraparteId : contrato.solicitanteId,
      `La parte ${parte} ha firmado el contrato.`
    );

    return res.json({ msg: "Firma registrada", contrato: actualizado });
  } catch (error) {
    console.error("Error firmando contrato:", error);
    return res.status(500).json({ error: "Error interno al firmar." });
  }
}

router.post("/:id/firmar/contraparte", requireAuth, (req, res) => firmar(req, res, "contraparte"));
router.post("/:id/firmar/solicitante", requireAuth, (req, res) => firmar(req, res, "solicitante"));

// GENERAR PDF DEL CONTRATO (pendiente, Etapa 13)
router.get("/:id/pdf", requireAuth, async (req, res) => {
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!contrato) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    if (!esParte(contrato, req.user.id)) {
      return res.status(403).json({ error: "No tienes permiso para este contrato." });
    }

    return res.status(501).json({ error: "Generación de PDF en construcción." });
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "Error interno." });
  }
});

// HISTORIAL
router.get("/:id/historial", requireAuth, async (req, res) => {
  const contratoId = Number(req.params.id);
  const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });

  if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });
  if (!esParte(contrato, req.user.id)) {
    return res.status(403).json({ error: "No tienes permiso para ver este historial." });
  }

  const historial = await prisma.accionHistorial.findMany({
    where: { contratoId },
    orderBy: { fecha: "asc" },
    include: { usuario: { select: { firstName: true, lastName: true, role: true } } }
  });
  res.json(historial);
});

export default router;
