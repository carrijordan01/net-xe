import { DATOS_INDEFINIDO, como, crearContrato, registrar } from "../ayudantes.js";

const ids = (lista) => lista.map((u) => u.id);
const buscar = async (u, params) => (await como(u).get(`/api/usuarios?${new URLSearchParams(params)}`)).body;

let solicitante, panaderia, otraContraparte, marca;

beforeAll(async () => {
  marca = `Ñuñoa ${Date.now()}`;
  solicitante = await registrar("SOLICITANTE");
  panaderia = await registrar("CONTRAPARTE", { compania: `Panadería ${marca}` });
  otraContraparte = await registrar("CONTRAPARTE", { compania: `Ferretería ${marca}` });
});

describe("búsqueda y perfil", () => {
  test("busca por empresa sin distinguir mayúsculas", async () => {
    const lista = await buscar(solicitante, { q: `panadería ${marca.toLowerCase()}` });
    expect(ids(lista)).toEqual([panaderia.id]);
  });

  test("filtra por rol y nunca se incluye a sí mismo", async () => {
    const lista = await buscar(solicitante, { q: marca, role: "CONTRAPARTE" });
    expect(ids(lista).sort()).toEqual([panaderia.id, otraContraparte.id].sort());
    expect(ids(await buscar(panaderia, { q: marca }))).not.toContain(panaderia.id);
  });

  test("el perfil muestra los datos de contacto", async () => {
    const r = await como(solicitante).get(`/api/usuarios/${panaderia.id}`);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ email: panaderia.email, bloqueadoPorMi: false, meBloqueo: false });
  });
});

describe("bloqueos", () => {
  test("validaciones al bloquear", async () => {
    expect((await como(solicitante).post(`/api/usuarios/${solicitante.id}/bloqueo`)).status).toBe(400);
    expect((await como(solicitante).post("/api/usuarios/999999/bloqueo")).status).toBe(404);
  });

  test("efectos de un bloqueo en ambas direcciones y al desbloquear", async () => {
    const s = await registrar("SOLICITANTE", { compania: `Solicitante ${marca}` });
    const c = await registrar("CONTRAPARTE", { compania: `Bloqueada ${marca}` });

    const bloqueo = await como(s).post(`/api/usuarios/${c.id}/bloqueo`);
    expect(bloqueo.body.bloqueadoPorMi).toBe(true);
    expect((await como(s).post(`/api/usuarios/${c.id}/bloqueo`)).status).toBe(200);

    // Quien bloquea sigue viendo al bloqueado, marcado, pero no puede ofrecerle contratos
    expect((await buscar(s, { q: marca })).find((u) => u.id === c.id).bloqueadoPorMi).toBe(true);
    expect(ids(await buscar(s, { q: marca, role: "CONTRAPARTE", disponibles: 1 }))).not.toContain(c.id);
    expect((await como(s).post("/api/contratos").send({ tipo: "INDEFINIDO", contraparteId: c.id, datos: DATOS_INDEFINIDO })).status).toBe(403);

    // El bloqueado deja de verlo y su perfil le llega sin datos de contacto
    expect(ids(await buscar(c, { q: marca }))).not.toContain(s.id);
    const perfil = (await como(c).get(`/api/usuarios/${s.id}`)).body;
    expect(perfil.meBloqueo).toBe(true);
    expect(perfil).not.toHaveProperty("email");
    expect(perfil).not.toHaveProperty("phone");

    const bloqueados = (await como(s).get("/api/usuarios/bloqueados")).body;
    expect(ids(bloqueados)).toEqual([c.id]);
    expect(bloqueados[0].bloqueadoDesde).toBeTruthy();

    const desbloqueo = await como(s).delete(`/api/usuarios/${c.id}/bloqueo`);
    expect(desbloqueo.body.bloqueadoPorMi).toBe(false);
    await expect(crearContrato(s, c)).resolves.toHaveProperty("id");
  });

  test("tampoco se ofrecen contratos si la contraparte bloqueó al solicitante; los existentes siguen visibles", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const existente = await crearContrato(s, c);
    await como(c).post(`/api/usuarios/${s.id}/bloqueo`);

    const r = await como(s).post("/api/contratos").send({ tipo: "INDEFINIDO", contraparteId: c.id, datos: DATOS_INDEFINIDO });
    expect(r.status).toBe(403);
    expect((await como(s).get(`/api/usuarios/${c.id}`)).body.meBloqueo).toBe(true);
    expect((await como(s).get(`/api/contratos/${existente.id}`)).status).toBe(200);
  });
});
