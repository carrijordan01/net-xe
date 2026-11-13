// Documentos adjuntos a un contrato, guardados en server/uploads.
// Ambas partes pueden adjuntar y eliminar los suyos mientras nadie haya
// firmado; desde la primera firma quedan fijos (la huella firmada los incluye).
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";
import { notificarEvento } from "../notificaciones.js";
import { esParte, registrarAccion, tieneFirmas } from "../reglasContrato.js";

// Montado en /api/contratos/:id/documentos
const router = express.Router({ mergeParams: true });

// CARPETA_DOCUMENTOS en el entorno la cambia (las pruebas usan una carpeta temporal)
export const CARPETA_DOCUMENTOS =
  process.env.CARPETA_DOCUMENTOS || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads/documentos");
export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_POR_CONTRATO = 10;

// Tipos admitidos. Se valida el contenido real (firma de bytes), no solo la extensión.
const TIPOS = {
  ".pdf": { mime: "application/pdf", firma: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ".png": { mime: "image/png", firma: [0x89, 0x50, 0x4e, 0x47] },
  ".jpg": { mime: "image/jpeg", firma: [0xff, 0xd8, 0xff] },
  ".jpeg": { mime: "image/jpeg", firma: [0xff, 0xd8, 0xff] },
  // Los documentos de Office modernos son archivos ZIP
  ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", firma: [0x50, 0x4b, 0x03, 0x04] },
  ".xlsx": { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", firma: [0x50, 0x4b, 0x03, 0x04] }
};

// El archivo se recibe en memoria (máx. 10 MB) para validarlo antes de escribirlo
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 5 }
}).single("archivo");

function recibirArchivo(req, res, next) {
  subida(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "El archivo supera el máximo de 10 MB." });
    if (err instanceof multer.MulterError) return res.status(400).json({ error: "No se pudo recibir el archivo." });
    next(err);
  });
}

// Nombre original seguro para mostrar y para la descarga
function limpiarNombre(nombre) {
  // Multer entrega el nombre en latin1; se recupera en UTF-8 (tildes, ñ)
  const utf8 = Buffer.from(nombre, "latin1").toString("utf8");
  const limpio = utf8.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").trim().slice(0, 150);
  return limpio || "documento";
}

const seleccionPublica = {
  id: true,
  nombre: true,
  descripcion: true,
  mimeType: true,
  tamano: true,
  hash: true,
  fecha: true,
  usuarioId: true,
  usuario: { select: { id: true, firstName: true, lastName: true } }
};

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

// Motivo por el que no se pueden agregar o quitar documentos, o null
function motivoDocumentosFijos(contrato) {
  if (["ELIMINADO", "RECHAZADO"].includes(contrato.estado)) return "Este contrato ya no admite cambios en sus documentos.";
  if (tieneFirmas(contrato)) return "El contrato ya tiene firmas: sus documentos no se pueden modificar.";
  return null;
}

// Listar documentos
router.get("/", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;

  const documentos = await prisma.documentoContrato.findMany({
    where: { contratoId: contrato.id },
    orderBy: { fecha: "asc" },
    select: seleccionPublica
  });
  res.json({ documentos, editables: !motivoDocumentosFijos(contrato), maximo: MAX_POR_CONTRATO, maxBytes: MAX_BYTES });
});

// Adjuntar un documento: multipart con «archivo» y «descripcion» opcional
router.post("/", requireAuth, recibirArchivo, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;

  const motivo = motivoDocumentosFijos(contrato);
  if (motivo) return res.status(409).json({ error: motivo });
  if (!req.file) return res.status(400).json({ error: "Selecciona un archivo." });

  const cantidad = await prisma.documentoContrato.count({ where: { contratoId: contrato.id } });
  if (cantidad >= MAX_POR_CONTRATO) {
    return res.status(409).json({ error: `El contrato ya tiene el máximo de ${MAX_POR_CONTRATO} documentos.` });
  }

  const nombre = limpiarNombre(req.file.originalname);
  const extension = path.extname(nombre).toLowerCase();
  const tipo = TIPOS[extension];
  const contenido = req.file.buffer;
  if (!tipo) return res.status(415).json({ error: "Tipo de archivo no permitido. Usa PDF, JPG, PNG, DOCX o XLSX." });
  if (contenido.length === 0) return res.status(400).json({ error: "El archivo está vacío." });
  if (!tipo.firma.every((byte, i) => contenido[i] === byte)) {
    return res.status(415).json({ error: "El contenido del archivo no corresponde a su extensión." });
  }

  const descripcion = typeof req.body.descripcion === "string" ? req.body.descripcion.trim().slice(0, 200) : "";
  const hash = crypto.createHash("sha256").update(contenido).digest("hex");
  const archivo = `${crypto.randomUUID()}${extension}`;

  await fs.mkdir(CARPETA_DOCUMENTOS, { recursive: true });
  await fs.writeFile(path.join(CARPETA_DOCUMENTOS, archivo), contenido, { flag: "wx" });

  let documento;
  try {
    documento = await prisma.documentoContrato.create({
      data: {
        contratoId: contrato.id,
        usuarioId: req.user.id,
        nombre,
        descripcion: descripcion || null,
        archivo,
        mimeType: tipo.mime,
        tamano: contenido.length,
        hash
      },
      select: seleccionPublica
    });
  } catch (err) {
    await fs.rm(path.join(CARPETA_DOCUMENTOS, archivo), { force: true });
    throw err;
  }

  await registrarAccion(contrato.id, req.user.id, "Documento adjuntado", `${nombre} (SHA-256: ${hash})`);
  await notificarEvento({
    destinatarioId: contrato.solicitanteId === req.user.id ? contrato.contraparteId : contrato.solicitanteId,
    actorId: req.user.id,
    tipo: "DOCUMENTO_ADJUNTO",
    contrato,
    accion: `adjuntó «${nombre}» a`
  });

  res.status(201).json(documento);
});

// Descargar o ver un documento (?ver=1 lo muestra en el navegador si es PDF o imagen)
router.get("/:docId", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;

  const documento = await prisma.documentoContrato.findFirst({
    where: { id: Number(req.params.docId), contratoId: contrato.id }
  });
  if (!documento) return res.status(404).json({ error: "Documento no encontrado." });

  const ruta = path.join(CARPETA_DOCUMENTOS, documento.archivo);
  try {
    await fs.access(ruta);
  } catch {
    return res.status(410).json({ error: "El archivo ya no está disponible en el servidor." });
  }

  const enLinea = req.query.ver && /^(application\/pdf|image\/)/.test(documento.mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", documento.mimeType);
  res.setHeader(
    "Content-Disposition",
    `${enLinea ? "inline" : "attachment"}; filename="${documento.nombre.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(documento.nombre)}`
  );
  res.sendFile(ruta);
});

// Eliminar un documento propio (antes de cualquier firma)
router.delete("/:docId", requireAuth, async (req, res) => {
  const contrato = await cargarContrato(req, res);
  if (!contrato) return;

  const documento = await prisma.documentoContrato.findFirst({
    where: { id: Number(req.params.docId), contratoId: contrato.id }
  });
  if (!documento) return res.status(404).json({ error: "Documento no encontrado." });
  if (documento.usuarioId !== req.user.id) {
    return res.status(403).json({ error: "Solo quien adjuntó el documento puede eliminarlo." });
  }
  const motivo = motivoDocumentosFijos(contrato);
  if (motivo) return res.status(409).json({ error: motivo });

  await prisma.documentoContrato.delete({ where: { id: documento.id } });
  await fs.rm(path.join(CARPETA_DOCUMENTOS, documento.archivo), { force: true });
  await registrarAccion(contrato.id, req.user.id, "Documento eliminado", documento.nombre);

  res.json({ msg: "Documento eliminado." });
});

export default router;
