// Recuperación de contraseña por correo.
//   POST /solicitar   { email }          → siempre la misma respuesta (no revela si la cuenta existe)
//   GET  /validar?token=…                → indica si el enlace sigue vigente
//   POST /restablecer { token, nueva }   → cambia la contraseña y cierra todas las sesiones
// El token viaja solo en el correo; en la base se guarda su hash SHA-256.
import crypto from "node:crypto";
import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { enviarCorreo, plantillaCorreo } from "../correo.js";

const router = express.Router();

const MINUTOS_VIGENCIA = 30;
const MAX_SOLICITUDES = 3; // por cuenta, en la ventana de abajo
const VENTANA_MINUTOS = 15;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const normalizarEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const RESPUESTA_GENERICA = {
  message: "Si el correo corresponde a una cuenta de Net-Xe, te enviamos un enlace para restablecer tu contraseña. Revisa también la carpeta de spam."
};

// Busca una solicitud vigente (no usada ni vencida) a partir del token recibido
async function recuperacionVigente(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const registro = await prisma.recuperacionPassword.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { select: { id: true, email: true, firstName: true } } }
  });
  if (!registro || registro.usadoEn || registro.expiraEn <= new Date()) return null;
  return registro;
}

function enmascarar(email) {
  const [usuario, dominio] = email.split("@");
  return `${usuario.slice(0, 2)}${"•".repeat(Math.max(usuario.length - 2, 1))}@${dominio}`;
}

router.post("/solicitar", async (req, res) => {
  const email = normalizarEmail(req.body.email);
  if (!email) return res.status(400).json({ error: "Ingresa tu correo electrónico." });

  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario) return res.json(RESPUESTA_GENERICA);

  // Límite de solicitudes: se responde igual, pero no se envía otro correo
  const recientes = await prisma.recuperacionPassword.count({
    where: { usuarioId: usuario.id, createdAt: { gte: new Date(Date.now() - VENTANA_MINUTOS * 60000) } }
  });
  if (recientes >= MAX_SOLICITUDES) return res.json(RESPUESTA_GENERICA);

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.$transaction([
    // Una nueva solicitud invalida los enlaces anteriores sin usar
    prisma.recuperacionPassword.updateMany({
      where: { usuarioId: usuario.id, usadoEn: null },
      data: { usadoEn: new Date() }
    }),
    prisma.recuperacionPassword.create({
      data: { usuarioId: usuario.id, tokenHash: hashToken(token), expiraEn: new Date(Date.now() + MINUTOS_VIGENCIA * 60000) }
    })
  ]);

  const enlace = `${process.env.APP_URL || "http://localhost:5173"}/restablecer?token=${token}`;
  try {
    await enviarCorreo({
      para: usuario.email,
      asunto: "Restablece tu contraseña de Net-Xe",
      texto:
        `Hola ${usuario.firstName}:\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta de Net-Xe.\n` +
        `Abre este enlace para elegir una nueva (vence en ${MINUTOS_VIGENCIA} minutos y sirve una sola vez):\n\n${enlace}\n\n` +
        "Si no fuiste tú, ignora este correo: tu contraseña no cambiará.",
      html: plantillaCorreo({
        titulo: "Restablece tu contraseña",
        parrafos: [
          `Hola ${usuario.firstName}:`,
          "Recibimos una solicitud para restablecer la contraseña de tu cuenta de Net-Xe.",
          `El enlace vence en ${MINUTOS_VIGENCIA} minutos y sirve una sola vez.`
        ],
        boton: { texto: "Elegir una nueva contraseña", url: enlace },
        pie: "Si no fuiste tú, ignora este correo: tu contraseña no cambiará."
      })
    });
  } catch (err) {
    console.error("Error enviando el correo de recuperación:", err);
    return res.status(502).json({ error: "No pudimos enviar el correo en este momento. Intenta nuevamente más tarde." });
  }

  res.json(RESPUESTA_GENERICA);
});

router.get("/validar", async (req, res) => {
  const registro = await recuperacionVigente(req.query.token);
  if (!registro) return res.status(410).json({ valido: false, error: "El enlace no es válido o ya venció. Solicita uno nuevo." });
  res.json({ valido: true, email: enmascarar(registro.usuario.email), expiraEn: registro.expiraEn });
});

router.post("/restablecer", async (req, res) => {
  const { token, nueva } = req.body;
  const registro = await recuperacionVigente(token);
  if (!registro) return res.status(410).json({ error: "El enlace no es válido o ya venció. Solicita uno nuevo." });
  if (typeof nueva !== "string" || nueva.length < 8) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres.", errores: { nueva: "Debe tener al menos 8 caracteres." } });
  }

  const ahora = new Date();
  // El enlace se marca como usado solo si sigue sin usar, para que no sirva dos veces
  const [marcado] = await prisma.$transaction([
    prisma.recuperacionPassword.updateMany({ where: { id: registro.id, usadoEn: null }, data: { usadoEn: ahora } }),
    prisma.user.update({
      where: { id: registro.usuarioId },
      data: {
        passwordHash: await bcrypt.hash(nueva, 10),
        credencialesCambiadasEn: ahora,
        // Una recuperación exitosa también levanta un bloqueo de firma por intentos
        intentosFirmaFallidos: 0,
        firmaBloqueadaHasta: null
      }
    })
  ]);
  if (marcado.count === 0) return res.status(410).json({ error: "El enlace ya fue usado. Solicita uno nuevo." });

  try {
    await enviarCorreo({
      para: registro.usuario.email,
      asunto: "Tu contraseña de Net-Xe fue cambiada",
      texto:
        `Hola ${registro.usuario.firstName}:\n\nLa contraseña de tu cuenta de Net-Xe se cambió el ${ahora.toLocaleString("es-CL", { timeZone: "America/Santiago" })}.\n` +
        "Por seguridad, cerramos las sesiones abiertas. Si no fuiste tú, restablece tu contraseña de inmediato.",
      html: plantillaCorreo({
        titulo: "Tu contraseña fue cambiada",
        parrafos: [
          `Hola ${registro.usuario.firstName}:`,
          `La contraseña de tu cuenta de Net-Xe se cambió el ${ahora.toLocaleString("es-CL", { timeZone: "America/Santiago" })}.`,
          "Por seguridad, cerramos las sesiones abiertas en otros dispositivos."
        ],
        pie: "Si no fuiste tú, restablece tu contraseña de inmediato desde «¿Olvidaste tu contraseña?»."
      })
    });
  } catch (err) {
    // La contraseña ya cambió: el aviso es complementario
    console.error("Error enviando el aviso de cambio de contraseña:", err);
  }

  res.json({ message: "Tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva." });
});

export default router;
