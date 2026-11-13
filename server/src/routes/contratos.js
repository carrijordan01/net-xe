import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { TIPOS_CONTRATO, describirCambios, nombreContrato, validarContrato } from "../catalogo/plantillas.js";
import { generarPdfContrato } from "../pdf/contratoPdf.js";
import { INCLUIR_DOCUMENTOS, hashContenido, verificarCredencialesFirma } from "../firma.js";
import { notificarEvento } from "../notificaciones.js";
import { hayBloqueo } from "../bloqueos.js";
import {
  esParte, motivoNoModificable, registrarAccion, solicitudPendiente, usuarioPublico
} from "../reglasContrato.js";

const router = express.Router();

const ESTADOS = ["PENDIENTE", "ACEPTADO", "RECHAZADO", "FIRMADO", "ELIMINADO"];

// Contratos que le corresponden al usuario según su rol
function filtroPorRol(usuario) {
  return usuario.role === "CONTRAPARTE" ? { contraparteId: usuario.id } : { solicitanteId: usuario.id };
}

function obtenerIP(req) {
  return req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress;
}

// CREAR CONTRATO
router.post("/", requireAuth, requireRole(["SOLICITANTE"]), async (req, res) => {
  try {
    const { tipo } = req.body;
    const contraparteId = Number(req.body.contraparteId);

    if (!tipo || !contraparteId) {
      return res.status(400).json({ error: "Faltan datos del contrato." });
    }

    const validacion = validarContrato(req.body);
    if (Object.keys(validacion.errores).length > 0) {
      return res.status(400).json({ error: "Revisa los datos del contrato.", errores: validacion.errores });
    }

    const contraparte = await prisma.user.findUnique({ where: { id: contraparteId } });
    if (!contraparte || contraparte.role !== "CONTRAPARTE") {
      return res.status(400).json({ error: "La contraparte indicada no es válida." });
    }
    if (await hayBloqueo(req.user.id, contraparteId)) {
      return res.status(403).json({ error: "No puedes ofrecer contratos a este usuario." });
    }

    const solicitanteId = req.user.id;

    const contrato = await prisma.contrato.create({
      data: {
        tipo,
        solicitanteId,
        contraparteId,
        datos: validacion.datos,
        modalidad: validacion.modalidad,
        fechaTermino: validacion.fechaTermino
      }
    });

    await registrarAccion(contrato.id, solicitanteId, "Contrato creado");
    await notificarEvento({
      destinatarioId: contrato.contraparteId,
      actorId: solicitanteId,
      tipo: "CONTRATO_RECIBIDO",
      contrato,
      accion: "te ofreció",
      detalle: "Revísalo para aceptarlo o rechazarlo."
    });

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
// ?estado=PENDIENTE,ACEPTADO  ?tipo=INDEFINIDO  ?limite=6  ?orden=asc
router.get("/buscar", requireAuth, async (req, res) => {
  const { tipo, estado, limite, orden } = req.query;
  const where = filtroPorRol(req.user);

  if (tipo && tipo !== "TODOS") {
    if (!TIPOS_CONTRATO.includes(tipo)) return res.status(400).json({ error: "Tipo de contrato inválido." });
    where.tipo = tipo;
  }

  if (estado && estado !== "TODOS") {
    const estados = String(estado).split(",");
    if (!estados.every((e) => ESTADOS.includes(e))) return res.status(400).json({ error: "Estado inválido." });
    where.estado = { in: estados };
  } else {
    where.estado = { not: "ELIMINADO" };
  }

  const take = limite ? Math.min(Math.max(Number.parseInt(limite, 10) || 1, 1), 100) : undefined;

  const contratos = await prisma.contrato.findMany({
    where,
    take,
    orderBy: { createdAt: orden === "asc" ? "asc" : "desc" },
    include: { solicitante: usuarioPublico, contraparte: usuarioPublico }
  });

  res.json(contratos);
});

// Cantidad de contratos del usuario por estado
router.get("/resumen", requireAuth, async (req, res) => {
  const grupos = await prisma.contrato.groupBy({
    by: ["estado"],
    where: filtroPorRol(req.user),
    _count: { _all: true }
  });

  const resumen = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
  for (const g of grupos) resumen[g.estado] = g._count._all;
  res.json(resumen);
});

// VER DETALLE DE CONTRATO
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id: Number(req.params.id) },
      include: { solicitante: usuarioPublico, contraparte: usuarioPublico, ...INCLUIR_DOCUMENTOS }
    });

    if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

    if (!esParte(contrato, req.user.id)) {
      return res.status(403).json({ error: "No tienes permiso para ver este contrato." });
    }

    // Huella del contenido actual, para comprobar que coincide con lo firmado
    const { documentos, ...datosContrato } = contrato;
    res.json({ ...datosContrato, cantidadDocumentos: documentos.length, hashContenido: hashContenido(contrato) });
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

    const motivo = motivoNoModificable(contrato);
    if (motivo) return res.status(403).json({ error: motivo });

    // El tipo de contrato no cambia al editar. Se valida el contrato completo
    // resultante: lo enviado reemplaza a lo guardado.
    const fechaGuardada = contrato.fechaTermino?.toISOString().slice(0, 10) ?? null;
    const validacion = validarContrato({
      tipo: contrato.tipo,
      datos: req.body.datos ?? contrato.datos,
      modalidad: req.body.modalidad !== undefined ? req.body.modalidad : contrato.modalidad,
      fechaTermino: req.body.fechaTermino !== undefined ? req.body.fechaTermino : fechaGuardada
    });
    if (Object.keys(validacion.errores).length > 0) {
      return res.status(400).json({ error: "Revisa los datos del contrato.", errores: validacion.errores });
    }

    const cambios = describirCambios(contrato.tipo, contrato, validacion);
    if (cambios.length === 0) {
      return res.json({ msg: "No hubo cambios.", contrato, cambios });
    }

    // Si la contraparte ya lo había aceptado, debe revisar la nueva versión
    const vuelveARevision = contrato.estado === "ACEPTADO";

    const contratoActualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        datos: validacion.datos,
        modalidad: validacion.modalidad,
        fechaTermino: validacion.fechaTermino,
        ...(vuelveARevision && { estado: "PENDIENTE" })
      }
    });

    await registrarAccion(
      contratoId,
      req.user.id,
      "Contrato editado",
      `Se modificó: ${cambios.join(", ")}.${vuelveARevision ? " Vuelve a revisión de la contraparte." : ""}`
    );
    await notificarEvento({
      destinatarioId: contrato.contraparteId,
      actorId: req.user.id,
      tipo: "CONTRATO_EDITADO",
      contrato: contratoActualizado,
      accion: "modificó",
      detalle: vuelveARevision ? "Debes revisarlo y aceptarlo nuevamente." : `Cambios: ${cambios.join(", ")}.`
    });

    return res.json({
      msg: "Contrato actualizado correctamente",
      contrato: contratoActualizado,
      cambios
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

    const motivo = motivoNoModificable(contrato);
    if (motivo) return res.status(contrato.estado === "ELIMINADO" ? 400 : 403).json({ error: motivo });

    await prisma.contrato.update({
      where: { id: contratoId },
      data: { estado: "ELIMINADO" }
    });

    await registrarAccion(contratoId, req.user.id, "Contrato eliminado");
    await notificarEvento({
      destinatarioId: contrato.contraparteId,
      actorId: req.user.id,
      tipo: "CONTRATO_ELIMINADO",
      contrato,
      accion: "eliminó"
    });

    res.json({ message: "Contrato eliminado correctamente." });
  } catch (err) {
    console.error("Error eliminando contrato:", err);
    res.status(500).json({ error: "Error al eliminar contrato." });
  }
});

// ACEPTAR CONTRATO (la contraparte, mientras está pendiente)
router.post("/:id/aceptar", requireAuth, async (req, res) => {
  const contratoId = Number(req.params.id);
  const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });
  if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

  if (contrato.contraparteId !== req.user.id) {
    return res.status(403).json({ error: "Solo la contraparte puede aceptar el contrato." });
  }
  if (contrato.estado !== "PENDIENTE") {
    return res.status(400).json({ error: "Solo se puede aceptar un contrato pendiente de revisión." });
  }

  const actualizado = await prisma.contrato.update({ where: { id: contratoId }, data: { estado: "ACEPTADO" } });
  await registrarAccion(contratoId, req.user.id, "Contrato aceptado");
  await notificarEvento({
    destinatarioId: contrato.solicitanteId,
    actorId: req.user.id,
    tipo: "CONTRATO_ACEPTADO",
    contrato,
    accion: "aceptó",
    detalle: "Ya pueden firmarlo."
  });

  res.json({ msg: "Contrato aceptado.", contrato: actualizado });
});

// RECHAZAR CONTRATO (la contraparte, antes de que nadie firme)
router.post("/:id/rechazar", requireAuth, async (req, res) => {
  const contratoId = Number(req.params.id);
  const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });
  if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });

  if (contrato.contraparteId !== req.user.id) {
    return res.status(403).json({ error: "Solo la contraparte puede rechazar el contrato." });
  }
  if (!["PENDIENTE", "ACEPTADO"].includes(contrato.estado) || contrato.firmadoSolicitante || contrato.firmadoContraparte) {
    return res.status(400).json({ error: "Este contrato ya no se puede rechazar." });
  }

  const motivo = typeof req.body.motivo === "string" ? req.body.motivo.trim().slice(0, 1000) : "";
  const actualizado = await prisma.contrato.update({ where: { id: contratoId }, data: { estado: "RECHAZADO" } });
  await registrarAccion(contratoId, req.user.id, "Contrato rechazado", motivo ? `Motivo: ${motivo}` : null);
  await notificarEvento({
    destinatarioId: contrato.solicitanteId,
    actorId: req.user.id,
    tipo: "CONTRATO_RECHAZADO",
    contrato,
    accion: "rechazó",
    detalle: motivo ? `Motivo: ${motivo}` : undefined
  });

  res.json({ msg: "Contrato rechazado.", contrato: actualizado });
});

// FIRMAR CONTRATO: casilla de aceptación + contraseña + PIN.
// Registra fecha, IP y huella SHA-256 del contenido firmado.
router.post("/:id/firmar", requireAuth, async (req, res) => {
  const contratoId = Number(req.params.id);
  const { acepto, password, pin } = req.body;

  const contrato = await prisma.contrato.findUnique({ where: { id: contratoId }, include: INCLUIR_DOCUMENTOS });
  if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });
  if (!esParte(contrato, req.user.id)) {
    return res.status(403).json({ error: "No eres parte de este contrato." });
  }

  const esSolicitante = contrato.solicitanteId === req.user.id;
  if (contrato.estado !== "ACEPTADO") {
    return res.status(400).json({
      error: contrato.estado === "PENDIENTE"
        ? "La contraparte debe aceptar el contrato antes de firmarlo."
        : "Este contrato no se puede firmar."
    });
  }
  if (esSolicitante ? contrato.firmadoSolicitante : contrato.firmadoContraparte) {
    return res.status(400).json({ error: "Ya firmaste este contrato." });
  }
  if (await solicitudPendiente(contratoId)) {
    return res.status(409).json({ error: "Hay una solicitud de cambio pendiente. Espera su respuesta antes de firmar." });
  }
  if (acepto !== true) {
    return res.status(400).json({ error: "Debes declarar que leíste y aceptas el contenido del contrato." });
  }

  const usuario = await prisma.user.findUnique({ where: { id: req.user.id } });
  const fallo = await verificarCredencialesFirma(usuario, password, pin);
  if (fallo) return res.status(fallo.status).json({ error: fallo.error });

  const ahora = new Date();
  const ip = obtenerIP(req);
  const huella = hashContenido(contrato);
  const otraFirmo = esSolicitante ? contrato.firmadoContraparte : contrato.firmadoSolicitante;

  // La actualización exige que la firma siga pendiente, para evitar firmas duplicadas en paralelo
  const { count } = await prisma.contrato.updateMany({
    where: {
      id: contratoId,
      estado: "ACEPTADO",
      ...(esSolicitante ? { firmadoSolicitante: false } : { firmadoContraparte: false })
    },
    data: {
      ...(esSolicitante
        ? { firmadoSolicitante: true, fechaFirmaSolicitante: ahora, ipFirmaSolicitante: ip, firmaSolicitanteHash: huella }
        : { firmadoContraparte: true, fechaFirmaContraparte: ahora, ipFirmaContraparte: ip, firmaContraparteHash: huella }),
      ...(otraFirmo && { estado: "FIRMADO" })
    }
  });
  if (count === 0) return res.status(409).json({ error: "El contrato cambió mientras firmabas. Recarga la página." });

  const parte = esSolicitante ? "solicitante" : "contraparte";
  await registrarAccion(contratoId, req.user.id, "Contrato firmado", `Firma de la parte ${parte}. Huella SHA-256: ${huella}`);
  await notificarEvento({
    destinatarioId: esSolicitante ? contrato.contraparteId : contrato.solicitanteId,
    actorId: req.user.id,
    tipo: "CONTRATO_FIRMADO",
    contrato,
    accion: "firmó",
    detalle: otraFirmo ? "El contrato quedó firmado por ambas partes." : "Falta tu firma."
  });

  const actualizado = await prisma.contrato.findUnique({ where: { id: contratoId } });
  res.json({ msg: otraFirmo ? "Contrato firmado por ambas partes." : "Firma registrada.", contrato: actualizado, huella });
});

// DESCARGAR EL CONTRATO EN PDF (ambas partes, en cualquier estado; los no
// firmados llevan marca de agua)
router.get("/:id/pdf", requireAuth, async (req, res) => {
  const contratoId = Number(req.params.id);
  if (!Number.isInteger(contratoId)) return res.status(400).json({ error: "Contrato inválido." });

  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
    include: {
      solicitante: usuarioPublico,
      contraparte: usuarioPublico,
      documentos: {
        orderBy: { fecha: "asc" },
        select: { nombre: true, descripcion: true, hash: true, fecha: true, usuario: { select: { firstName: true, lastName: true } } }
      }
    }
  });
  if (!contrato) return res.status(404).json({ error: "Contrato no encontrado." });
  if (!esParte(contrato, req.user.id)) {
    return res.status(403).json({ error: "No tienes permiso para este contrato." });
  }

  const historial = await prisma.accionHistorial.findMany({
    where: { contratoId },
    orderBy: { fecha: "asc" },
    include: { usuario: { select: { firstName: true, lastName: true } } }
  });

  const pdf = await generarPdfContrato({
    contrato,
    documentos: contrato.documentos,
    historial,
    huellaActual: hashContenido(contrato)
  });

  const archivo = `contrato-${contrato.id}-${nombreContrato(contrato)}`
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${archivo}.pdf"`);
  res.setHeader("Content-Length", pdf.length);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(pdf);
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
