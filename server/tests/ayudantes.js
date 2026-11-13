// Ayudantes comunes de las pruebas de la API
import request from "supertest";
import app from "../src/app.js";
import { DATOS_INDEFINIDO } from "./datos.js";

export { COMUNES, DATOS_INDEFINIDO } from "./datos.js";

export const api = request(app);
export const PASSWORD = "clave-de-prueba-123";
export const PIN_SOLICITANTE = "482915";
export const PIN_CONTRAPARTE = "739204";

let contador = 0;
const marca = Date.now().toString(36);

// Registra e inicia sesión. Devuelve { id, email, token, user }.
export async function registrar(role = "SOLICITANTE", extra = {}) {
  const email = `${role.toLowerCase()}-${marca}-${++contador}@test.local`;
  const registro = await api
    .post("/api/auth/register")
    .send({ nombre: "Prueba", apellido: role === "SOLICITANTE" ? "Solicitante" : "Contraparte", email, password: PASSWORD, role, ...extra });
  if (registro.status !== 201) throw new Error(`No se pudo registrar: ${JSON.stringify(registro.body)}`);
  const login = await api.post("/api/auth/login").send({ email, password: PASSWORD });
  return { id: registro.body.user.id, email, token: login.body.token, user: login.body.user };
}

// Petición autenticada: como(usuario).get("/api/…")
export function como(usuario) {
  const conToken = (r) => r.set("Authorization", `Bearer ${usuario.token}`);
  return {
    get: (ruta) => conToken(api.get(ruta)),
    post: (ruta) => conToken(api.post(ruta)),
    put: (ruta) => conToken(api.put(ruta)),
    delete: (ruta) => conToken(api.delete(ruta))
  };
}

export async function crearPin(usuario, pin) {
  const r = await como(usuario).put("/api/auth/pin").send({ password: PASSWORD, pin });
  if (r.status !== 200) throw new Error(`No se pudo crear el PIN: ${JSON.stringify(r.body)}`);
  usuario.pin = pin;
}

// Crea un contrato indefinido del solicitante hacia la contraparte y lo devuelve
export async function crearContrato(solicitante, contraparte, extra = {}) {
  const r = await como(solicitante)
    .post("/api/contratos")
    .send({ tipo: "INDEFINIDO", contraparteId: contraparte.id, datos: DATOS_INDEFINIDO, ...extra });
  if (r.status !== 201) throw new Error(`No se pudo crear el contrato: ${JSON.stringify(r.body)}`);
  return r.body;
}

export const firmar = (usuario, contratoId, extra = {}) =>
  como(usuario)
    .post(`/api/contratos/${contratoId}/firmar`)
    .send({ acepto: true, password: PASSWORD, pin: usuario.pin, ...extra });

// Partes con PIN creado y un contrato ya aceptado, listo para firmar
export async function contratoAceptado() {
  const solicitante = await registrar("SOLICITANTE");
  const contraparte = await registrar("CONTRAPARTE");
  await crearPin(solicitante, PIN_SOLICITANTE);
  await crearPin(contraparte, PIN_CONTRAPARTE);
  const contrato = await crearContrato(solicitante, contraparte);
  await como(contraparte).post(`/api/contratos/${contrato.id}/aceptar`);
  return { solicitante, contraparte, contrato };
}
