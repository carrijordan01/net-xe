import { COMUNES, DATOS_INDEFINIDO, api, como, crearContrato, registrar } from "../ayudantes.js";

let solicitante, contraparte, tercero;

beforeAll(async () => {
  solicitante = await registrar("SOLICITANTE");
  contraparte = await registrar("CONTRAPARTE", { compania: "Prueba SpA" });
  tercero = await registrar("CONTRAPARTE");
});

describe("catálogo y contrapartes", () => {
  test("el catálogo trae las 16 plantillas", async () => {
    const r = await como(solicitante).get("/api/plantillas");
    expect(r.status).toBe(200);
    expect(r.body.plantillas).toHaveLength(16);
  });

  test("el catálogo exige sesión", async () => {
    expect((await api.get("/api/plantillas")).status).toBe(401);
  });

  test("lista contrapartes sin datos sensibles", async () => {
    const r = await como(solicitante).get("/api/usuarios?role=CONTRAPARTE");
    expect(r.status).toBe(200);
    expect(r.body.every((u) => u.role === "CONTRAPARTE" && !("passwordHash" in u))).toBe(true);
  });
});

describe("crear", () => {
  test("el solicitante crea un contrato PENDIENTE", async () => {
    const r = await como(solicitante)
      .post("/api/contratos")
      .send({ tipo: "INDEFINIDO", contraparteId: contraparte.id, datos: DATOS_INDEFINIDO, modalidad: "TRACTO_SUCESIVO" });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ estado: "PENDIENTE", tipo: "INDEFINIDO", modalidad: "TRACTO_SUCESIVO", contraparteId: contraparte.id });
  });

  test("una contraparte no crea contratos", async () => {
    const r = await como(contraparte).post("/api/contratos").send({ tipo: "INDEFINIDO", contraparteId: tercero.id, datos: DATOS_INDEFINIDO });
    expect(r.status).toBe(403);
  });

  test("valida los datos con el catálogo y devuelve los errores por campo", async () => {
    const r = await como(solicitante).post("/api/contratos").send({ tipo: "INDEFINIDO", contraparteId: contraparte.id, datos: COMUNES });
    expect(r.status).toBe(400);
    expect(r.body.errores).toHaveProperty("cargo");
  });

  test("la contraparte debe existir y tener ese rol", async () => {
    const otroSolicitante = await registrar("SOLICITANTE");
    const aSolicitante = await como(solicitante).post("/api/contratos").send({ tipo: "INDEFINIDO", contraparteId: otroSolicitante.id, datos: DATOS_INDEFINIDO });
    const inexistente = await como(solicitante).post("/api/contratos").send({ tipo: "INDEFINIDO", contraparteId: 999999, datos: DATOS_INDEFINIDO });
    expect(aSolicitante.status).toBeGreaterThanOrEqual(400);
    expect(inexistente.status).toBeGreaterThanOrEqual(400);
  });
});

describe("consultar", () => {
  test("ambas partes ven el detalle; un tercero no", async () => {
    const c = await crearContrato(solicitante, contraparte);
    expect((await como(solicitante).get(`/api/contratos/${c.id}`)).status).toBe(200);
    expect((await como(contraparte).get(`/api/contratos/${c.id}`)).status).toBe(200);
    expect((await como(tercero).get(`/api/contratos/${c.id}`)).status).toBe(403);
    expect((await como(tercero).get(`/api/contratos/${c.id}/historial`)).status).toBe(403);
  });

  test("buscar filtra por varios estados y el resumen cuenta por estado", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await crearContrato(s, contraparte);
    const busqueda = await como(contraparte).get("/api/contratos/buscar?estado=PENDIENTE,ACEPTADO");
    expect(busqueda.body.some((x) => x.id === c.id)).toBe(true);

    const resumen = await como(s).get("/api/contratos/resumen");
    expect(resumen.status).toBe(200);
    expect(resumen.body.PENDIENTE).toBe(1);
  });

  test("un id inexistente responde 404", async () => {
    expect((await como(solicitante).get("/api/contratos/999999")).status).toBe(404);
  });
});

describe("editar antes de firmar", () => {
  test("devuelve los cambios y no permite cambiar el tipo", async () => {
    const c = await crearContrato(solicitante, contraparte);
    const r = await como(solicitante)
      .put(`/api/contratos/${c.id}`)
      .send({ tipo: "MUTUO", datos: { ...DATOS_INDEFINIDO, cargo: "Jefe de análisis", remuneracionMensual: 1200000 } });
    expect(r.status).toBe(200);
    expect(r.body.cambios).toEqual(["Cargo", "Remuneración bruta mensual"]);
    expect(r.body.contrato.tipo).toBe("INDEFINIDO");

    const sinCambios = await como(solicitante)
      .put(`/api/contratos/${c.id}`)
      .send({ datos: { ...DATOS_INDEFINIDO, cargo: "Jefe de análisis", remuneracionMensual: 1200000 } });
    expect(sinCambios.body.cambios).toEqual([]);
  });

  test("solo el solicitante edita", async () => {
    const c = await crearContrato(solicitante, contraparte);
    expect((await como(contraparte).put(`/api/contratos/${c.id}`).send({ datos: DATOS_INDEFINIDO })).status).toBe(403);
  });

  test("editar uno ACEPTADO lo devuelve a PENDIENTE y queda en el historial", async () => {
    const c = await crearContrato(solicitante, contraparte);
    await como(contraparte).post(`/api/contratos/${c.id}/aceptar`);
    const r = await como(solicitante).put(`/api/contratos/${c.id}`).send({ modalidad: "EJECUCION_INMEDIATA" });
    expect(r.body.contrato.estado).toBe("PENDIENTE");

    const historial = (await como(contraparte).get(`/api/contratos/${c.id}/historial`)).body;
    const edicion = historial.find((a) => a.evento === "Contrato editado");
    expect(edicion.comentario).toMatch(/Vuelve a revisión/);
  });

  test("no se edita un contrato rechazado", async () => {
    const c = await crearContrato(solicitante, contraparte);
    await como(contraparte).post(`/api/contratos/${c.id}/rechazar`).send({});
    expect((await como(solicitante).put(`/api/contratos/${c.id}`).send({ datos: DATOS_INDEFINIDO })).status).toBe(403);
  });
});

describe("eliminar (borrado lógico)", () => {
  test("queda ELIMINADO, consultable y fuera del listado por defecto", async () => {
    const c = await crearContrato(solicitante, contraparte);
    expect((await como(contraparte).delete(`/api/contratos/${c.id}`)).status).toBe(403);
    expect((await como(solicitante).delete(`/api/contratos/${c.id}`)).status).toBe(200);

    const detalle = await como(contraparte).get(`/api/contratos/${c.id}`);
    expect(detalle.body.estado).toBe("ELIMINADO");
    const listado = await como(solicitante).get("/api/contratos/buscar");
    expect(listado.body.some((x) => x.id === c.id)).toBe(false);

    expect((await como(solicitante).delete(`/api/contratos/${c.id}`)).status).toBe(400);
    expect((await como(solicitante).put(`/api/contratos/${c.id}`).send({ datos: DATOS_INDEFINIDO })).status).toBe(403);
  });
});
