// Pruebas de humo de la API (hasta la Etapa 12). Desde server/:
//   npm run pruebas:api
// Requiere el servidor corriendo (npm run dev) y la base de datos local.
// Cada ejecución crea usuarios (@test.local) y contratos de prueba nuevos; no
// modifica las cuentas demo. Termina con código 1 si alguna prueba falla.
// Se reemplazará por pruebas con Jest/Supertest en la Etapa 15.
import { fileURLToPath } from "node:url";
import { prisma } from "../src/db.js";

const B = `http://localhost:${process.env.PORT || 4000}/api`;
try {
  await fetch(`${B}/plantillas`);
} catch {
  console.error(`No se pudo conectar con el servidor en ${B}. Inícialo con «npm run dev» antes de ejecutar las pruebas.`);
  process.exit(1);
}
let ok = 0, fail = 0;
const check = (n, c, x = "") => { c ? ok++ : fail++; console.log(`${c ? "OK  " : "FAIL"} ${n}${x !== "" ? " · " + x : ""}`); };
const call = async (m, p, b, t) => {
  const r = await fetch(B + p, { method: m, headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  return { s: r.status, d: await r.json().catch(() => null) };
};
const seccion = (t) => console.log(`\n— ${t}`);

const pw = "prueba-" + Math.random().toString(36).slice(2, 10), sfx = Date.now();
let n = 0;
async function registrar(role, extra = {}) {
  const email = `${role.toLowerCase()}${sfx}-${++n}@test.local`;
  const r = await call("POST", "/auth/register", { nombre: "Prueba", apellido: role, email, password: pw, role, ...extra });
  const l = await call("POST", "/auth/login", { email: email.toUpperCase(), password: pw });
  return { id: r.d?.user?.id, t: l.d?.token, r, l };
}

const comunes = { ciudad: "Santiago", fechaInicio: "2026-11-01", rutSolicitante: "11.111.111-1", domicilioSolicitante: "Av. Siempre Viva 123" };
const indefinido = { ...comunes, cargo: "Analista", funciones: "Análisis", lugarTrabajo: "Santiago", horasSemanales: 40, distribucionJornada: "L-V 9 a 18", remuneracionMensual: 900000, formaPago: "Transferencia bancaria", diaPago: 30 };

seccion("Autenticación");
let r = await call("POST", "/auth/register", { nombre: "X", apellido: "Y", email: `corta${sfx}@test.local`, password: "corta", role: "SOLICITANTE" });
check("contraseña < 8 rechazada", r.s === 400);
const sol = await registrar("SOLICITANTE");
const con = await registrar("CONTRAPARTE", { compania: "Prueba SpA" });
const otro = await registrar("CONTRAPARTE");
check("registro y login (correo sin distinguir mayúsculas)", sol.t && con.t && otro.t);
check("cuenta EMPRESA si hay compañía", con.r.d.user.accountType === "EMPRESA");
r = await call("POST", "/auth/login", { email: `solicitante${sfx}-1@test.local`, password: "incorrecta123" });
check("credenciales inválidas -> 401", r.s === 401);
r = await call("GET", "/contratos/buscar");
check("sin token -> 401", r.s === 401);

seccion("Usuarios y catálogo");
r = await call("GET", "/usuarios?role=CONTRAPARTE", null, sol.t);
check("listar contrapartes sin hash", r.s === 200 && r.d.every((u) => u.role === "CONTRAPARTE" && !("passwordHash" in u)));
r = await call("GET", `/usuarios/${con.id}`, null, sol.t);
check("perfil público", r.s === 200 && r.d.company === "Prueba SpA");
r = await call("GET", "/plantillas", null, sol.t);
check("catálogo de 16 plantillas", r.s === 200 && r.d.plantillas.length === 16);

seccion("Crear");
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: con.id, datos: indefinido }, con.t);
check("contraparte no crea -> 403", r.s === 403);
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: con.id, datos: { ...comunes } }, sol.t);
check("faltan obligatorios -> 400 con detalle", r.s === 400 && r.d.errores?.cargo);
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: con.id, datos: indefinido, modalidad: "TRACTO_SUCESIVO" }, sol.t);
check("crear contrato", r.s === 201);
const c1 = r.d;

seccion("Consultar");
r = await call("GET", `/contratos/${c1.id}`, null, otro.t);
check("tercero no ve detalle -> 403", r.s === 403);
r = await call("GET", "/contratos/buscar?estado=PENDIENTE,ACEPTADO", null, con.t);
check("buscar por varios estados (contraparte)", r.s === 200 && r.d.some((c) => c.id === c1.id));
r = await call("GET", "/contratos/resumen", null, sol.t);
check("resumen", r.s === 200 && r.d.PENDIENTE === 1);

seccion("Editar (Etapa 6)");
r = await call("PUT", `/contratos/${c1.id}`, { datos: { ...indefinido, cargo: "Jefe de análisis", remuneracionMensual: 1200000 }, tipo: "MUTUO" }, sol.t);
check("editar devuelve los cambios", r.s === 200 && r.d.cambios.join() === "Cargo,Remuneración bruta mensual", r.d?.cambios?.join(", "));
check("el tipo no cambia al editar", r.d.contrato.tipo === "INDEFINIDO");
r = await call("PUT", `/contratos/${c1.id}`, { datos: { ...indefinido, cargo: "Jefe de análisis", remuneracionMensual: 1200000 } }, sol.t);
check("sin cambios no registra historial", r.s === 200 && r.d.cambios.length === 0);
r = await call("PUT", `/contratos/${c1.id}`, { datos: indefinido }, con.t);
check("contraparte no edita -> 403", r.s === 403);
r = await call("POST", `/contratos/${c1.id}/aceptar`, null, con.t);
check("contraparte acepta", r.s === 200 && r.d.contrato.estado === "ACEPTADO");
r = await call("PUT", `/contratos/${c1.id}`, { modalidad: "EJECUCION_INMEDIATA" }, sol.t);
check("editar uno aceptado lo vuelve a PENDIENTE", r.s === 200 && r.d.contrato.estado === "PENDIENTE");
r = await call("GET", `/contratos/${c1.id}/historial`, null, con.t);
const ediciones = r.d.filter((a) => a.evento === "Contrato editado");
check("historial detalla los cambios", ediciones.length === 2 && ediciones[0].comentario.includes("Cargo") && ediciones[1].comentario.includes("Vuelve a revisión"), ediciones.map((e) => e.comentario).join(" | "));
r = await call("GET", `/contratos/${c1.id}/historial`, null, otro.t);
check("tercero no ve historial -> 403", r.s === 403);

seccion("Aceptar, rechazar y PIN (Etapa 7)");
const firma = (u, extra = {}) => ({ acepto: true, password: pw, pin: u.pin, ...extra });
r = await call("POST", `/contratos/${c1.id}/aceptar`, null, sol.t);
check("solicitante no acepta -> 403", r.s === 403);
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(sol), sol.t);
check("no se firma un pendiente -> 400", r.s === 400 && r.d.error.includes("aceptar"));
r = await call("POST", `/contratos/${c1.id}/aceptar`, null, con.t);
check("aceptar de nuevo tras la edición", r.s === 200);
r = await call("POST", `/contratos/${c1.id}/aceptar`, null, con.t);
check("aceptar dos veces -> 400", r.s === 400);
r = await call("GET", "/auth/yo", null, sol.t);
check("cuenta sin PIN", r.s === 200 && r.d.tienePin === false && !("pinFirmaHash" in r.d));
r = await call("POST", `/contratos/${c1.id}/firmar`, { acepto: true, password: pw, pin: "482915" }, sol.t);
check("firmar sin haber creado PIN -> 400", r.s === 400 && r.d.error.includes("PIN"));
r = await call("PUT", "/auth/pin", { password: pw, pin: "123456" }, sol.t);
check("PIN secuencial rechazado", r.s === 400);
r = await call("PUT", "/auth/pin", { password: pw, pin: "11111" }, sol.t);
check("PIN de 5 dígitos rechazado", r.s === 400);
r = await call("PUT", "/auth/pin", { password: "incorrecta123", pin: "482915" }, sol.t);
check("crear PIN con contraseña incorrecta -> 422 (no 401)", r.s === 422);
r = await call("PUT", "/auth/pin", { password: pw, pin: "482915" }, sol.t);
check("crear PIN", r.s === 200 && r.d.tienePin);
sol.pin = "482915";
r = await call("PUT", "/auth/pin", { password: pw, pin: "604172" }, sol.t);
check("cambiar PIN exige el actual", r.s === 422);
r = await call("PUT", "/auth/pin", { password: "x", pin: "604172" }, con.t);
check("contraparte: contraseña incorrecta al crear PIN", r.s === 422);
r = await call("PUT", "/auth/pin", { password: pw, pin: "739204" }, con.t);
con.pin = "739204";
check("contraparte crea su PIN", r.s === 200);

seccion("Firmar (Etapa 7)");
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(sol), otro.t);
check("tercero no firma -> 403", r.s === 403);
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(sol, { acepto: false }), sol.t);
check("sin casilla de aceptación -> 400", r.s === 400);
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(sol, { pin: "000001" }), sol.t);
check("PIN incorrecto -> 422 (el cambio de PIN fallido ya contó un intento)", r.s === 422 && r.d.error.includes("3 intento"), r.d?.error);
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(sol, { password: "incorrecta123" }), sol.t);
check("contraseña incorrecta -> 422", r.s === 422 && r.d.error.includes("2 intento"), r.d?.error);
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(sol), sol.t);
check("firma del solicitante con contraseña + PIN", r.s === 200 && r.d.contrato.estado === "ACEPTADO" && r.d.contrato.ipFirmaSolicitante && /^[0-9a-f]{64}$/.test(r.d.huella));
const huella = r.d.huella;
r = await call("GET", "/auth/yo", null, sol.t);
check("firma correcta reinicia los intentos", (await prisma.user.findUnique({ where: { id: sol.id } })).intentosFirmaFallidos === 0);
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(sol), sol.t);
check("firmar dos veces -> 400", r.s === 400);
r = await call("PUT", `/contratos/${c1.id}`, { datos: indefinido }, sol.t);
check("no se edita con una firma -> 403", r.s === 403 && r.d.error.includes("solicitarlo"));
r = await call("DELETE", `/contratos/${c1.id}`, null, sol.t);
check("no se elimina con una firma -> 403", r.s === 403);
r = await call("POST", `/contratos/${c1.id}/rechazar`, { motivo: "x" }, con.t);
check("no se rechaza con una firma -> 400", r.s === 400);
r = await call("POST", `/contratos/${c1.id}/firmar`, firma(con), con.t);
check("ambas firmas -> FIRMADO", r.s === 200 && r.d.contrato.estado === "FIRMADO" && r.d.huella === huella);
r = await call("GET", `/contratos/${c1.id}`, null, sol.t);
check("la huella actual coincide con ambas firmas", r.d.hashContenido === huella && r.d.firmaSolicitanteHash === huella && r.d.firmaContraparteHash === huella);
r = await call("GET", `/contratos/${c1.id}/historial`, null, sol.t);
check("historial registra las firmas con su huella", r.d.filter((a) => a.evento === "Contrato firmado" && a.comentario.includes(huella)).length === 2);

seccion("Rechazar y bloqueo (Etapa 7)");
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: con.id, datos: indefinido }, sol.t);
const c4 = r.d;
r = await call("POST", `/contratos/${c4.id}/rechazar`, { motivo: "x" }, sol.t);
check("solicitante no rechaza -> 403", r.s === 403);
r = await call("POST", `/contratos/${c4.id}/rechazar`, { motivo: "El sueldo no es el conversado." }, con.t);
check("contraparte rechaza", r.s === 200 && r.d.contrato.estado === "RECHAZADO");
r = await call("GET", `/contratos/${c4.id}/historial`, null, sol.t);
check("motivo del rechazo en el historial", r.d.some((a) => a.evento === "Contrato rechazado" && a.comentario.includes("sueldo")));
r = await call("POST", `/contratos/${c4.id}/aceptar`, null, con.t);
check("no se acepta un rechazado -> 400", r.s === 400);
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: con.id, datos: indefinido }, sol.t);
const c5 = r.d;
await call("POST", `/contratos/${c5.id}/aceptar`, null, con.t);
for (let i = 0; i < 4; i++) await call("POST", `/contratos/${c5.id}/firmar`, firma(con, { pin: "000001" }), con.t);
r = await call("POST", `/contratos/${c5.id}/firmar`, firma(con, { pin: "000001" }), con.t);
check("5 intentos fallidos bloquean la firma -> 423", r.s === 423, r.d?.error);
r = await call("POST", `/contratos/${c5.id}/firmar`, firma(con), con.t);
check("bloqueada incluso con credenciales correctas", r.s === 423);
r = await call("GET", "/contratos/resumen", null, con.t);
check("la sesión sigue activa tras los fallos", r.s === 200);
await prisma.user.update({ where: { id: con.id }, data: { firmaBloqueadaHasta: null } });
r = await call("POST", `/contratos/${c5.id}/firmar`, firma(con), con.t);
check("tras el bloqueo, firma correcta", r.s === 200);

seccion("Eliminar (Etapa 6)");
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: con.id, datos: indefinido }, sol.t);
const c2 = r.d;
r = await call("DELETE", `/contratos/${c2.id}`, null, con.t);
check("contraparte no elimina -> 403", r.s === 403);
r = await call("DELETE", `/contratos/${c2.id}`, null, sol.t);
check("eliminar sin firmas (lógico)", r.s === 200);
r = await call("GET", `/contratos/${c2.id}`, null, con.t);
check("sigue consultable por ambas partes como ELIMINADO", r.s === 200 && r.d.estado === "ELIMINADO");
r = await call("DELETE", `/contratos/${c2.id}`, null, sol.t);
check("eliminar dos veces -> 400", r.s === 400);
r = await call("PUT", `/contratos/${c2.id}`, { datos: indefinido }, sol.t);
check("no se edita un eliminado -> 403", r.s === 403);
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: con.id, datos: indefinido }, sol.t);
const c3 = r.d;
await call("POST", `/contratos/${c3.id}/rechazar`, {}, con.t);
r = await call("PUT", `/contratos/${c3.id}`, { datos: indefinido }, sol.t);
check("no se edita un rechazado -> 403", r.s === 403);
r = await call("GET", "/contratos/buscar", null, sol.t);
check("listado por defecto excluye eliminados", r.s === 200 && !r.d.some((c) => c.id === c2.id));

seccion("Notificaciones (Etapa 8)");
const s8 = await registrar("SOLICITANTE");
const c8 = await registrar("CONTRAPARTE");
const t8 = await registrar("CONTRAPARTE");
const notifs = async (u) => (await call("GET", "/notificaciones", null, u.t)).d;
const ultima = async (u) => (await notifs(u)).notificaciones[0];
const enDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: c8.id, datos: indefinido }, s8.t);
const n1 = r.d;
let nt = await ultima(c8);
check("contraparte recibe CONTRATO_RECIBIDO con enlace", nt?.tipo === "CONTRATO_RECIBIDO" && nt.contratoId === n1.id && nt.mensaje.includes("Prueba SOLICITANTE") && nt.mensaje.includes("Contrato de trabajo indefinido"), nt?.mensaje);
check("quien actúa no se notifica a sí mismo", (await notifs(s8)).notificaciones.length === 0);
await call("POST", `/contratos/${n1.id}/aceptar`, null, c8.t);
nt = await ultima(s8);
check("solicitante recibe CONTRATO_ACEPTADO", nt?.tipo === "CONTRATO_ACEPTADO" && nt.mensaje.includes("aceptó"), nt?.mensaje);
await call("PUT", `/contratos/${n1.id}`, { datos: { ...indefinido, cargo: "Gerente" } }, s8.t);
nt = await ultima(c8);
check("editar uno aceptado avisa que debe revisarse", nt?.tipo === "CONTRATO_EDITADO" && nt.mensaje.includes("revisarlo"), nt?.mensaje);
await call("POST", `/contratos/${n1.id}/rechazar`, { motivo: "Prefiero otro cargo." }, c8.t);
nt = await ultima(s8);
check("rechazo incluye el motivo", nt?.tipo === "CONTRATO_RECHAZADO" && nt.mensaje.includes("Prefiero otro cargo."), nt?.mensaje);

r = await call("POST", "/contratos", { tipo: "CONTRATO_SIMPLE", contraparteId: c8.id, datos: { ...comunes, titulo: "Diseño de etiquetas", objeto: "x", obligacionesSolicitante: "x", obligacionesContraparte: "x" } }, s8.t);
const n2 = r.d;
await call("POST", `/contratos/${n2.id}/aceptar`, null, c8.t);
await call("PUT", "/auth/pin", { password: pw, pin: "482915" }, s8.t);
await call("PUT", "/auth/pin", { password: pw, pin: "739204" }, c8.t);
await call("POST", `/contratos/${n2.id}/firmar`, { acepto: true, password: pw, pin: "482915" }, s8.t);
nt = await ultima(c8);
check("firma: avisa a la otra parte que falta su firma", nt?.tipo === "CONTRATO_FIRMADO" && nt.mensaje.includes("«Diseño de etiquetas»") && nt.mensaje.includes("Falta tu firma"), nt?.mensaje);
await call("POST", `/contratos/${n2.id}/firmar`, { acepto: true, password: pw, pin: "739204" }, c8.t);
nt = await ultima(s8);
check("segunda firma: firmado por ambas partes", nt?.tipo === "CONTRATO_FIRMADO" && nt.mensaje.includes("ambas partes"), nt?.mensaje);

r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: c8.id, datos: indefinido }, s8.t);
await call("DELETE", `/contratos/${r.d.id}`, null, s8.t);
nt = await ultima(c8);
check("eliminar avisa a la contraparte", nt?.tipo === "CONTRATO_ELIMINADO", nt?.mensaje);

// Vencimientos
const mutuo = (fecha) => ({ tipo: "MUTUO", contraparteId: c8.id, datos: { ...comunes, fechaInicio: enDias(-30), monto: 100000, formaDevolucion: "Pago único" }, fechaTermino: fecha });
const v3 = (await call("POST", "/contratos", mutuo(enDias(3)), s8.t)).d;
const v0 = (await call("POST", "/contratos", mutuo(enDias(0)), s8.t)).d;
await call("POST", "/contratos", mutuo(enDias(20)), s8.t);
const vEliminado = (await call("POST", "/contratos", mutuo(enDias(2)), s8.t)).d;
await call("DELETE", `/contratos/${vEliminado.id}`, null, s8.t);
let lista = (await notifs(s8)).notificaciones.filter((x) => x.tipo === "VENCIMIENTO_PROXIMO");
check("avisos de vencimiento solo para los próximos 7 días y vigentes", lista.length === 2 && lista.some((x) => x.contratoId === v3.id) && lista.some((x) => x.contratoId === v0.id), lista.map((x) => x.mensaje).join(" | "));
check("texto «en 3 días» y «hoy»", lista.some((x) => x.mensaje.includes("vence en 3 días")) && lista.some((x) => x.mensaje.includes("vence hoy")));
lista = (await notifs(s8)).notificaciones.filter((x) => x.tipo === "VENCIMIENTO_PROXIMO");
check("no se duplican al volver a consultar", lista.length === 2);
check("la contraparte también recibe el aviso", (await notifs(c8)).notificaciones.filter((x) => x.tipo === "VENCIMIENTO_PROXIMO").length === 2);
check("un tercero no recibe avisos ajenos", (await notifs(t8)).notificaciones.length === 0);

// Leídas
let estado8 = await notifs(c8);
const primera = estado8.notificaciones.find((x) => !x.leido);
r = await call("PUT", `/notificaciones/${primera.id}/leido`, null, t8.t);
check("no se marca la notificación de otro -> 404", r.s === 404);
r = await call("PUT", `/notificaciones/${primera.id}/leido`, null, c8.t);
const despues8 = await notifs(c8);
check("marcar una como leída", r.s === 200 && despues8.noLeidas === estado8.noLeidas - 1);
r = await call("PUT", "/notificaciones/leidas", null, c8.t);
check("marcar todas como leídas", r.s === 200 && (await notifs(c8)).noLeidas === 0);

seccion("Usuarios y bloqueos (Etapa 9)");
const s9 = await registrar("SOLICITANTE");
const a9 = await registrar("CONTRAPARTE", { compania: `Panadería Ñuñoa ${sfx}` });
const b9 = await registrar("CONTRAPARTE");
const buscar = async (u, params) => (await call("GET", `/usuarios?${new URLSearchParams(params)}`, null, u.t)).d;
const ids = (lista) => lista.map((x) => x.id);

let lista9 = await buscar(s9, { q: `panadería ñuñoa ${sfx}` });
check("buscar por empresa sin distinguir mayúsculas", ids(lista9).join() === String(a9.id), ids(lista9).join());
lista9 = await buscar(s9, { q: `${sfx}`, role: "CONTRAPARTE" });
check("filtro por rol y sin incluirse a sí mismo", lista9.length >= 2 && lista9.every((u) => u.role === "CONTRAPARTE") && !ids(lista9).includes(s9.id));
lista9 = await buscar(s9, { q: `prueba contraparte ${sfx}-` });
check("búsqueda de varias palabras", ids(lista9).includes(a9.id) && ids(lista9).includes(b9.id));
r = await call("GET", `/usuarios/${a9.id}`, null, s9.t);
check("perfil con contacto y sin bloqueo", r.s === 200 && r.d.email && r.d.bloqueadoPorMi === false && r.d.meBloqueo === false);

r = await call("POST", `/usuarios/${s9.id}/bloqueo`, null, s9.t);
check("no puede bloquearse a sí mismo -> 400", r.s === 400);
r = await call("POST", "/usuarios/999999/bloqueo", null, s9.t);
check("bloquear a un usuario inexistente -> 404", r.s === 404);
r = await call("POST", `/usuarios/${a9.id}/bloqueo`, null, s9.t);
check("bloquear", r.s === 200 && r.d.bloqueadoPorMi);
r = await call("POST", `/usuarios/${a9.id}/bloqueo`, null, s9.t);
check("bloquear dos veces no falla", r.s === 200);
lista9 = await buscar(s9, { q: `${sfx}` });
check("quien bloquea sigue viendo al bloqueado, marcado", lista9.find((u) => u.id === a9.id)?.bloqueadoPorMi === true);
lista9 = await buscar(s9, { q: `${sfx}`, role: "CONTRAPARTE", disponibles: 1 });
check("«disponibles» excluye a los bloqueados", !ids(lista9).includes(a9.id) && ids(lista9).includes(b9.id));
lista9 = await buscar(a9, { q: `${sfx}` });
check("el bloqueado deja de ver a quien lo bloqueó", !ids(lista9).includes(s9.id));
r = await call("GET", `/usuarios/${s9.id}`, null, a9.t);
check("el bloqueado ve un perfil sin datos de contacto", r.s === 200 && r.d.meBloqueo === true && !("email" in r.d) && !("phone" in r.d));
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: a9.id, datos: indefinido }, s9.t);
check("no se ofrece contrato a un bloqueado -> 403", r.s === 403);
r = await call("GET", "/usuarios/bloqueados", null, s9.t);
check("lista de bloqueados", r.s === 200 && ids(r.d).join() === String(a9.id) && r.d[0].bloqueadoDesde);
r = await call("DELETE", `/usuarios/${a9.id}/bloqueo`, null, s9.t);
check("desbloquear", r.s === 200 && r.d.bloqueadoPorMi === false);
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: a9.id, datos: indefinido }, s9.t);
check("tras desbloquear se puede ofrecer", r.s === 201);
await call("POST", `/usuarios/${s9.id}/bloqueo`, null, a9.t);
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: a9.id, datos: indefinido }, s9.t);
check("tampoco si la contraparte bloqueó al solicitante -> 403", r.s === 403);
r = await call("GET", `/usuarios/${a9.id}`, null, s9.t);
check("el solicitante ve a la contraparte como «no disponible»", r.d.meBloqueo === true && !("email" in r.d));
r = await call("GET", "/contratos/buscar", null, s9.t);
check("los contratos existentes siguen visibles", r.s === 200 && r.d.some((c) => c.contraparteId === a9.id));
await call("DELETE", `/usuarios/${s9.id}/bloqueo`, null, a9.t);

seccion("Solicitudes de cambio (Etapa 10)");
const s10 = await registrar("SOLICITANTE");
const c10 = await registrar("CONTRAPARTE");
const x10 = await registrar("CONTRAPARTE");
await call("PUT", "/auth/pin", { password: pw, pin: "482915" }, s10.t);
await call("PUT", "/auth/pin", { password: pw, pin: "739204" }, c10.t);
const firmar10 = (id, u, pin) => call("POST", `/contratos/${id}/firmar`, { acepto: true, password: pw, pin }, u.t);
const sol10 = (id, body, u = s10) => call("POST", `/contratos/${id}/solicitudes`, body, u.t);
const ultima10 = async (u) => (await call("GET", "/notificaciones", null, u.t)).d.notificaciones[0];

r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: c10.id, datos: indefinido }, s10.t);
const k1 = r.d;
r = await sol10(k1.id, { tipo: "ELIMINACION", motivo: "x" });
check("sin firmas no se solicita (se edita directo) -> 400", r.s === 400);
await call("POST", `/contratos/${k1.id}/aceptar`, null, c10.t);
await firmar10(k1.id, s10, "482915");
await firmar10(k1.id, c10, "739204");
const huellaOriginal = (await call("GET", `/contratos/${k1.id}`, null, s10.t)).d.hashContenido;

r = await sol10(k1.id, { tipo: "EDICION", motivo: "x", datos: indefinido }, c10);
check("la contraparte no crea solicitudes -> 403", r.s === 403);
r = await sol10(k1.id, { tipo: "OTRO", motivo: "x" });
check("tipo inválido -> 400", r.s === 400);
r = await sol10(k1.id, { tipo: "EDICION", motivo: "  ", datos: { ...indefinido, cargo: "X" } });
check("motivo obligatorio -> 400", r.s === 400 && r.d.errores?.motivo);
r = await sol10(k1.id, { tipo: "EDICION", motivo: "Ajuste", datos: indefinido });
check("edición sin cambios -> 400", r.s === 400);
r = await sol10(k1.id, { tipo: "EDICION", motivo: "Ajuste", datos: { ...indefinido, remuneracionMensual: -1 } });
check("edición con datos inválidos -> 400 con detalle", r.s === 400 && r.d.errores?.remuneracionMensual);
r = await sol10(k1.id, { tipo: "EDICION", motivo: "Ascenso a jefatura", datos: { ...indefinido, cargo: "Jefe de área" } });
check("crear solicitud de edición", r.s === 201 && r.d.estado === "PENDIENTE" && r.d.cambios.join() === "Cargo" && r.d.propuesta.datos.cargo === "Jefe de área");
const q1 = r.d;
let nt10 = await ultima10(c10);
check("la contraparte recibe SOLICITUD_CAMBIO", nt10.tipo === "SOLICITUD_CAMBIO" && nt10.mensaje.includes("solicita editar") && nt10.contratoId === k1.id, nt10.mensaje);
r = await sol10(k1.id, { tipo: "ELIMINACION", motivo: "x" });
check("solo una solicitud pendiente a la vez -> 409", r.s === 409);
r = await call("GET", `/contratos/${k1.id}/solicitudes`, null, x10.t);
check("un tercero no ve las solicitudes -> 403", r.s === 403);
r = await call("POST", `/contratos/${k1.id}/solicitudes/${q1.id}/aprobar`, null, s10.t);
check("el solicitante no se aprueba a sí mismo -> 403", r.s === 403);
r = await call("POST", `/contratos/${k1.id}/solicitudes/${q1.id}/rechazar`, { respuesta: "Prefiero mantener el cargo." }, c10.t);
check("rechazar solicitud", r.s === 200);
r = await call("GET", `/contratos/${k1.id}`, null, s10.t);
check("tras el rechazo el contrato sigue igual y firmado", r.d.estado === "FIRMADO" && r.d.datos.cargo === "Analista" && r.d.firmaSolicitanteHash === huellaOriginal);
nt10 = await ultima10(s10);
check("el solicitante recibe la respuesta", nt10.tipo === "SOLICITUD_RESPONDIDA" && nt10.mensaje.includes("Prefiero mantener el cargo."), nt10.mensaje);
r = await call("POST", `/contratos/${k1.id}/solicitudes/${q1.id}/aprobar`, null, c10.t);
check("no se responde una solicitud ya respondida -> 400", r.s === 400);

r = await sol10(k1.id, { tipo: "EDICION", motivo: "Ascenso aprobado", datos: { ...indefinido, cargo: "Jefe de área" }, fechaTermino: "2027-12-31" });
const q2 = r.d;
check("nueva solicitud con cargo y fecha de término", r.s === 201 && q2.cambios.join() === "Cargo,Fecha de término", q2.cambios?.join());
r = await call("POST", `/contratos/${k1.id}/solicitudes/${q2.id}/aprobar`, null, c10.t);
check("aprobar edición: nueva versión, firmas reiniciadas, ACEPTADO",
  r.s === 200 && r.d.contrato.datos.cargo === "Jefe de área" && r.d.contrato.estado === "ACEPTADO" &&
  !r.d.contrato.firmadoSolicitante && !r.d.contrato.firmadoContraparte && r.d.contrato.firmaSolicitanteHash === null && r.d.contrato.fechaTermino.startsWith("2027-12-31"));
r = await call("GET", `/contratos/${k1.id}/historial`, null, s10.t);
check("historial registra solicitud y aprobación", ["Solicitud de edición enviada", "Solicitud de edición rechazada", "Solicitud de edición aprobada"].every((e) => r.d.some((a) => a.evento === e)));
await firmar10(k1.id, s10, "482915");
r = await firmar10(k1.id, c10, "739204");
check("ambas partes vuelven a firmar la nueva versión", r.s === 200 && r.d.contrato.estado === "FIRMADO" && r.d.huella !== huellaOriginal);

// Firma bloqueada mientras hay una solicitud pendiente
r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: c10.id, datos: indefinido }, s10.t);
const k2 = r.d;
await call("POST", `/contratos/${k2.id}/aceptar`, null, c10.t);
await firmar10(k2.id, s10, "482915");
r = await sol10(k2.id, { tipo: "EDICION", motivo: "Corregir funciones", datos: { ...indefinido, funciones: "Análisis y reportes" } });
const q3 = r.d;
check("solicitud sobre un contrato con una sola firma", r.s === 201);
r = await firmar10(k2.id, c10, "739204");
check("no se firma con una solicitud pendiente -> 409", r.s === 409);
r = await call("POST", `/contratos/${k2.id}/solicitudes/${q3.id}/cancelar`, null, c10.t);
check("la contraparte no cancela -> 403", r.s === 403);
r = await call("POST", `/contratos/${k2.id}/solicitudes/${q3.id}/cancelar`, null, s10.t);
check("el solicitante cancela", r.s === 200);
r = await call("POST", `/contratos/${k2.id}/solicitudes/${q3.id}/aprobar`, null, c10.t);
check("no se aprueba una cancelada -> 400", r.s === 400);
r = await firmar10(k2.id, c10, "739204");
check("tras cancelar se puede firmar", r.s === 200 && r.d.contrato.estado === "FIRMADO");

// Eliminación
r = await sol10(k2.id, { tipo: "ELIMINACION", motivo: "Ya no se requiere el servicio." });
const q4 = r.d;
check("crear solicitud de eliminación", r.s === 201 && q4.propuesta === null);
r = await call("POST", `/contratos/${k2.id}/solicitudes/${q4.id}/aprobar`, null, c10.t);
check("aprobar eliminación deja el contrato ELIMINADO", r.s === 200 && r.d.contrato.estado === "ELIMINADO");
r = await sol10(k2.id, { tipo: "EDICION", motivo: "x", datos: indefinido });
check("no se solicitan cambios sobre un eliminado -> 400", r.s === 400);
r = await call("GET", `/contratos/${k2.id}/solicitudes`, null, c10.t);
check("listar solicitudes (más reciente primero)", r.s === 200 && r.d.length === 2 && r.d[0].estado === "APROBADA" && r.d[1].estado === "CANCELADA");

seccion("Opciones de usuario (Etapa 11)");
const u11 = await registrar("SOLICITANTE");
const email11 = `solicitante${sfx}-${n}@test.local`;
r = await call("GET", "/auth/yo", null, u11.t);
check("cuenta con fecha de alta y sin hashes", r.s === 200 && r.d.createdAt && !("passwordHash" in r.d) && !("pinFirmaHash" in r.d) && r.d.tienePin === false);
r = await call("PUT", "/auth/yo", { nombre: " ", apellido: "", telefono: "abc" }, u11.t);
check("datos inválidos -> 400 con detalle", r.s === 400 && r.d.errores.nombre && r.d.errores.apellido && r.d.errores.telefono);
r = await call("PUT", "/auth/yo", { nombre: "  Ana ", apellido: "Pérez", telefono: "+56 9 1234 5678", compania: "Ana Diseño SpA", email: "otro@test.local" }, u11.t);
check("actualizar datos (empresa -> cuenta EMPRESA)", r.s === 200 && r.d.user.firstName === "Ana" && r.d.user.accountType === "EMPRESA" && r.d.user.phone === "+56 9 1234 5678");
check("el correo no cambia", r.d.user.email === email11, r.d.user.email);
r = await call("PUT", "/auth/yo", { nombre: "Ana", apellido: "Pérez", telefono: "", compania: "" }, u11.t);
check("quitar empresa -> cuenta INDIVIDUAL y teléfono vacío", r.s === 200 && r.d.user.accountType === "INDIVIDUAL" && r.d.user.phone === null && r.d.user.company === null);
r = await call("GET", `/usuarios/${u11.id}`, null, s9.t);
check("el perfil público refleja los cambios", r.d.firstName === "Ana" && r.d.lastName === "Pérez");

r = await call("PUT", "/auth/password", { actual: "incorrecta123", nueva: "nueva-clave-123" }, u11.t);
check("contraseña actual incorrecta -> 422 (no 401)", r.s === 422 && r.d.errores.actual);
r = await call("PUT", "/auth/password", { actual: pw, nueva: "corta" }, u11.t);
check("nueva contraseña corta -> 400", r.s === 400 && r.d.errores.nueva);
r = await call("PUT", "/auth/password", { actual: pw, nueva: pw }, u11.t);
check("nueva igual a la actual -> 400", r.s === 400);
r = await call("PUT", "/auth/password", { actual: pw, nueva: "nueva-clave-123" }, u11.t);
check("cambiar contraseña devuelve un token nuevo", r.s === 200 && typeof r.d.token === "string");
const tokenAnterior11 = u11.t;
u11.t = r.d.token;
r = await call("GET", "/auth/yo", null, tokenAnterior11);
check("la sesión anterior queda cerrada -> 401", r.s === 401);
r = await call("GET", "/auth/yo", null, u11.t);
check("la sesión actual sigue con el token nuevo", r.s === 200);
r = await call("POST", "/auth/login", { email: email11, password: pw });
check("la contraseña anterior ya no sirve", r.s === 401);
r = await call("POST", "/auth/login", { email: email11, password: "nueva-clave-123" });
check("inicia sesión con la nueva", r.s === 200 && r.d.user.firstName === "Ana" && r.d.user.createdAt);
r = await call("PUT", "/auth/pin", { password: "nueva-clave-123", pin: "482915" }, u11.t);
check("crear PIN con la nueva contraseña", r.s === 200);
r = await call("PUT", "/auth/pin", { password: "nueva-clave-123", pinActual: "482915", pin: "604172" }, u11.t);
check("cambiar PIN con el actual", r.s === 200 && r.d.message.includes("actualizado"));
r = await call("GET", "/auth/yo", null, u11.t);
check("la cuenta indica que tiene PIN", r.d.tienePin === true);

seccion("Documentos adjuntos (Etapa 12)");
const { createHash } = await import("node:crypto");
const { existsSync } = await import("node:fs");
const CARPETA = fileURLToPath(new URL("../uploads/documentos", import.meta.url));
const s12 = await registrar("SOLICITANTE");
const c12 = await registrar("CONTRAPARTE");
const x12 = await registrar("CONTRAPARTE");
await call("PUT", "/auth/pin", { password: pw, pin: "482915" }, s12.t);
await call("PUT", "/auth/pin", { password: pw, pin: "739204" }, c12.t);
const subir = async (contratoId, u, nombre, bytes, descripcion) => {
  const fd = new FormData();
  fd.append("archivo", new Blob([bytes]), nombre);
  if (descripcion) fd.append("descripcion", descripcion);
  const res = await fetch(`${B}/contratos/${contratoId}/documentos`, { method: "POST", headers: { Authorization: `Bearer ${u.t}` }, body: fd });
  return { s: res.status, d: await res.json().catch(() => null) };
};
const pdf = Buffer.from("%PDF-1.4\n% documento de prueba\n%%EOF\n");
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("datos")]);
const huellaDe = async (id) => (await call("GET", `/contratos/${id}`, null, s12.t)).d.hashContenido;

r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: c12.id, datos: indefinido }, s12.t);
const d1 = r.d;
const huellaSinDocs = await huellaDe(d1.id);
r = await subir(d1.id, s12, "Cédula Ñuñoa.pdf", pdf, "Copia de cédula");
check("adjuntar PDF (nombre con tildes y ñ)", r.s === 201 && r.d.nombre === "Cédula Ñuñoa.pdf" && r.d.tamano === pdf.length && r.d.descripcion === "Copia de cédula", r.d?.nombre);
const doc1 = r.d;
check("huella SHA-256 del archivo", doc1.hash === createHash("sha256").update(pdf).digest("hex"));
check("no expone la ruta interna del archivo", !("archivo" in doc1));
const huellaConDoc = await huellaDe(d1.id);
check("la huella del contrato cambia al adjuntar", huellaConDoc !== huellaSinDocs);
let nt12 = (await call("GET", "/notificaciones", null, c12.t)).d.notificaciones[0];
check("la otra parte recibe DOCUMENTO_ADJUNTO", nt12.tipo === "DOCUMENTO_ADJUNTO" && nt12.mensaje.includes("Cédula Ñuñoa.pdf"), nt12.mensaje);
r = await subir(d1.id, c12, "foto.png", png);
check("la contraparte también adjunta (PNG)", r.s === 201);
const doc2 = r.d;

r = await subir(d1.id, s12, "falso.png", Buffer.from("esto no es una imagen"));
check("contenido que no coincide con la extensión -> 415", r.s === 415);
r = await subir(d1.id, s12, "programa.exe", Buffer.from("MZ..."));
check("extensión no permitida -> 415", r.s === 415);
r = await subir(d1.id, s12, "vacio.pdf", Buffer.alloc(0));
check("archivo vacío -> 400", r.s === 400);
r = await subir(d1.id, s12, "grande.pdf", Buffer.concat([pdf, Buffer.alloc(10 * 1024 * 1024)]));
check("más de 10 MB -> 413", r.s === 413);
r = await subir(d1.id, s12, "../../../evil.pdf", pdf);
check("nombre con ruta se neutraliza", r.s === 201 && !r.d.nombre.includes("/") && !r.d.nombre.includes("\\"), r.d?.nombre);
await call("DELETE", `/contratos/${d1.id}/documentos/${r.d.id}`, null, s12.t);
r = await subir(d1.id, x12, "intruso.pdf", pdf);
check("un tercero no adjunta -> 403", r.s === 403);
r = await call("GET", `/contratos/${d1.id}/documentos`, null, x12.t);
check("un tercero no ve la lista -> 403", r.s === 403);

r = await call("GET", `/contratos/${d1.id}/documentos`, null, c12.t);
check("listar documentos", r.s === 200 && r.d.documentos.length === 2 && r.d.editables === true && r.d.maximo === 10);
let res12 = await fetch(`${B}/contratos/${d1.id}/documentos/${doc1.id}`, { headers: { Authorization: `Bearer ${c12.t}` } });
let cuerpo = Buffer.from(await res12.arrayBuffer());
check("descargar: contenido idéntico, tipo y nombre",
  res12.status === 200 && cuerpo.equals(pdf) && res12.headers.get("content-type").startsWith("application/pdf") &&
  res12.headers.get("content-disposition").startsWith("attachment") && res12.headers.get("content-disposition").includes("UTF-8''C%C3%A9dula") &&
  res12.headers.get("x-content-type-options") === "nosniff");
res12 = await fetch(`${B}/contratos/${d1.id}/documentos/${doc1.id}?ver=1`, { headers: { Authorization: `Bearer ${s12.t}` } });
check("?ver=1 se muestra en línea", res12.headers.get("content-disposition").startsWith("inline"));
res12 = await fetch(`${B}/contratos/${d1.id}/documentos/${doc1.id}`, { headers: { Authorization: `Bearer ${x12.t}` } });
check("un tercero no descarga -> 403", res12.status === 403);

r = await call("DELETE", `/contratos/${d1.id}/documentos/${doc1.id}`, null, c12.t);
check("no se elimina un documento ajeno -> 403", r.s === 403);
const archivo2 = (await prisma.documentoContrato.findUnique({ where: { id: doc2.id } })).archivo;
check("el archivo está en la carpeta local", existsSync(`${CARPETA}/${archivo2}`));
r = await call("DELETE", `/contratos/${d1.id}/documentos/${doc2.id}`, null, c12.t);
check("eliminar documento propio borra también el archivo", r.s === 200 && !existsSync(`${CARPETA}/${archivo2}`));
check("la huella vuelve a reflejar solo el documento restante", (await huellaDe(d1.id)) === huellaConDoc);

await call("POST", `/contratos/${d1.id}/aceptar`, null, c12.t);
r = await call("POST", `/contratos/${d1.id}/firmar`, { acepto: true, password: pw, pin: "482915" }, s12.t);
check("la firma cubre los documentos", r.s === 200 && r.d.huella === huellaConDoc);
r = await subir(d1.id, c12, "tarde.pdf", pdf);
check("con firmas no se adjunta -> 409", r.s === 409);
r = await call("DELETE", `/contratos/${d1.id}/documentos/${doc1.id}`, null, s12.t);
check("con firmas no se elimina -> 409", r.s === 409);
r = await call("GET", `/contratos/${d1.id}/documentos`, null, s12.t);
check("la lista indica que ya no son editables", r.d.editables === false);
r = await call("POST", `/contratos/${d1.id}/firmar`, { acepto: true, password: pw, pin: "739204" }, c12.t);
check("ambas firmas con la misma huellaDe (incluye el documento)", r.s === 200 && r.d.huella === huellaConDoc);
r = await call("GET", `/contratos/${d1.id}`, null, s12.t);
check("el contenido sigue coincidiendo con lo firmado", r.d.hashContenido === r.d.firmaSolicitanteHash && r.d.cantidadDocumentos === 1);

r = await call("POST", "/contratos", { tipo: "INDEFINIDO", contraparteId: c12.id, datos: indefinido }, s12.t);
for (let i = 0; i < 10; i++) await subir(r.d.id, s12, `doc${i}.pdf`, pdf);
const once = await subir(r.d.id, s12, "once.pdf", pdf);
check("máximo 10 documentos por contrato -> 409", once.s === 409);

seccion("Descarga en PDF (Etapa 13)");
// d1: contrato de la Etapa 12, firmado por ambas partes y con un documento adjunto
const pdfDe = async (id, u, extra = {}) => {
  const res = await fetch(`${B}/contratos/${id}/pdf`, { headers: { ...(u ? { Authorization: `Bearer ${u.t}` } : {}), ...extra } });
  return { res, cuerpo: Buffer.from(await res.arrayBuffer()) };
};
let p13 = await pdfDe(d1.id, s12, { Origin: "http://localhost:5173" });
check("el solicitante descarga el PDF", p13.res.status === 200 && p13.res.headers.get("content-type") === "application/pdf" && p13.cuerpo.subarray(0, 5).toString() === "%PDF-");
check("nombre de archivo legible", /^attachment; filename="contrato-\d+-contrato-de-trabajo-indefinido\.pdf"$/.test(p13.res.headers.get("content-disposition")), p13.res.headers.get("content-disposition"));
check("Content-Length correcto", Number(p13.res.headers.get("content-length")) === p13.cuerpo.length);
check("CORS expone Content-Disposition al cliente", (p13.res.headers.get("access-control-expose-headers") ?? "").includes("Content-Disposition"));
check("PDF completo (termina en %%EOF)", p13.cuerpo.subarray(-6).toString().includes("%%EOF"));
p13 = await pdfDe(d1.id, c12);
check("la contraparte también descarga", p13.res.status === 200);
p13 = await pdfDe(d1.id, x12);
check("un tercero no descarga -> 403", p13.res.status === 403);
p13 = await pdfDe(d1.id, null);
check("sin sesión -> 401", p13.res.status === 401);
p13 = await pdfDe(999999, s12);
check("contrato inexistente -> 404", p13.res.status === 404);
p13 = await pdfDe("abc", s12);
check("id inválido -> 400", p13.res.status === 400);
p13 = await pdfDe(k2.id, s10);
check("un contrato eliminado también se descarga (con marca)", p13.res.status === 200);

seccion("Recuperar contraseña (extra)");
const fsr = await import("node:fs/promises");
const CORREOS = fileURLToPath(new URL("../correos", import.meta.url));
const correosPara = async (email) => {
  const archivos = await fsr.readdir(CORREOS).catch(() => []);
  return archivos.filter((a) => a.endsWith(`_${email}.eml`)).sort();
};
// Lee el último correo para «email» y devuelve el token del enlace (decodifica quoted-printable)
const tokenDelCorreo = async (email) => {
  const archivos = await correosPara(email);
  if (archivos.length === 0) return null;
  const texto = (await fsr.readFile(`${CORREOS}/${archivos.at(-1)}`, "utf8")).replace(/=\r?\n/g, "").replace(/=3D/g, "=");
  return /restablecer\?token=([A-Za-z0-9_-]{43})/.exec(texto)?.[1] ?? null;
};
const r14 = await registrar("SOLICITANTE");
const email14 = `solicitante${sfx}-${n}@test.local`;

r = await call("POST", "/auth/recuperacion/solicitar", { email: `nadie${sfx}@test.local` });
const generica = r.d.message;
check("correo desconocido: respuesta genérica y sin envío", r.s === 200 && (await correosPara(`nadie${sfx}@test.local`)).length === 0);
r = await call("POST", "/auth/recuperacion/solicitar", { email: email14.toUpperCase() });
check("correo existente: misma respuesta (no revela si existe)", r.s === 200 && r.d.message === generica);
const token1 = await tokenDelCorreo(email14);
check("en modo local el correo queda en server/correos con el enlace", typeof token1 === "string");
check("en la base solo se guarda el hash del token", !(await prisma.recuperacionPassword.findFirst({ where: { tokenHash: token1 } })));
r = await call("GET", `/auth/recuperacion/validar?token=${token1}`);
check("validar enlace vigente (correo enmascarado)", r.s === 200 && r.d.valido && r.d.email.includes("•") && !r.d.email.includes(email14.split("@")[0]));
r = await call("GET", "/auth/recuperacion/validar?token=inventado");
check("token inválido -> 410", r.s === 410);

await call("POST", "/auth/recuperacion/solicitar", { email: email14 });
const token2 = await tokenDelCorreo(email14);
r = await call("GET", `/auth/recuperacion/validar?token=${token1}`);
check("una nueva solicitud invalida el enlace anterior", r.s === 410 && token2 !== token1);
r = await call("POST", "/auth/recuperacion/restablecer", { token: token2, nueva: "corta" });
check("nueva contraseña corta -> 400", r.s === 400);
r = await call("POST", "/auth/recuperacion/restablecer", { token: token2, nueva: "recuperada-123" });
check("restablecer la contraseña", r.s === 200);
r = await call("GET", "/auth/yo", null, r14.t);
check("las sesiones abiertas se cierran -> 401", r.s === 401);
r = await call("POST", "/auth/login", { email: email14, password: pw });
check("la contraseña anterior ya no sirve", r.s === 401);
r = await call("POST", "/auth/login", { email: email14, password: "recuperada-123" });
check("inicia sesión con la nueva", r.s === 200);
r = await call("POST", "/auth/recuperacion/restablecer", { token: token2, nueva: "otra-clave-123" });
check("el enlace sirve una sola vez -> 410", r.s === 410);
const avisos = await correosPara(email14);
const ultimo = await fsr.readFile(`${CORREOS}/${avisos.at(-1)}`, "utf8");
check("se envía un aviso de que la contraseña cambió", /Subject: =\?UTF-8\?Q\?Tu_contrase|fue cambiada/i.test(ultimo));

await call("POST", "/auth/recuperacion/solicitar", { email: email14 });
const vencido = await tokenDelCorreo(email14);
await prisma.recuperacionPassword.updateMany({ where: { usuarioId: r14.id, usadoEn: null }, data: { expiraEn: new Date(Date.now() - 1000) } });
r = await call("POST", "/auth/recuperacion/restablecer", { token: vencido, nueva: "otra-clave-123" });
check("un enlace vencido no sirve -> 410", r.s === 410);
const antesLimite = (await correosPara(email14)).length;
await call("POST", "/auth/recuperacion/solicitar", { email: email14 });
r = await call("POST", "/auth/recuperacion/solicitar", { email: email14 });
check("límite de solicitudes: responde igual pero no envía más correos", r.s === 200 && r.d.message === generica && (await correosPara(email14)).length === antesLimite);
r = await call("POST", "/auth/recuperacion/solicitar", {});
check("sin correo -> 400", r.s === 400);

await prisma.$disconnect();
console.log(`\n${ok} OK, ${fail} FAIL`);
process.exitCode = fail > 0 ? 1 : 0;
