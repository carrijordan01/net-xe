import { COMUNES, como, contratoAceptado, crearContrato, firmar, registrar } from "../ayudantes.js";

const notificaciones = async (u) => (await como(u).get("/api/notificaciones")).body;
const ultima = async (u) => (await notificaciones(u)).notificaciones[0];

// Fecha local aaaa-mm-dd a «n» días de hoy
function enDias(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const dos = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

describe("avisos de cada acción", () => {
  test("la otra parte recibe cada evento, con enlace al contrato; quien actúa no", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);

    let n = await ultima(c);
    expect(n).toMatchObject({ tipo: "CONTRATO_RECIBIDO", contratoId: contrato.id, leido: false });
    expect(n.mensaje).toMatch(/Contrato de trabajo indefinido/);
    expect((await notificaciones(s)).notificaciones).toHaveLength(0);

    await como(c).post(`/api/contratos/${contrato.id}/aceptar`);
    expect((await ultima(s)).tipo).toBe("CONTRATO_ACEPTADO");

    await como(s).put(`/api/contratos/${contrato.id}`).send({ modalidad: "EJECUCION_INMEDIATA" });
    n = await ultima(c);
    expect(n.tipo).toBe("CONTRATO_EDITADO");
    expect(n.mensaje).toMatch(/revisarlo/);

    await como(c).post(`/api/contratos/${contrato.id}/rechazar`).send({ motivo: "Prefiero otro cargo." });
    n = await ultima(s);
    expect(n.tipo).toBe("CONTRATO_RECHAZADO");
    expect(n.mensaje).toMatch(/Prefiero otro cargo\./);
  });

  test("firmas: avisa que falta la firma y luego que quedó firmado", async () => {
    const { solicitante, contraparte, contrato } = await contratoAceptado();
    await firmar(solicitante, contrato.id);
    expect((await ultima(contraparte)).mensaje).toMatch(/Falta tu firma/);
    await firmar(contraparte, contrato.id);
    const n = await ultima(solicitante);
    expect(n.tipo).toBe("CONTRATO_FIRMADO");
    expect(n.mensaje).toMatch(/ambas partes/);
  });

  test("eliminar avisa a la contraparte", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const contrato = await crearContrato(s, c);
    await como(s).delete(`/api/contratos/${contrato.id}`);
    expect((await ultima(c)).tipo).toBe("CONTRATO_ELIMINADO");
  });
});

describe("avisos de vencimiento", () => {
  test("solo para contratos vigentes que vencen en los próximos 7 días, sin duplicarse", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const tercero = await registrar("CONTRAPARTE");
    const mutuo = (fecha) => ({
      tipo: "MUTUO",
      datos: { ...COMUNES, fechaInicio: enDias(-30), monto: 100000, formaDevolucion: "Pago único" },
      fechaTermino: fecha
    });
    const en3 = await crearContrato(s, c, mutuo(enDias(3)));
    const hoy = await crearContrato(s, c, mutuo(enDias(0)));
    await crearContrato(s, c, mutuo(enDias(20)));
    const eliminado = await crearContrato(s, c, mutuo(enDias(2)));
    await como(s).delete(`/api/contratos/${eliminado.id}`);

    const avisos = async (u) => (await notificaciones(u)).notificaciones.filter((n) => n.tipo === "VENCIMIENTO_PROXIMO");
    const lista = await avisos(s);
    expect(lista.map((n) => n.contratoId).sort()).toEqual([en3.id, hoy.id].sort());
    expect(lista.find((n) => n.contratoId === en3.id).mensaje).toMatch(/vence en 3 días/);
    expect(lista.find((n) => n.contratoId === hoy.id).mensaje).toMatch(/vence hoy/);

    expect(await avisos(s)).toHaveLength(2);
    expect(await avisos(c)).toHaveLength(2);
    expect(await avisos(tercero)).toHaveLength(0);
  });
});

describe("marcar como leídas", () => {
  test("una por una (solo las propias) y todas a la vez", async () => {
    const s = await registrar("SOLICITANTE");
    const c = await registrar("CONTRAPARTE");
    const otro = await registrar("CONTRAPARTE");
    await crearContrato(s, c);
    await crearContrato(s, c);

    const antes = await notificaciones(c);
    expect(antes.noLeidas).toBe(2);
    const primera = antes.notificaciones[0];

    expect((await como(otro).put(`/api/notificaciones/${primera.id}/leido`)).status).toBe(404);
    expect((await como(c).put(`/api/notificaciones/${primera.id}/leido`)).status).toBe(200);
    expect((await notificaciones(c)).noLeidas).toBe(1);

    expect((await como(c).put("/api/notificaciones/leidas")).status).toBe(200);
    expect((await notificaciones(c)).noLeidas).toBe(0);
  });
});
