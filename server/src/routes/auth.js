import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();

router.post("/register", async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      role,
      compania,
      telefono,
      tipoCuenta,
      tipoUsuario
    } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    const allowedRoles = ["PROPONENTE", "SOLICITANTE"];
    const normalizedRole = (role || "SOLICITANTE").toString().toUpperCase();
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ error: "Rol invalido" });
    }

    const allowedAccountTypes = ["INDIVIDUAL", "EMPRESA"];
    const normalizedAccountType = (tipoCuenta || tipoUsuario || "INDIVIDUAL")
      .toString()
      .toUpperCase();
    if (!allowedAccountTypes.includes(normalizedAccountType)) {
      return res.status(400).json({ error: "Tipo de cuenta invalido" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: nombre,
        lastName: apellido,
        company: compania || null,
        phone: telefono || null,
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
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: "Contrasena incorrecta" });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        accountType: user.accountType,
        role: user.role
      },
        process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      message: "Login exitoso",
      token,
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
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

export default router;
