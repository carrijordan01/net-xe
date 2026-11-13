import { PASSWORD, api, como, registrar } from "../ayudantes.js";

describe("registro", () => {
  test("crea la cuenta sin devolver el hash de la contraseña", async () => {
    const r = await api.post("/api/auth/register").send({
      nombre: "Ana", apellido: "Pérez", email: `ana-${Date.now()}@test.local`, password: PASSWORD, role: "CONTRAPARTE"
    });
    expect(r.status).toBe(201);
    expect(r.body.user).toMatchObject({ firstName: "Ana", role: "CONTRAPARTE", accountType: "INDIVIDUAL" });
    expect(r.body.user).not.toHaveProperty("passwordHash");
  });

  test("con empresa la cuenta es EMPRESA", async () => {
    const u = await registrar("CONTRAPARTE", { compania: "Panadería Ñuñoa SpA" });
    expect(u.user.accountType).toBe("EMPRESA");
  });

  test.each([
    [{ password: "corta" }, /8 caracteres/],
    [{ email: "no-es-correo" }, /inválido/],
    [{ nombre: "" }, /obligatorios/],
    [{ role: "ADMIN" }, /Rol/]
  ])("rechaza datos inválidos %p", async (cambio, mensaje) => {
    const base = { nombre: "X", apellido: "Y", email: `x-${Math.random()}@test.local`, password: PASSWORD, role: "SOLICITANTE" };
    const r = await api.post("/api/auth/register").send({ ...base, ...cambio });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(mensaje);
  });

  test("no permite repetir el correo (sin distinguir mayúsculas)", async () => {
    const u = await registrar();
    const r = await api.post("/api/auth/register").send({
      nombre: "X", apellido: "Y", email: u.email.toUpperCase(), password: PASSWORD, role: "SOLICITANTE"
    });
    expect(r.status).toBe(409);
  });
});

describe("inicio de sesión y sesión", () => {
  test("inicia sesión con el correo en mayúsculas", async () => {
    const u = await registrar();
    const r = await api.post("/api/auth/login").send({ email: u.email.toUpperCase(), password: PASSWORD });
    expect(r.status).toBe(200);
    expect(r.body.token).toEqual(expect.any(String));
  });

  test("credenciales inválidas responden 401 con un mensaje genérico", async () => {
    const u = await registrar();
    const malaClave = await api.post("/api/auth/login").send({ email: u.email, password: "incorrecta-123" });
    const sinCuenta = await api.post("/api/auth/login").send({ email: "nadie@test.local", password: PASSWORD });
    expect(malaClave.status).toBe(401);
    expect(sinCuenta.status).toBe(401);
    expect(malaClave.body.error).toBe(sinCuenta.body.error);
  });

  test("las rutas protegidas exigen un token válido", async () => {
    expect((await api.get("/api/auth/yo")).status).toBe(401);
    expect((await api.get("/api/auth/yo").set("Authorization", "Bearer inventado")).status).toBe(401);
  });

  test("GET /yo devuelve la cuenta sin datos sensibles", async () => {
    const u = await registrar();
    const r = await como(u).get("/api/auth/yo");
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ email: u.email, tienePin: false });
    expect(r.body).not.toHaveProperty("passwordHash");
    expect(r.body).not.toHaveProperty("pinFirmaHash");
  });
});

describe("datos de la cuenta", () => {
  test("actualiza nombre, teléfono y empresa, pero no el correo", async () => {
    const u = await registrar();
    const r = await como(u).put("/api/auth/yo").send({
      nombre: "  Ana ", apellido: "Pérez", telefono: "+56 9 1234 5678", compania: "Ana Diseño SpA", email: "otro@test.local"
    });
    expect(r.status).toBe(200);
    expect(r.body.user).toMatchObject({ firstName: "Ana", email: u.email, accountType: "EMPRESA" });
  });

  test("valida los campos y devuelve los errores por campo", async () => {
    const u = await registrar();
    const r = await como(u).put("/api/auth/yo").send({ nombre: " ", apellido: "", telefono: "abc" });
    expect(r.status).toBe(400);
    expect(Object.keys(r.body.errores).sort()).toEqual(["apellido", "nombre", "telefono"]);
  });
});

describe("cambio de contraseña", () => {
  test("una contraseña actual incorrecta responde 422 (no 401)", async () => {
    const u = await registrar();
    const r = await como(u).put("/api/auth/password").send({ actual: "incorrecta-123", nueva: "nueva-clave-123" });
    expect(r.status).toBe(422);
  });

  test("exige una nueva distinta y de al menos 8 caracteres", async () => {
    const u = await registrar();
    expect((await como(u).put("/api/auth/password").send({ actual: PASSWORD, nueva: "corta" })).status).toBe(400);
    expect((await como(u).put("/api/auth/password").send({ actual: PASSWORD, nueva: PASSWORD })).status).toBe(400);
  });

  test("cierra las demás sesiones y entrega un token nuevo", async () => {
    const u = await registrar();
    const otraSesion = (await api.post("/api/auth/login").send({ email: u.email, password: PASSWORD })).body.token;

    const r = await como(u).put("/api/auth/password").send({ actual: PASSWORD, nueva: "nueva-clave-123" });
    expect(r.status).toBe(200);

    expect((await como(u).get("/api/auth/yo")).status).toBe(401);
    expect((await como({ token: otraSesion }).get("/api/auth/yo")).status).toBe(401);
    expect((await como({ token: r.body.token }).get("/api/auth/yo")).status).toBe(200);
    expect((await api.post("/api/auth/login").send({ email: u.email, password: "nueva-clave-123" })).status).toBe(200);
  });
});

describe("PIN de firma", () => {
  test("rechaza PIN mal formados o demasiado simples", async () => {
    const u = await registrar();
    expect((await como(u).put("/api/auth/pin").send({ password: PASSWORD, pin: "12345" })).status).toBe(400);
    expect((await como(u).put("/api/auth/pin").send({ password: PASSWORD, pin: "123456" })).status).toBe(400);
  });

  test("crearlo exige la contraseña; cambiarlo exige además el PIN actual", async () => {
    const u = await registrar();
    expect((await como(u).put("/api/auth/pin").send({ password: "incorrecta-123", pin: "482915" })).status).toBe(422);
    expect((await como(u).put("/api/auth/pin").send({ password: PASSWORD, pin: "482915" })).status).toBe(200);

    expect((await como(u).put("/api/auth/pin").send({ password: PASSWORD, pin: "604172" })).status).toBe(422);
    const cambio = await como(u).put("/api/auth/pin").send({ password: PASSWORD, pinActual: "482915", pin: "604172" });
    expect(cambio.status).toBe(200);
    expect(cambio.body.message).toMatch(/actualizado/);
    expect((await como(u).get("/api/auth/yo")).body.tienePin).toBe(true);
  });
});
