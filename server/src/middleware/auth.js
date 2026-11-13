import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

export default async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "token no proporcionado" });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return res.status(401).json({ error: "token no proporcionado" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Error verificando token:", err.message);
    return res.status(401).json({ error: "token inválido o expirado" });
  }

  // La sesión deja de valer si la cuenta ya no existe o si la contraseña
  // cambió después de emitir el token (cambio o recuperación de contraseña)
  const usuario = await prisma.user.findUnique({
    where: { id: Number(decoded.sub) },
    select: { credencialesCambiadasEn: true }
  });
  if (!usuario) return res.status(401).json({ error: "token inválido o expirado" });
  // «emitidoEn» tiene precisión de milisegundos; los tokens anteriores a ese
  // campo solo traen «iat» (segundos) y se comparan de forma conservadora
  const emitido = decoded.emitidoEn ?? decoded.iat * 1000;
  if (usuario.credencialesCambiadasEn && emitido < usuario.credencialesCambiadasEn.getTime()) {
    return res.status(401).json({ error: "La sesión se cerró porque la contraseña cambió." });
  }

  // El token guarda el id en "sub"; las rutas usan req.user.id
  req.user = {
    id: Number(decoded.sub),
    email: decoded.email,
    role: decoded.role,
    accountType: decoded.accountType
  };
  next();
}
