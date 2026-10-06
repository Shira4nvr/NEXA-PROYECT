const { verifyToken } = require("../utils/jwt");
const { prisma } = require("../config/db");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const token = header.split(" ")[1];
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: "Token invalido o vencido" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "La cuenta no está disponible" });
    }
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "No tienes permisos para esta operación" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
