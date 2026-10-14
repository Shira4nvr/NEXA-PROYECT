const { prisma } = require("../config/db");

async function getAnalytics(req, res, next) {
  try {
    const [orders, gross, users, activeUsers, activeProducts, sellersPending, ordersByStatus] = await prisma.$transaction([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.sellerProfile.count({ where: { status: "PENDING" } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    res.json({
      orders,
      grossCop: gross._sum.total || 0,
      users,
      activeUsers,
      activeProducts,
      sellersPending,
      ordersByStatus: Object.fromEntries(ordersByStatus.map((item) => [item.status, item._count._all])),
    });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : "";
    const validStatuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "El estado de pedido no es válido" });
    }
    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: { select: { method: true, status: true } },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    seller: { select: { storeName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const requestedRole = typeof req.query.role === "string" ? req.query.role.toUpperCase() : "";
    if (requestedRole && !["CUSTOMER", "SELLER", "ADMIN"].includes(requestedRole)) {
      return res.status(400).json({ error: "El filtro de rol no es válido" });
    }
    const normalizedRole = search.toUpperCase();
    const roleFilter = ["CUSTOMER", "SELLER", "ADMIN"].includes(normalizedRole) ? [{ role: normalizedRole }] : [];
    const users = await prisma.user.findMany({
      where: {
        ...(requestedRole ? { role: requestedRole } : {}),
        ...(search ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            ...roleFilter,
          ],
        } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        sellerProfile: { select: { id: true, storeName: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function setUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") return res.status(400).json({ error: "isActive debe ser booleano" });
    if (req.params.userId === req.userId && !isActive) return res.status(400).json({ error: "No puedes desactivar tu propia cuenta" });

    const target = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true, role: true, isActive: true } });
    if (!target) return res.status(404).json({ error: "Usuario no encontrado" });
    if (!isActive && target.role === "ADMIN" && target.isActive) {
      const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (activeAdmins <= 1) return res.status(409).json({ error: "No se puede desactivar el último administrador activo" });
    }

    const user = await prisma.user.update({
      where: { id: target.id },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function setSellerStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ error: "Estado de vendedor no válido" });
    }
    const profile = await prisma.sellerProfile.update({
      where: { id: req.params.sellerId },
      data: { status },
      select: { id: true, userId: true, storeName: true, status: true },
    });
    res.json(profile);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Perfil de vendedor no encontrado" });
    next(err);
  }
}

module.exports = { getAnalytics, listOrders, listUsers, setUserStatus, setSellerStatus };