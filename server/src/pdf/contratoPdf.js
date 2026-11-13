// Genera el PDF de un contrato con pdfkit. Usa las fuentes estándar de PDF
// (Helvetica, codificación WinAnsi): admiten tildes, ñ, «» y ·, pero no
// símbolos como ✓ o →, por eso no se usan en el texto.
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { CAMPOS_COMUNES, MODALIDADES, nombreContrato, obtenerPlantilla } from "../catalogo/plantillas.js";

const LOGO = fileURLToPath(new URL("../../assets/net-xe.png", import.meta.url));

const COLOR = { azul: "#1e3a8a", verde: "#16a34a", texto: "#1f2937", gris: "#6b7280", linea: "#d1d5db", rojo: "#dc2626" };
const MARGEN = 50;

const ESTADOS = {
  PENDIENTE: "Pendiente de revisión",
  ACEPTADO: "Aceptado, por firmar",
  FIRMADO: "Firmado por ambas partes",
  RECHAZADO: "Rechazado",
  ELIMINADO: "Eliminado"
};

const MARCA_AGUA = {
  PENDIENTE: "BORRADOR - SIN FIRMAS",
  ACEPTADO: "BORRADOR - FIRMAS PENDIENTES",
  RECHAZADO: "RECHAZADO",
  ELIMINADO: "ELIMINADO"
};

// ---------- Formato de valores (equivalente a client/src/utils/formato.js) ----------

const pesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

// Fechas de calendario guardadas como medianoche UTC: sin zona horaria
function fecha(valor) {
  if (!valor) return "";
  const texto = valor instanceof Date ? valor.toISOString() : String(valor);
  const [a, m, d] = texto.slice(0, 10).split("-");
  return `${d}-${m}-${a}`;
}

// Instantes (creación, firmas): hora de Chile
function fechaHora(valor) {
  if (!valor) return "";
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(valor)).map((p) => [p.type, p.value])
  );
  return `${partes.day}-${partes.month}-${partes.year} ${partes.hour}:${partes.minute}`;
}

function valorCampo(campo, valor) {
  if (valor === undefined || valor === null || valor === "") return "-";
  switch (campo.tipo) {
    case "moneda":
      return pesos.format(Number(valor));
    case "porcentaje":
      return `${valor}%`;
    case "fecha":
      return fecha(valor);
    case "siNo":
      return valor === true ? "Sí" : "No";
    default:
      return String(valor);
  }
}

const nombre = (u) => `${u.firstName} ${u.lastName}`;

// ---------- Ayudantes de maquetación ----------

function anchoUtil(doc) {
  return doc.page.width - MARGEN * 2;
}

function asegurarEspacio(doc, alto) {
  if (doc.y + alto > doc.page.height - MARGEN - 30) doc.addPage();
}

function tituloSeccion(doc, texto) {
  // Espacio para el título y al menos una línea de contenido (evita títulos huérfanos)
  asegurarEspacio(doc, 90);
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(COLOR.azul).text(texto.toUpperCase(), MARGEN, doc.y, { characterSpacing: 0.5 });
  const y = doc.y + 2;
  doc.moveTo(MARGEN, y).lineTo(MARGEN + anchoUtil(doc), y).lineWidth(1).strokeColor(COLOR.verde).stroke();
  doc.moveDown(0.6);
}

// Etiqueta a la izquierda y valor a la derecha; los textos largos van debajo
function dato(doc, etiqueta, valor, { largo = false } = {}) {
  const ancho = anchoUtil(doc);
  const anchoEtiqueta = 170;
  doc.fontSize(10);
  if (largo) {
    asegurarEspacio(doc, 40);
    doc.font("Helvetica-Bold").fillColor(COLOR.gris).text(etiqueta, MARGEN, doc.y, { width: ancho });
    doc.font("Helvetica").fillColor(COLOR.texto).text(valor, MARGEN, doc.y, { width: ancho });
    doc.moveDown(0.5);
    return;
  }
  const altoValor = doc.font("Helvetica").heightOfString(valor, { width: ancho - anchoEtiqueta });
  asegurarEspacio(doc, altoValor + 6);
  const y = doc.y;
  doc.font("Helvetica-Bold").fillColor(COLOR.gris).text(etiqueta, MARGEN, y, { width: anchoEtiqueta - 10 });
  const yEtiqueta = doc.y;
  doc.font("Helvetica").fillColor(COLOR.texto).text(valor, MARGEN + anchoEtiqueta, y, { width: ancho - anchoEtiqueta });
  doc.y = Math.max(doc.y, yEtiqueta) + 4;
}

function parrafo(doc, texto, opciones = {}) {
  doc.font("Helvetica").fontSize(10).fillColor(opciones.color ?? COLOR.texto)
    .text(texto, MARGEN, doc.y, { width: anchoUtil(doc), align: "justify", lineGap: 2 });
  doc.moveDown(0.5);
}

// ---------- Documento ----------

/**
 * @param {object} p
 * @param {object} p.contrato       con solicitante y contraparte (firstName, lastName, email)
 * @param {Array}  p.documentos     adjuntos { nombre, descripcion, hash, tamano, fecha, usuario }
 * @param {Array}  p.historial      acciones { evento, comentario, fecha, usuario }
 * @param {string} p.huellaActual   hashContenido del contrato
 * @returns {Promise<Buffer>}
 */
export function generarPdfContrato({ contrato, documentos, historial, huellaActual }) {
  const plantilla = obtenerPlantilla(contrato.tipo);
  const titulo = nombreContrato(contrato);
  const datos = contrato.datos ?? {};

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGEN, bottom: MARGEN, left: MARGEN, right: MARGEN },
    bufferPages: true,
    info: {
      Title: `${titulo} (contrato N° ${contrato.id})`,
      Author: "Net-Xe",
      Subject: plantilla?.nombre ?? contrato.tipo,
      Creator: "Net-Xe"
    }
  });

  const partes = [];
  doc.on("data", (c) => partes.push(c));
  const terminado = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);
  });

  // Encabezado
  doc.image(LOGO, MARGEN, MARGEN, { height: 34 });
  doc.font("Helvetica").fontSize(9).fillColor(COLOR.gris)
    .text(`Contrato N° ${contrato.id}`, MARGEN, MARGEN + 4, { width: anchoUtil(doc), align: "right" })
    .text(`Emitido el ${fechaHora(new Date())}`, { width: anchoUtil(doc), align: "right" });
  doc.y = MARGEN + 50;

  doc.font("Helvetica-Bold").fontSize(18).fillColor(COLOR.azul).text(titulo, MARGEN, doc.y, { width: anchoUtil(doc) });
  if (titulo !== plantilla?.nombre && plantilla) {
    doc.font("Helvetica").fontSize(11).fillColor(COLOR.gris).text(plantilla.nombre);
  }
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(10)
    .fillColor(contrato.estado === "FIRMADO" ? COLOR.verde : ["RECHAZADO", "ELIMINADO"].includes(contrato.estado) ? COLOR.rojo : COLOR.gris)
    .text(`Estado: ${ESTADOS[contrato.estado]}`);
  doc.moveDown(0.8);

  // Comparecencia
  const s = contrato.solicitante;
  const c = contrato.contraparte;
  const idSolicitante = [datos.rutSolicitante && `RUT ${datos.rutSolicitante}`, datos.domicilioSolicitante && `con domicilio en ${datos.domicilioSolicitante}`].filter(Boolean).join(", ");
  const idContraparte = [datos.rutContraparte && `RUT ${datos.rutContraparte}`, datos.domicilioContraparte && `con domicilio en ${datos.domicilioContraparte}`].filter(Boolean).join(", ");
  parrafo(
    doc,
    `En ${datos.ciudad ?? "-"}, con fecha de inicio ${fecha(datos.fechaInicio) || "-"}, entre ${nombre(s)} (${s.email})` +
      `${idSolicitante ? `, ${idSolicitante}` : ""}, en adelante «el Solicitante», y ${nombre(c)} (${c.email})` +
      `${idContraparte ? `, ${idContraparte}` : ""}, en adelante «la Contraparte», se acuerda el presente ` +
      `${(plantilla?.nombre ?? "contrato").toLowerCase()} conforme a los datos y condiciones que se detallan a continuación.`
  );

  if (plantilla?.advertencia) {
    asegurarEspacio(doc, 60);
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#92400e")
      .text(`Advertencia: ${plantilla.advertencia}`, MARGEN, doc.y, { width: anchoUtil(doc), align: "justify" });
    doc.moveDown(0.5);
  }

  // Datos por secciones (mismo orden que en la aplicación)
  tituloSeccion(doc, "Datos generales");
  for (const campo of CAMPOS_COMUNES) dato(doc, campo.etiqueta, valorCampo(campo, datos[campo.nombre]));

  if (plantilla) {
    tituloSeccion(doc, "Datos del contrato");
    for (const campo of plantilla.campos) {
      dato(doc, campo.etiqueta, valorCampo(campo, datos[campo.nombre]), { largo: campo.tipo === "textoLargo" });
    }
  }

  tituloSeccion(doc, "Condiciones");
  dato(doc, "Modalidad", MODALIDADES[contrato.modalidad] ?? "-");
  dato(doc, plantilla?.fechaTermino?.etiqueta ?? "Fecha de término", contrato.fechaTermino ? fecha(contrato.fechaTermino) : "Sin fecha de término");

  // Documentos adjuntos
  if (documentos.length > 0) {
    tituloSeccion(doc, "Documentos adjuntos");
    for (const d of documentos) {
      asegurarEspacio(doc, 45);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR.texto).text(d.nombre, MARGEN, doc.y, { width: anchoUtil(doc) });
      doc.font("Helvetica").fontSize(9).fillColor(COLOR.gris)
        .text(`${d.descripcion ? `${d.descripcion} · ` : ""}Adjuntado por ${nombre(d.usuario)} el ${fechaHora(d.fecha)}`, { width: anchoUtil(doc) })
        .text(`SHA-256: ${d.hash}`, { width: anchoUtil(doc) });
      doc.moveDown(0.4);
    }
  }

  // Firmas
  tituloSeccion(doc, "Firmas");
  const firmas = [
    ["Solicitante", s, contrato.firmadoSolicitante, contrato.fechaFirmaSolicitante, contrato.ipFirmaSolicitante, contrato.firmaSolicitanteHash],
    ["Contraparte", c, contrato.firmadoContraparte, contrato.fechaFirmaContraparte, contrato.ipFirmaContraparte, contrato.firmaContraparteHash]
  ];
  for (const [rol, u, firmado, fechaFirma, ip, huella] of firmas) {
    asegurarEspacio(doc, 70);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR.texto).text(`${rol}: ${nombre(u)}`, MARGEN, doc.y, { width: anchoUtil(doc) });
    doc.font("Helvetica").fontSize(9);
    if (!firmado) {
      doc.fillColor(COLOR.gris).text("Aún no firma.");
    } else {
      doc.fillColor(COLOR.texto).text(`Firmó el ${fechaHora(fechaFirma)}${ip ? ` desde la IP ${ip}` : ""}.`);
      if (huella) {
        doc.fillColor(COLOR.gris).text(`Huella SHA-256 del contenido firmado: ${huella}`, { width: anchoUtil(doc) });
        const integra = huella === huellaActual;
        doc.fillColor(integra ? COLOR.verde : COLOR.rojo)
          .text(integra ? "El contenido actual coincide con lo firmado." : "ATENCIÓN: el contenido actual NO coincide con lo firmado.");
      }
    }
    doc.moveDown(0.6);
  }
  asegurarEspacio(doc, 40);
  doc.font("Helvetica").fontSize(8).fillColor(COLOR.gris).text(
    `Huella SHA-256 del contenido actual: ${huellaActual}. Firma electrónica simple con trazabilidad: cada firma ` +
      "exigió la aceptación expresa del contenido, la contraseña y el PIN de firma de la parte.",
    MARGEN, doc.y, { width: anchoUtil(doc), align: "justify" }
  );

  // Anexo: registro de actividad
  if (historial.length > 0) {
    tituloSeccion(doc, "Registro de actividad");
    for (const a of historial) {
      const texto = `${fechaHora(a.fecha)} · ${a.evento} · ${nombre(a.usuario)}`;
      asegurarEspacio(doc, 30);
      doc.font("Helvetica").fontSize(9).fillColor(COLOR.texto).text(texto, MARGEN, doc.y, { width: anchoUtil(doc) });
      if (a.comentario) doc.fillColor(COLOR.gris).text(a.comentario, MARGEN + 10, doc.y, { width: anchoUtil(doc) - 10 });
      doc.moveDown(0.3);
    }
  }

  // Pie de página, numeración y marca de agua en cada página
  const marca = MARCA_AGUA[contrato.estado];
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    const { width, height } = doc.page;
    // Sin margen inferior mientras se dibuja el pie; si no, pdfkit agregaría una página
    const margenInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    if (marca) {
      // Tamaño ajustado para que la marca quepa en la diagonal de la página
      const diagonal = Math.hypot(width, height);
      doc.font("Helvetica-Bold").fontSize(100);
      const tamano = Math.min(56, (100 * diagonal * 0.6) / doc.widthOfString(marca));
      doc.save();
      doc.rotate(-Math.atan2(height, width) * (180 / Math.PI), { origin: [width / 2, height / 2] });
      doc.fontSize(tamano).fillColor(COLOR.rojo).fillOpacity(0.1)
        .text(marca, width / 2 - diagonal / 2, height / 2 - tamano / 2, { width: diagonal, align: "center", lineBreak: false });
      doc.restore();
    }

    const yPie = height - MARGEN + 10;
    doc.moveTo(MARGEN, yPie - 6).lineTo(width - MARGEN, yPie - 6).lineWidth(0.5).strokeColor(COLOR.linea).stroke();
    doc.font("Helvetica").fontSize(7.5).fillColor(COLOR.gris).fillOpacity(1)
      .text(
        "Generado por Net-Xe. Firma electrónica simple (Ley N° 19.799); no reemplaza la firma electrónica avanzada ni los actos que exigen escritura pública.",
        MARGEN, yPie, { width: width - MARGEN * 2 - 70, lineBreak: true, height: 20 }
      )
      .text(`Página ${i - rango.start + 1} de ${rango.count}`, width - MARGEN - 70, yPie, { width: 70, align: "right", lineBreak: false });
    doc.page.margins.bottom = margenInferior;
  }

  doc.end();
  return terminado;
}
