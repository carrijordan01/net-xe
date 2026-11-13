import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import requireAuth from '../middleware/auth.js';
import { errorFormatoPin, hashearPin, verificarCredencialesFirma } from '../firma.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizarEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

function emitirToken(user) {
  return jwt.sign(
    // «emitidoEn» (ms) permite invalidar sesiones con precisión al cambiar la contraseña
    { sub: user.id, email: user.email, accountType: user.accountType, role: user.role, emitidoEn: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      password,
      role,
      compania,
      telefono
    } = req.body;
    const email = normalizarEmail(req.body.email);

    if (!email || !password || !nombre?.trim() || !apellido?.trim()) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Correo electrónico inválido" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    const allowedRoles = ["SOLICITANTE", "CONTRAPARTE"];
    const normalizedRole = (role || "SOLICITANTE").toString().toUpperCase();
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ error: "Rol invalido" });
    }

    // Si representa a una empresa la cuenta es EMPRESA; si no, INDIVIDUAL
    const normalizedAccountType = compania?.trim() ? "EMPRESA" : "INDIVIDUAL";

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: nombre.trim(),
        lastName: apellido.trim(),
        company: compania?.trim() || null,
        phone: telefono?.trim() || null,
        accountType: normalizedAccountType,
        role: normalizedRole
      }
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        phone: user.phone,
        accountType: user.accountType,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Error registrando usuario:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

router.post("/login", async (req, res) => {
  const { password } = req.body;
  const email = normalizarEmail(req.body.email);

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    const isValid = user && password && await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = emitirToken(user);

    return res.json({
      message: "Login exitoso",
      token,
      user: datosCuenta(user)
    });

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

// Datos de la cuenta en sesión
function datosCuenta(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    company: user.company,
    phone: user.phone,
    accountType: user.accountType,
    role: user.role,
    createdAt: user.createdAt,
    tienePin: Boolean(user.pinFirmaHash),
    firmaBloqueadaHasta: user.firmaBloqueadaHasta > new Date() ? user.firmaBloqueadaHasta : null
  };
}

router.get("/yo", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(datosCuenta(user));
});

const TELEFONO_REGEX = /^\+?[\d\s()-]{6,20}$/;

// Actualizar datos personales: { nombre, apellido, telefono, compania }.
// El correo no se cambia: es el identificador para iniciar sesión.
router.put("/yo", requireAuth, async (req, res) => {
  const texto = (v) => (typeof v === "string" ? v.trim() : "");
  const nombre = texto(req.body.nombre);
  const apellido = texto(req.body.apellido);
  const telefono = texto(req.body.telefono);
  const compania = texto(req.body.compania);

  const errores = {};
  if (!nombre) errores.nombre = "Ingresa tu nombre.";
  else if (nombre.length > 100) errores.nombre = "Es demasiado largo.";
  if (!apellido) errores.apellido = "Ingresa tu apellido.";
  else if (apellido.length > 100) errores.apellido = "Es demasiado largo.";
  if (telefono && !TELEFONO_REGEX.test(telefono)) errores.telefono = "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678.";
  if (compania.length > 150) errores.compania = "Es demasiado largo.";
  if (Object.keys(errores).length > 0) return res.status(400).json({ error: "Revisa tus datos.", errores });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName: nombre,
      lastName: apellido,
      phone: telefono || null,
      company: compania || null,
      accountType: compania ? "EMPRESA" : "INDIVIDUAL"
    }
  });
  res.json({ message: "Datos actualizados.", user: datosCuenta(user) });
});

// Cambiar la contraseña: { actual, nueva }
router.put("/password", requireAuth, async (req, res) => {
  const { actual, nueva } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  if (typeof actual !== "string" || !(await bcrypt.compare(actual, user.passwordHash))) {
    // 422 y no 401: el cliente interpreta un 401 como sesión expirada
    return res.status(422).json({ error: "La contraseña actual es incorrecta.", errores: { actual: "La contraseña actual es incorrecta." } });
  }
  if (typeof nueva !== "string" || nueva.length < 8) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres.", errores: { nueva: "Debe tener al menos 8 caracteres." } });
  }
  if (await bcrypt.compare(nueva, user.passwordHash)) {
    return res.status(400).json({ error: "La nueva contraseña debe ser distinta de la actual.", errores: { nueva: "Debe ser distinta de la actual." } });
  }

  // Cierra las demás sesiones; esta continúa con un token nuevo
  const actualizado = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(nueva, 10), credencialesCambiadasEn: new Date() }
  });
  res.json({ message: "Contraseña actualizada.", token: emitirToken(actualizado) });
});

// Crear o cambiar el PIN de firma. Pide la contraseña y, si ya existe un PIN, el actual.
router.put("/pin", requireAuth, async (req, res) => {
  const { password, pin, pinActual } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const errorPin = errorFormatoPin(pin);
  if (errorPin) return res.status(400).json({ error: errorPin, errores: { pin: errorPin } });

  if (user.pinFirmaHash) {
    const fallo = await verificarCredencialesFirma(user, password, pinActual);
    if (fallo) return res.status(fallo.status).json({ error: fallo.error });
  } else if (typeof password !== "string" || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(422).json({ error: "Contraseña incorrecta." });
  }

  await prisma.user.update({ where: { id: user.id }, data: { pinFirmaHash: await hashearPin(pin) } });
  res.json({ message: user.pinFirmaHash ? "PIN de firma actualizado." : "PIN de firma creado.", tienePin: true });
});

export default router;
