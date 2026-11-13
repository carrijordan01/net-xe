import express from "express";
import { prisma } from "../db.js";
import requireAuth from "../middleware/auth.js";
import { idsConBloqueo, relacionBloqueo } from "../bloqueos.js";

const router = express.Router();

const camposPublicos = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  company: true,
  accountType: true,
  role: true
};

// Buscar usuarios (excepto el propio y quienes me bloquearon).
//   ?q=texto            nombre, apellido, correo o empresa
//   ?role=CONTRAPARTE   filtra por rol
//   ?disponibles=1      excluye también a los que bloqueé (para ofrecer contratos)
router.get("/", requireAuth, async (req, res) => {
  try {
    const { bloqueadosPorMi, meBloquearon } = await idsConBloqueo(req.user.id);
    const excluidos = [req.user.id, ...meBloquearon];
    if (req.query.disponibles) excluidos.push(...bloqueadosPorMi);

    const where = { id: { notIn: excluidos } };
    const role = req.query.role?.toString().toUpperCase();
    if (role === "SOLICITANTE" || role === "CONTRAPARTE") {
      where.role = role;
    }

    // Cada palabra debe aparecer en el nombre, el apellido, el correo o la empresa
    const palabras = (req.query.q?.toString() ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
    if (palabras.length > 0) {
      where.AND = palabras.map((p) => ({
        OR: ["firstName", "lastName", "email", "company"].map((campo) => ({
          [campo]: { contains: p, mode: "insensitive" }
        }))
      }));
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 50,
      select: camposPublicos
    });

    res.json(users.map((u) => ({ ...u, bloqueadoPorMi: bloqueadosPorMi.has(u.id) })));
  } catch (error) {
    console.error("Error listando usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Usuarios que bloqueé (debe ir antes de /:id)
router.get("/bloqueados", requireAuth, async (req, res) => {
  const bloqueos = await prisma.bloqueo.findMany({
    where: { bloqueadorId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { bloqueado: { select: camposPublicos } }
  });
  res.json(bloqueos.map((b) => ({ ...b.bloqueado, bloqueadoPorMi: true, bloqueadoDesde: b.createdAt })));
});

function idDeRuta(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Id de usuario inválido" });
    return null;
  }
  return id;
}

// Perfil público de un usuario. Si me bloqueó, solo se muestra su nombre.
router.get("/:id", requireAuth, async (req, res) => {
  const id = idDeRuta(req, res);
  if (id === null) return;

  const usuario = await prisma.user.findUnique({ where: { id }, select: camposPublicos });
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

  const relacion = id === req.user.id ? { bloqueadoPorMi: false, meBloqueo: false } : await relacionBloqueo(req.user.id, id);
  if (relacion.meBloqueo) {
    const { firstName, lastName, role } = usuario;
    return res.json({ id, firstName, lastName, role, ...relacion });
  }

  res.json({ ...usuario, ...relacion });
});

// Bloquear a un usuario
router.post("/:id/bloqueo", requireAuth, async (req, res) => {
  const id = idDeRuta(req, res);
  if (id === null) return;
  if (id === req.user.id) return res.status(400).json({ error: "No puedes bloquearte a ti mismo." });

  const existe = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existe) return res.status(404).json({ error: "Usuario no encontrado" });

  await prisma.bloqueo.upsert({
    where: { bloqueadorId_bloqueadoId: { bloqueadorId: req.user.id, bloqueadoId: id } },
    update: {},
    create: { bloqueadorId: req.user.id, bloqueadoId: id }
  });
  res.json({ bloqueadoPorMi: true });
});

// Desbloquear a un usuario
router.delete("/:id/bloqueo", requireAuth, async (req, res) => {
  const id = idDeRuta(req, res);
  if (id === null) return;

  await prisma.bloqueo.deleteMany({ where: { bloqueadorId: req.user.id, bloqueadoId: id } });
  res.json({ bloqueadoPorMi: false });
});

export default router;
