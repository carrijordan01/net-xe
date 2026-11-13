import { DATOS_INDEFINIDO, como, contratoAceptado, crearContrato, firmar, registrar } from "../ayudantes.js";

const solicitar = (u, contratoId, cuerpo) => como(u).post(`/api/contratos/${contratoId}/solicitudes`).send(cuerpo);
const responder = (u, contratoId, solicitudId, accion, cuerpo = {}) =>
  como(u).post(`/api/contratos/${contratoId}/solicitudes/${solicitudId}/${accion}`).send(cuerpo);

// Contrato firmado por ambas partes
async function contratoFirmado() {
  const partes = await contratoAceptado();
  await firmar(partes.solicitante, partes.contrato.id);
  await firmar(partes.contraparte, partes.contrato.id);
  const huella = (await como(partes.solicitante).get(`/api/contratos/${partes.contrato.id}`)).body.hashContenido;
  return { ...partes, huella };
}

describe("crear solicitudes", () => {
  test("sin firmas no hace falta solicitar (se edita directo)", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);
    expect((await solicitar(s, contrato.id, { tipo: "ELIMINACION", motivo: "x" })).status).toBe(400);
  });

  test("validaciones: autor, tipo, motivo, cambios y datos", async () => {
    const { solicitante, contraparte, contrato } = await contratoFirmado();
    expect((await solicitar(contraparte, contrato.id, { tipo: "EDICION", motivo: "x", datos: DATOS_INDEFINIDO })).status).toBe(403);
    expect((await solicitar(solicitante, contrato.id, { tipo: "OTRO", motivo: "x" })).status).toBe(400);

    const sinMotivo = await solicitar(solicitante, contrato.id, { tipo: "EDICION", motivo: "  ", datos: { ...DATOS_INDEFINIDO, cargo: "X" } });
    expect(sinMotivo.body.errores).toHaveProperty("motivo");
    expect((await solicitar(solicitante, contrato.id, { tipo: "EDICION", motivo: "Ajuste", datos: DATOS_INDEFINIDO })).status).toBe(400);

    const invalida = await solicitar(solicitante, contrato.id, { tipo: "EDICION", motivo: "Ajuste", datos: { ...DATOS_INDEFINIDO, remuneracionMensual: -1 } });
    expect(invalida.status).toBe(400);
    expect(invalida.body.errores).toHaveProperty("remuneracionMensual");
  });

  test("solo una pendiente por contrato, y un tercero no las ve", async () => {
    const { solicitante, contrato } = await contratoFirmado();
    const tercero = await registrar("CONTRAPARTE");
    const r = await solicitar(solicitante, contrato.id, { tipo: "EDICION", motivo: "Ascenso", datos: { ...DATOS_INDEFINIDO, cargo: "Jefe de área" } });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ estado: "PENDIENTE", cambios: ["Cargo"] });
    expect((await solicitar(solicitante, contrato.id, { tipo: "ELIMINACION", motivo: "x" })).status).toBe(409);
    expect((await como(tercero).get(`/api/contratos/${contrato.id}/solicitudes`)).status).toBe(403);
  });
});

describe("responder solicitudes", () => {
  test("rechazar deja el contrato igual y firmado, y avisa con la respuesta", async () => {
    const { solicitante, contraparte, contrato, huella } = await contratoFirmado();
    const q = (await solicitar(solicitante, contrato.id, { tipo: "EDICION", motivo: "Ascenso", datos: { ...DATOS_INDEFINIDO, cargo: "Jefe" } })).body;

    expect((await responder(solicitante, contrato.id, q.id, "aprobar")).status).toBe(403);
    expect((await responder(contraparte, contrato.id, q.id, "rechazar", { respuesta: "Prefiero mantener el cargo." })).status).toBe(200);

    const detalle = (await como(solicitante).get(`/api/contratos/${contrato.id}`)).body;
    expect(detalle).toMatchObject({ estado: "FIRMADO", firmaSolicitanteHash: huella });
    expect(detalle.datos.cargo).toBe("Analista");
    const aviso = (await como(solicitante).get("/api/notificaciones")).body.notificaciones[0];
    expect(aviso.tipo).toBe("SOLICITUD_RESPONDIDA");
    expect(aviso.mensaje).toMatch(/Prefiero mantener el cargo\./);
    expect((await responder(contraparte, contrato.id, q.id, "aprobar")).status).toBe(400);
  });

  test("aprobar una edición aplica la propuesta, reinicia las firmas y se vuelve a firmar", async () => {
    const { solicitante, contraparte, contrato, huella } = await contratoFirmado();
    const q = (await solicitar(solicitante, contrato.id, {
      tipo: "EDICION", motivo: "Ascenso aprobado", datos: { ...DATOS_INDEFINIDO, cargo: "Jefe de área" }, fechaTermino: "2027-12-31"
    })).body;
    expect(q.cambios).toEqual(["Cargo", "Fecha de término"]);
    expect((await como(contraparte).get("/api/notificaciones")).body.notificaciones[0].tipo).toBe("SOLICITUD_CAMBIO");

    const r = await responder(contraparte, contrato.id, q.id, "aprobar");
    expect(r.body.contrato).toMatchObject({
      estado: "ACEPTADO", firmadoSolicitante: false, firmadoContraparte: false, firmaSolicitanteHash: null
    });
    expect(r.body.contrato.datos.cargo).toBe("Jefe de área");
    expect(r.body.contrato.fechaTermino).toMatch(/^2027-12-31/);

    await firmar(solicitante, contrato.id);
    const segunda = await firmar(contraparte, contrato.id);
    expect(segunda.body.contrato.estado).toBe("FIRMADO");
    expect(segunda.body.huella).not.toBe(huella);

    const eventos = (await como(solicitante).get(`/api/contratos/${contrato.id}/historial`)).body.map((a) => a.evento);
    expect(eventos).toEqual(expect.arrayContaining(["Solicitud de edición enviada", "Solicitud de edición aprobada"]));
  });

  test("con una solicitud pendiente nadie firma; el autor puede cancelarla", async () => {
    const { solicitante, contraparte, contrato } = await contratoAceptado();
    await firmar(solicitante, contrato.id);
    const q = (await solicitar(solicitante, contrato.id, {
      tipo: "EDICION", motivo: "Corregir funciones", datos: { ...DATOS_INDEFINIDO, funciones: "Análisis y reportes" }
    })).body;

    expect((await firmar(contraparte, contrato.id)).status).toBe(409);
    expect((await responder(contraparte, contrato.id, q.id, "cancelar")).status).toBe(403);
    expect((await responder(solicitante, contrato.id, q.id, "cancelar")).status).toBe(200);
    expect((await responder(contraparte, contrato.id, q.id, "aprobar")).status).toBe(400);
    expect((await firmar(contraparte, contrato.id)).body.contrato.estado).toBe("FIRMADO");
  });

  test("aprobar una eliminación deja el contrato ELIMINADO", async () => {
    const { solicitante, contraparte, contrato } = await contratoFirmado();
    const q = (await solicitar(solicitante, contrato.id, { tipo: "ELIMINACION", motivo: "Ya no se requiere." })).body;
    expect(q.propuesta).toBeNull();

    const r = await responder(contraparte, contrato.id, q.id, "aprobar");
    expect(r.body.contrato.estado).toBe("ELIMINADO");
    expect((await solicitar(solicitante, contrato.id, { tipo: "EDICION", motivo: "x", datos: DATOS_INDEFINIDO })).status).toBe(400);

    const lista = (await como(contraparte).get(`/api/contratos/${contrato.id}/solicitudes`)).body;
    expect(lista.map((x) => x.estado)).toEqual(["APROBADA"]);
  });
});
