import { api, como, contratoAceptado, crearContrato, firmar, registrar } from "../ayudantes.js";

// Descarga binaria: el cuerpo llega como Buffer
const pdfDe = (u, id) => como(u).get(`/api/contratos/${id}/pdf`).responseType("blob");

let partes;

beforeAll(async () => {
  partes = await contratoAceptado();
  await firmar(partes.solicitante, partes.contrato.id);
  await firmar(partes.contraparte, partes.contrato.id);
});

describe("PDF del contrato", () => {
  test("se descarga completo, con nombre legible y encabezados correctos", async () => {
    const r = await pdfDe(partes.solicitante, partes.contrato.id).set("Origin", "http://localhost:5173");
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toBe("application/pdf");
    expect(r.body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(r.body.subarray(-6).toString()).toContain("%%EOF");
    expect(Number(r.headers["content-length"])).toBe(r.body.length);
    expect(r.headers["content-disposition"]).toMatch(/^attachment; filename="contrato-\d+-contrato-de-trabajo-indefinido\.pdf"$/);
    expect(r.headers["access-control-expose-headers"]).toContain("Content-Disposition");
  });

  test("lo descargan ambas partes, también si no está firmado o fue eliminado", async () => {
    expect((await pdfDe(partes.contraparte, partes.contrato.id)).status).toBe(200);

    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const borrador = await crearContrato(s, c);
    expect((await pdfDe(s, borrador.id)).status).toBe(200);
    await como(s).delete(`/api/contratos/${borrador.id}`);
    expect((await pdfDe(c, borrador.id)).status).toBe(200);
  });

  test("permisos y errores", async () => {
    const tercero = await registrar("CONTRAPARTE");
    expect((await pdfDe(tercero, partes.contrato.id)).status).toBe(403);
    expect((await api.get(`/api/contratos/${partes.contrato.id}/pdf`)).status).toBe(401);
    expect((await pdfDe(partes.solicitante, 999999)).status).toBe(404);
    expect((await pdfDe(partes.solicitante, "abc")).status).toBe(400);
  });
});
