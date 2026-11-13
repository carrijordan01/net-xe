// Solicitudes para editar o eliminar contratos que ya tienen firmas.
// El solicitante del contrato las crea; la contraparte las aprueba o rechaza.
import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";
import { describirCambios, validarContrato } from "../catalogo/plantillas.js";
import { notificarEvento } from "../notificaciones.js";
import {
  FIRMAS_REINICIADAS, esParte, registrarAccion, solicitudPendiente, tieneFirmas, usuarioPublico
} from "../reglasContrato.js";

// Montado en /api/contratos/:id/solicitudes
const router = express.Router({ mergeParams: true });

const TEXTO_TIPO = { EDICION: "edición", ELIMINACION: "eliminación" };

async function cargarContrato(req, res) {
  const contrato = await prisma.contrato.findUnique({ where: { id: Number(req.params.id) } });
  if (!contrato) {
    res.status(404).json({ error: "Contrato no encontrado." });
    return null;
  }
  if (!esParte(contrato, req.user.id)) {
    res.status(403).json({ error: "No tienes permiso para este contrato." });
    return null;
  }
  return contrato;
}

async function cargarSolicitud(req, res, contrato) {
  const solicitud = await prisma.solicitudCambio.findFirst({
    where: { id: Number(req.params.sid), contratoId: contrato.id }
  });
  if (!solicitud) {
    res.status(404).json({ error: "Solicitud no encontrada." });
    return null;
  }
  if (solicitud.estado !== "PENDIENTE") {
    res.status(400).json({ error: "Esta solicitud ya fue respondida o cancelada." });
    return null;
  }
  return solicitud;
}

// Listar las solicitudes del contrato (ambas partes)
router.get("/", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;

  const solicitudes = await prisma.solicitudCambio.findMany({
    where: { contratoId: contrato.id },
    orderBy: { createdAt: "desc" },
    include: { autor: usuarioPublico }
  });
  res.json(solicitudes);
});

// Crear una solicitud: { tipo: "EDICION" | "ELIMINACION", motivo, datos?, modalidad?, fechaTermino? }
router.post("/", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;

  if (contrato.solicitanteId !== req.user.id) {
    return res.status(403).json({ error: "Solo el solicitante del contrato puede pedir cambios." });
  }
  if (!["ACEPTADO", "FIRMADO"].includes(contrato.estado) || !tieneFirmas(contrato)) {
    return res.status(400).json({
      error: "Solo se solicitan cambios en contratos con firmas. Si nadie ha firmado, puedes editarlo o eliminarlo directamente."
    });
  }
  if (await solicitudPendiente(contrato.id)) {
    return res.status(409).json({ error: "Ya hay una solicitud pendiente para este contrato." });
  }

  const { tipo } = req.body;
  const motivo = typeof req.body.motivo === "string" ? req.body.motivo.trim().slice(0, 1000) : "";
  if (!TEXTO_TIPO[tipo]) return res.status(400).json({ error: "Tipo de solicitud inválido." });
  if (!motivo) return res.status(400).json({ error: "Explica el motivo de la solicitud.", errores: { motivo: "Este dato es obligatorio." } });

  let propuesta = null;
  let cambios = [];
  if (tipo === "EDICION") {
    const fechaGuardada = contrato.fechaTermino?.toISOString().slice(0, 10) ?? null;
    const validacion = validarContrato({
      tipo: contrato.tipo,
      datos: req.body.datos ?? contrato.datos,
      modalidad: req.body.modalidad !== undefined ? req.body.modalidad : contrato.modalidad,
      fechaTermino: req.body.fechaTermino !== undefined ? req.body.fechaTermino : fechaGuardada
    });
    if (Object.keys(validacion.errores).length > 0) {
      return res.status(400).json({ error: "Revisa los datos propuestos.", errores: validacion.errores });
    }
    cambios = describirCambios(contrato.tipo, contrato, validacion);
    if (cambios.length === 0) {
      return res.status(400).json({ error: "La versión propuesta no tiene cambios respecto de la actual." });
    }
    propuesta = {
      datos: validacion.datos,
      modalidad: validacion.modalidad,
      fechaTermino: validacion.fechaTermino?.toISOString().slice(0, 10) ?? null
    };
  }

  const solicitud = await prisma.solicitudCambio.create({
    data: { contratoId: contrato.id, autorId: req.user.id, tipo, motivo, propuesta, cambios },
    include: { autor: usuarioPublico }
  });

  await registrarAccion(
    contrato.id,
    req.user.id,
    `Solicitud de ${TEXTO_TIPO[tipo]} enviada`,
    `Motivo: ${motivo.replace(/[.\s]+$/, "")}.${cambios.length ? ` Cambios propuestos: ${cambios.join(", ")}.` : ""}`
  );
  await notificarEvento({
    destinatarioId: contrato.contraparteId,
    actorId: req.user.id,
    tipo: "SOLICITUD_CAMBIO",
    contrato,
    accion: tipo === "EDICION" ? "solicita editar" : "solicita eliminar",
    detalle: "Revisa la solicitud para aprobarla o rechazarla."
  });

  res.status(201).json(solicitud);
});

// Aprobar (la contraparte). En una edición se aplica la versión propuesta y se
// reinician las firmas; en una eliminación el contrato pasa a ELIMINADO.
router.post("/:sid/aprobar", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;
  if (contrato.contraparteId !== req.user.id) {
    return res.status(403).json({ error: "Solo la contraparte puede responder la solicitud." });
  }
  const solicitud = await cargarSolicitud(req, res, contrato);
  if (!solicitud) return;

  let datosContrato;
  if (solicitud.tipo === "EDICION") {
    // Se vuelve a validar por si el catálogo cambió desde que se creó la solicitud
    const validacion = validarContrato({ tipo: contrato.tipo, ...solicitud.propuesta });
    if (Object.keys(validacion.errores).length > 0) {
      return res.status(409).json({ error: "La versión propuesta ya no es válida. El solicitante debe crear una nueva solicitud." });
    }
    datosContrato = {
      datos: validacion.datos,
      modalidad: validacion.modalidad,
      fechaTermino: validacion.fechaTermino,
      estado: "ACEPTADO",
      ...FIRMAS_REINICIADAS
    };
  } else {
    datosContrato = { estado: "ELIMINADO" };
  }

  // La solicitud se marca solo si sigue pendiente, para no aplicarla dos veces
  const [marcada] = await prisma.$transaction([
    prisma.solicitudCambio.updateMany({
      where: { id: solicitud.id, estado: "PENDIENTE" },
      data: { estado: "APROBADA", respondidaAt: new Date() }
    }),
    prisma.contrato.update({ where: { id: contrato.id }, data: datosContrato })
  ]);
  if (marcada.count === 0) return res.status(409).json({ error: "La solicitud cambió mientras respondías. Recarga la página." });

  const esEdicion = solicitud.tipo === "EDICION";
  await registrarAccion(
    contrato.id,
    req.user.id,
    `Solicitud de ${TEXTO_TIPO[solicitud.tipo]} aprobada`,
    esEdicion ? `Se aplicaron los cambios: ${solicitud.cambios.join(", ")}. Las firmas anteriores quedaron sin efecto.` : "El contrato quedó eliminado."
  );
  await notificarEvento({
    destinatarioId: contrato.solicitanteId,
    actorId: req.user.id,
    tipo: "SOLICITUD_RESPONDIDA",
    contrato,
    accion: esEdicion ? "aprobó la edición de" : "aprobó la eliminación de",
    detalle: esEdicion ? "Ambas partes deben volver a firmarlo." : undefined
  });

  const actualizado = await prisma.contrato.findUnique({ where: { id: contrato.id } });
  res.json({ msg: "Solicitud aprobada.", contrato: actualizado });
});

// Rechazar (la contraparte): { respuesta? }
router.post("/:sid/rechazar", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;
  if (contrato.contraparteId !== req.user.id) {
    return res.status(403).json({ error: "Solo la contraparte puede responder la solicitud." });
  }
  const solicitud = await cargarSolicitud(req, res, contrato);
  if (!solicitud) return;

  const respuesta = typeof req.body.respuesta === "string" ? req.body.respuesta.trim().slice(0, 1000) : "";
  await prisma.solicitudCambio.update({
    where: { id: solicitud.id },
    data: { estado: "RECHAZADA", respuesta: respuesta || null, respondidaAt: new Date() }
  });

  await registrarAccion(
    contrato.id,
    req.user.id,
    `Solicitud de ${TEXTO_TIPO[solicitud.tipo]} rechazada`,
    respuesta ? `Respuesta: ${respuesta}` : null
  );
  await notificarEvento({
    destinatarioId: contrato.solicitanteId,
    actorId: req.user.id,
    tipo: "SOLICITUD_RESPONDIDA",
    contrato,
    accion: `rechazó tu solicitud de ${TEXTO_TIPO[solicitud.tipo]} de`,
    detalle: respuesta ? `Respuesta: ${respuesta}` : undefined
  });

  res.json({ msg: "Solicitud rechazada." });
});

// Cancelar (el solicitante que la creó)
router.post("/:sid/cancelar", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;
  const solicitud = await cargarSolicitud(req, res, contrato);
  if (!solicitud) return;
  if (solicitud.autorId !== req.user.id) {
    return res.status(403).json({ error: "Solo quien creó la solicitud puede cancelarla." });
  }

  await prisma.solicitudCambio.update({
    where: { id: solicitud.id },
    data: { estado: "CANCELADA", respondidaAt: new Date() }
  });
  await registrarAccion(contrato.id, req.user.id, `Solicitud de ${TEXTO_TIPO[solicitud.tipo]} cancelada`);

  res.json({ msg: "Solicitud cancelada." });
});

export default router;
