export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    next();
  };
}
