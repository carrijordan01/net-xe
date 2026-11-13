import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../src/db.js";
import { como, contratoAceptado, crearContrato, firmar, registrar } from "../ayudantes.js";

const PDF = Buffer.from("%PDF-1.4\n% documento de prueba\n%%EOF\n");
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("datos")]);

const subir = (u, contratoId, nombre, bytes, descripcion) => {
  const r = como(u).post(`/api/contratos/${contratoId}/documentos`).attach("archivo", bytes, nombre);
  return descripcion ? r.field("descripcion", descripcion) : r;
};
const huella = async (u, contratoId) => (await como(u).get(`/api/contratos/${contratoId}`)).body.hashContenido;
// Descarga binaria: el cuerpo llega como Buffer
const descargar = (u, ruta) => como(u).get(ruta).responseType("blob");

describe("adjuntar", () => {
  test("guarda el archivo con su huella, cambia la huella del contrato y avisa a la otra parte", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);
    const sinDocumentos = await huella(s, contrato.id);

    const r = await subir(s, contrato.id, "Cédula Ñuñoa.pdf", PDF, "Copia de cédula");
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ nombre: "Cédula Ñuñoa.pdf", tamano: PDF.length, descripcion: "Copia de cédula" });
    expect(r.body.hash).toBe(crypto.createHash("sha256").update(PDF).digest("hex"));
    expect(r.body).not.toHaveProperty("archivo");

    const { archivo } = await prisma.documentoContrato.findUnique({ where: { id: r.body.id } });
    expect(fs.existsSync(path.join(process.env.CARPETA_DOCUMENTOS, archivo))).toBe(true);
    expect(await huella(s, contrato.id)).not.toBe(sinDocumentos);

    const aviso = (await como(c).get("/api/notificaciones")).body.notificaciones[0];
    expect(aviso.tipo).toBe("DOCUMENTO_ADJUNTO");
    expect(aviso.mensaje).toMatch(/Cédula Ñuñoa\.pdf/);
  });

  test.each([
    ["falso.png", Buffer.from("esto no es una imagen"), 415],
    ["programa.exe", Buffer.from("MZ..."), 415],
    ["vacio.pdf", Buffer.alloc(0), 400],
    ["grande.pdf", Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]), 413]
  ])("rechaza %s con %i", async (nombre, bytes, estado) => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);
    expect((await subir(s, contrato.id, nombre, bytes)).status).toBe(estado);
  });

  test("neutraliza nombres con rutas", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);
    const r = await subir(s, contrato.id, "../../../malicioso.pdf", PDF);
    expect(r.status).toBe(201);
    expect(r.body.nombre).not.toMatch(/[\\/]/);
  });

  test("máximo 10 documentos por contrato", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);
    for (let i = 0; i < 10; i++) expect((await subir(s, contrato.id, `doc${i}.pdf`, PDF)).status).toBe(201);
    expect((await subir(s, contrato.id, "once.pdf", PDF)).status).toBe(409);
  });
});

describe("consultar, descargar y eliminar", () => {
  let s, c, tercero, contrato, documento;

  beforeAll(async () => {
    s = await registrar("SOLICITANTE");
    c = await registrar("CONTRAPARTE");
    tercero = await registrar("CONTRAPARTE");
    contrato = await crearContrato(s, c);
    documento = (await subir(s, contrato.id, "Cédula.pdf", PDF)).body;
  });

  test("ambas partes listan y descargan; un tercero no", async () => {
    const lista = await como(c).get(`/api/contratos/${contrato.id}/documentos`);
    expect(lista.body).toMatchObject({ editables: true, maximo: 10 });
    expect(lista.body.documentos).toHaveLength(1);

    const r = await descargar(c, `/api/contratos/${contrato.id}/documentos/${documento.id}`);
    expect(r.status).toBe(200);
    expect(Buffer.compare(r.body, PDF)).toBe(0);
    expect(r.headers["content-type"]).toMatch(/^application\/pdf/);
    expect(r.headers["content-disposition"]).toMatch(/^attachment/);
    expect(r.headers["content-disposition"]).toContain("UTF-8''C%C3%A9dula");
    expect(r.headers["x-content-type-options"]).toBe("nosniff");

    const enLinea = await descargar(s, `/api/contratos/${contrato.id}/documentos/${documento.id}?ver=1`);
    expect(enLinea.headers["content-disposition"]).toMatch(/^inline/);

    expect((await como(tercero).get(`/api/contratos/${contrato.id}/documentos`)).status).toBe(403);
    expect((await descargar(tercero, `/api/contratos/${contrato.id}/documentos/${documento.id}`)).status).toBe(403);
    expect((await subir(tercero, contrato.id, "intruso.pdf", PDF)).status).toBe(403);
  });

  test("cada parte elimina solo los suyos, y se borra el archivo", async () => {
    const propio = (await subir(c, contrato.id, "foto.png", PNG)).body;
    const { archivo } = await prisma.documentoContrato.findUnique({ where: { id: propio.id } });

    expect((await como(c).delete(`/api/contratos/${contrato.id}/documentos/${documento.id}`)).status).toBe(403);
    expect((await como(c).delete(`/api/contratos/${contrato.id}/documentos/${propio.id}`)).status).toBe(200);
    expect(fs.existsSync(path.join(process.env.CARPETA_DOCUMENTOS, archivo))).toBe(false);
  });
});

describe("documentos y firma", () => {
  test("la firma cubre los documentos y después quedan fijos", async () => {
    const { solicitante, contraparte, contrato } = await contratoAceptado();
    const documento = (await subir(solicitante, contrato.id, "anexo.pdf", PDF)).body;
    const conDocumento = await huella(solicitante, contrato.id);

    const firma = await firmar(solicitante, contrato.id);
    expect(firma.body.huella).toBe(conDocumento);

    expect((await subir(contraparte, contrato.id, "tarde.pdf", PDF)).status).toBe(409);
    expect((await como(solicitante).delete(`/api/contratos/${contrato.id}/documentos/${documento.id}`)).status).toBe(409);
    expect((await como(solicitante).get(`/api/contratos/${contrato.id}/documentos`)).body.editables).toBe(false);

    expect((await firmar(contraparte, contrato.id)).body.huella).toBe(conDocumento);
  });
});
