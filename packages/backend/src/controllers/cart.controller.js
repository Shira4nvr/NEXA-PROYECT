const { prisma } = require("../config/db");
const cartItemInclude = {
  variant: {
    include: {
      product: { include: { images: { orderBy: { position: "asc" } } } },
    },
  },
};

async function getCart(req, res, next) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: cartItemInclude,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

// Ahora se agrega una VARIANTE especifica (talla + color), no el producto en general
async function addItem(req, res, next) {
  try {
    const { variantId, quantity = 1 } = req.body;
    if (typeof variantId !== "string" || !Number.isSafeInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: "variantId y una cantidad positiva son requeridos" });
    }
    const item = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) {
        const error = new Error("Variante no encontrada");
        error.status = 404;
        throw error;
      }
      const existing = await tx.cartItem.findUnique({ where: { userId_variantId: { userId: req.userId, variantId } } });
      if (variant.stock < (existing?.quantity || 0) + quantity) {
        const error = new Error("Stock insuficiente");
        error.status = 409;
        throw error;
      }
      return tx.cartItem.upsert({
        where: { userId_variantId: { userId: req.userId, variantId } },
        update: { quantity: { increment: quantity } },
        create: { userId: req.userId, variantId, quantity },
        include: cartItemInclude,
      });
    }, { isolationLevel: "Serializable" });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    const { variantId } = req.params;

    if (!Number.isSafeInteger(quantity)) return res.status(400).json({ error: "La cantidad debe ser un entero" });
    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { userId_variantId: { userId: req.userId, variantId } },
      });
      return res.status(204).send();
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { stock: true } });
    if (!variant) return res.status(404).json({ error: "Variante no encontrada" });
    if (quantity > variant.stock) return res.status(409).json({ error: "Stock insuficiente" });

    const item = await prisma.cartItem.update({
      where: { userId_variantId: { userId: req.userId, variantId } },
      data: { quantity },
      include: cartItemInclude,
    });

    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    await prisma.cartItem.delete({
      where: { userId_variantId: { userId: req.userId, variantId: req.params.variantId } },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };
