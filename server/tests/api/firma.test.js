import { prisma } from "../../src/db.js";
import {
  DATOS_INDEFINIDO, PASSWORD, PIN_CONTRAPARTE, PIN_SOLICITANTE, como, contratoAceptado, crearContrato, crearPin, firmar, registrar
} from "../ayudantes.js";

describe("aceptar y rechazar", () => {
  test("solo la contraparte acepta, y una sola vez", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);

    expect((await como(s).post(`/api/contratos/${contrato.id}/aceptar`)).status).toBe(403);
    const r = await como(c).post(`/api/contratos/${contrato.id}/aceptar`);
    expect(r.status).toBe(200);
    expect(r.body.contrato.estado).toBe("ACEPTADO");
    expect((await como(c).post(`/api/contratos/${contrato.id}/aceptar`)).status).toBe(400);
  });

  test("al rechazar se guarda el motivo y ya no se puede aceptar", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);

    expect((await como(s).post(`/api/contratos/${contrato.id}/rechazar`).send({ motivo: "x" })).status).toBe(403);
    const r = await como(c).post(`/api/contratos/${contrato.id}/rechazar`).send({ motivo: "El sueldo no es el conversado." });
    expect(r.body.contrato.estado).toBe("RECHAZADO");

    const historial = (await como(s).get(`/api/contratos/${contrato.id}/historial`)).body;
    expect(historial.some((a) => a.evento === "Contrato rechazado" && a.comentario.includes("sueldo"))).toBe(true);
    expect((await como(c).post(`/api/contratos/${contrato.id}/aceptar`)).status).toBe(400);
  });
});

describe("firma", () => {
  test("no se firma un contrato que la contraparte no ha aceptado", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    await crearPin(s, PIN_SOLICITANTE);
    const contrato = await crearContrato(s, c);
    const r = await firmar(s, contrato.id);
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/aceptar/);
  });

  test("sin PIN creado no se puede firmar", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);
    await como(c).post(`/api/contratos/${contrato.id}/aceptar`);
    const r = await firmar(s, contrato.id, { pin: PIN_SOLICITANTE });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/PIN/);
  });

  test("exige la casilla de aceptación, y credenciales incorrectas responden 422", async () => {
    const { solicitante, contrato } = await contratoAceptado();
    expect((await firmar(solicitante, contrato.id, { acepto: false })).status).toBe(400);
    expect((await firmar(solicitante, contrato.id, { pin: "000001" })).status).toBe(422);
    expect((await firmar(solicitante, contrato.id, { password: "incorrecta-123" })).status).toBe(422);
  });

  test("un tercero no firma", async () => {
    const { contrato } = await contratoAceptado();
    const tercero = await registrar("CONTRAPARTE");
    await crearPin(tercero, PIN_CONTRAPARTE);
    expect((await firmar(tercero, contrato.id)).status).toBe(403);
  });

  test("con ambas firmas queda FIRMADO con la misma huella, fecha e IP", async () => {
    const { solicitante, contraparte, contrato } = await contratoAceptado();

    const primera = await firmar(solicitante, contrato.id);
    expect(primera.status).toBe(200);
    expect(primera.body.contrato.estado).toBe("ACEPTADO");
    expect(primera.body.huella).toMatch(/^[0-9a-f]{64}$/);
    expect(primera.body.contrato.ipFirmaSolicitante).toBeTruthy();
    expect((await firmar(solicitante, contrato.id)).status).toBe(400);

    const segunda = await firmar(contraparte, contrato.id);
    expect(segunda.body.contrato.estado).toBe("FIRMADO");
    expect(segunda.body.huella).toBe(primera.body.huella);

    const detalle = (await como(solicitante).get(`/api/contratos/${contrato.id}`)).body;
    expect(detalle.hashContenido).toBe(primera.body.huella);
    expect(detalle.firmaSolicitanteHash).toBe(primera.body.huella);
    expect(detalle.firmaContraparteHash).toBe(primera.body.huella);
    expect(detalle.fechaFirmaSolicitante).toBeTruthy();

    const historial = (await como(contraparte).get(`/api/contratos/${contrato.id}/historial`)).body;
    expect(historial.filter((a) => a.evento === "Contrato firmado")).toHaveLength(2);
  });

  test("con una firma ya no se edita, elimina ni rechaza directamente", async () => {
    const { solicitante, contraparte, contrato } = await contratoAceptado();
    await firmar(solicitante, contrato.id);

    const edicion = await como(solicitante).put(`/api/contratos/${contrato.id}`).send({ datos: DATOS_INDEFINIDO });
    expect(edicion.status).toBe(403);
    expect(edicion.body.error).toMatch(/solicitarlo/);
    expect((await como(solicitante).delete(`/api/contratos/${contrato.id}`)).status).toBe(403);
    expect((await como(contraparte).post(`/api/contratos/${contrato.id}/rechazar`).send({ motivo: "x" })).status).toBe(400);
  });
});

describe("bloqueo por intentos fallidos", () => {
  test("5 intentos fallidos bloquean la firma 15 minutos sin cerrar la sesión", async () => {
    const { contraparte, contrato } = await contratoAceptado();

    for (let i = 1; i <= 4; i++) {
      const r = await firmar(contraparte, contrato.id, { pin: "000001" });
      expect(r.status).toBe(422);
      expect(r.body.error).toMatch(`${5 - i} intento`);
    }
    expect((await firmar(contraparte, contrato.id, { pin: "000001" })).status).toBe(423);
    expect((await firmar(contraparte, contrato.id)).status).toBe(423);
    expect((await como(contraparte).get("/api/contratos/resumen")).status).toBe(200);

    const usuario = await prisma.user.findUnique({ where: { id: contraparte.id } });
    const minutos = (usuario.firmaBloqueadaHasta - Date.now()) / 60000;
    expect(minutos).toBeGreaterThan(14);
    expect(minutos).toBeLessThanOrEqual(15);
  });

  test("una firma correcta reinicia el contador", async () => {
    const { solicitante, contrato } = await contratoAceptado();
    await firmar(solicitante, contrato.id, { password: "incorrecta-123" });
    expect((await prisma.user.findUnique({ where: { id: solicitante.id } })).intentosFirmaFallidos).toBe(1);

    expect((await firmar(solicitante, contrato.id)).status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: solicitante.id } })).intentosFirmaFallidos).toBe(0);
  });

  test("tras el bloqueo se puede firmar con las credenciales correctas", async () => {
    const { contraparte, contrato } = await contratoAceptado();
    await prisma.user.update({
      where: { id: contraparte.id },
      data: { intentosFirmaFallidos: 5, firmaBloqueadaHasta: new Date(Date.now() - 1000) }
    });
    const r = await firmar(contraparte, contrato.id, { password: PASSWORD });
    expect(r.status).toBe(200);
  });
});
