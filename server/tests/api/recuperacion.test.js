import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../src/db.js";
import { PASSWORD, api, como, registrar } from "../ayudantes.js";

const CARPETA = process.env.CARPETA_CORREOS;

// Correos guardados en modo local para «email», del más antiguo al más reciente
async function correosPara(email) {
  const archivos = await fs.readdir(CARPETA).catch(() => []);
  return archivos.filter((a) => a.endsWith(`_${email}.eml`)).sort();
}

// Token del enlace del último correo (decodifica quoted-printable)
async function tokenDelCorreo(email) {
  const archivos = await correosPara(email);
  if (archivos.length === 0) return null;
  const texto = (await fs.readFile(path.join(CARPETA, archivos.at(-1)), "utf8")).replace(/=\r?\n/g, "").replace(/=3D/g, "=");
  return /restablecer\?token=([A-Za-z0-9_-]{43})/.exec(texto)?.[1] ?? null;
}

const solicitar = (email) => api.post("/api/auth/recuperacion/solicitar").send({ email });
const restablecer = (token, nueva) => api.post("/api/auth/recuperacion/restablecer").send({ token, nueva });

describe("solicitar el enlace", () => {
  test("responde lo mismo exista o no la cuenta, y solo envía correo si existe", async () => {
    const u = await registrar();
    const desconocida = await solicitar("nadie-existe@test.local");
    const existente = await solicitar(u.email.toUpperCase());

    expect(desconocida.status).toBe(200);
    expect(existente.body.message).toBe(desconocida.body.message);
    expect(await correosPara("nadie-existe@test.local")).toHaveLength(0);
    expect(await tokenDelCorreo(u.email)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test("en la base solo se guarda el hash del token", async () => {
    const u = await registrar();
    await solicitar(u.email);
    const token = await tokenDelCorreo(u.email);
    expect(await prisma.recuperacionPassword.findFirst({ where: { tokenHash: token } })).toBeNull();
    expect(await prisma.recuperacionPassword.count({ where: { usuarioId: u.id } })).toBe(1);
  });

  test("máximo 3 solicitudes cada 15 minutos (la respuesta no cambia)", async () => {
    const u = await registrar();
    for (let i = 0; i < 3; i++) await solicitar(u.email);
    const generica = (await solicitar("nadie-existe@test.local")).body.message;
    const cuarta = await solicitar(u.email);
    expect(cuarta.body.message).toBe(generica);
    expect(await correosPara(u.email)).toHaveLength(3);
  });

  test("sin correo responde 400", async () => {
    expect((await api.post("/api/auth/recuperacion/solicitar").send({})).status).toBe(400);
  });
});

describe("validar y restablecer", () => {
  test("flujo completo: valida, cambia la contraseña, cierra sesiones y avisa por correo", async () => {
    const u = await registrar();
    await solicitar(u.email);
    const token = await tokenDelCorreo(u.email);

    const validacion = await api.get(`/api/auth/recuperacion/validar?token=${token}`);
    expect(validacion.body.valido).toBe(true);
    expect(validacion.body.email).toContain("•");
    expect(validacion.body.email).not.toContain(u.email.split("@")[0]);

    expect((await restablecer(token, "corta")).status).toBe(400);
    expect((await restablecer(token, "recuperada-123")).status).toBe(200);

    expect((await como(u).get("/api/auth/yo")).status).toBe(401);
    expect((await api.post("/api/auth/login").send({ email: u.email, password: PASSWORD })).status).toBe(401);
    expect((await api.post("/api/auth/login").send({ email: u.email, password: "recuperada-123" })).status).toBe(200);

    expect((await restablecer(token, "otra-clave-123")).status).toBe(410);
    const aviso = await fs.readFile(path.join(CARPETA, (await correosPara(u.email)).at(-1)), "utf8");
    expect(aviso).toMatch(/fue cambiada|Subject: =\?UTF-8\?Q\?Tu_contrase/i);
  });

  test("un enlace nuevo invalida el anterior", async () => {
    const u = await registrar();
    await solicitar(u.email);
    const primero = await tokenDelCorreo(u.email);
    await new Promise((r) => setTimeout(r, 5)); // nombres de archivo distintos
    await solicitar(u.email);
    const segundo = await tokenDelCorreo(u.email);

    expect(segundo).not.toBe(primero);
    expect((await api.get(`/api/auth/recuperacion/validar?token=${primero}`)).status).toBe(410);
    expect((await api.get(`/api/auth/recuperacion/validar?token=${segundo}`)).status).toBe(200);
  });

  test("tokens inventados o vencidos no sirven", async () => {
    expect((await api.get("/api/auth/recuperacion/validar?token=inventado")).status).toBe(410);

    const u = await registrar();
    await solicitar(u.email);
    const token = await tokenDelCorreo(u.email);
    await prisma.recuperacionPassword.updateMany({
      where: { usuarioId: u.id, usadoEn: null },
      data: { expiraEn: new Date(Date.now() - 1000) }
    });
    expect((await restablecer(token, "otra-clave-123")).status).toBe(410);
  });

  test("restablecer levanta el bloqueo de firma", async () => {
    const u = await registrar();
    await prisma.user.update({
      where: { id: u.id },
      data: { intentosFirmaFallidos: 5, firmaBloqueadaHasta: new Date(Date.now() + 15 * 60000) }
    });
    await solicitar(u.email);
    await restablecer(await tokenDelCorreo(u.email), "recuperada-123");
    const usuario = await prisma.user.findUnique({ where: { id: u.id } });
    expect(usuario).toMatchObject({ intentosFirmaFallidos: 0, firmaBloqueadaHasta: null });
  });
});
