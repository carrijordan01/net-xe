import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

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
      telefono
    } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
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
        firstName: nombre,
        lastName: apellido,
        company: compania?.trim() || null,
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

    const isValid = user && password && await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
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
