import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "token no proporcionado" });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return res.status(401).json({ error: "token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // El token guarda el id en "sub"; las rutas usan req.user.id
    req.user = {
      id: Number(decoded.sub),
      email: decoded.email,
      role: decoded.role,
      accountType: decoded.accountType
    };
    next();
  } catch (err) {
    console.error("Error verificando token:", err.message);
    return res.status(401).json({ error: "token inválido o expirado" });
  }
}
