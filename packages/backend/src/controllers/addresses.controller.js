const { prisma } = require("../config/db");

function parseAddress(body, partial = false) {
  const fields = ["label", "street", "city", "state", "zipCode", "country"];
  const data = {};
  for (const field of fields) {
    if (partial && body[field] === undefined) continue;
    if (typeof body[field] !== "string" || !body[field].trim() || body[field].trim().length > 180) {
      return { error: "Completa los datos de la dirección usando valores válidos" };
    }
    data[field] = field === "country" ? body[field].trim().toUpperCase() : body[field].trim();
  }
  if (data.country && data.country !== "CO") return { error: "Por ahora solo se admiten direcciones de Colombia" };
  if (body.isDefault !== undefined) {
    if (typeof body.isDefault !== "boolean") return { error: "isDefault debe ser booleano" };
    data.isDefault = body.isDefault;
  }
  return { data };
}

async function listAddresses(req, res, next) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.userId },
      orderBy: [{ isDefault: "desc" }, { label: "asc" }],
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const { data, error } = parseAddress(req.body);
    if (error) return res.status(400).json({ error });
    const address = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.address.count({ where: { userId: req.userId } });
      if (data.isDefault || existingCount === 0) {
        await tx.address.updateMany({ where: { userId: req.userId }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: { ...data, isDefault: data.isDefault ?? existingCount === 0, userId: req.userId },
      });
    });
    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const { data, error } = parseAddress(req.body, true);
    if (error) return res.status(400).json({ error });
    if (!Object.keys(data).length) return res.status(400).json({ error: "No hay cambios para guardar" });
    const address = await prisma.$transaction(async (tx) => {
      const owned = await tx.address.findFirst({ where: { id: req.params.addressId, userId: req.userId } });
      if (!owned) return null;
      if (data.isDefault === true) {
        await tx.address.updateMany({ where: { userId: req.userId }, data: { isDefault: false } });
      } else if (data.isDefault === false && owned.isDefault) {
        const replacement = await tx.address.findFirst({
          where: { userId: req.userId, id: { not: owned.id } },
          orderBy: { id: "asc" },
        });
        if (replacement) await tx.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
        else data.isDefault = true;
      }
      return tx.address.update({ where: { id: owned.id }, data });
    });
    if (!address) return res.status(404).json({ error: "Dirección no encontrada" });
    res.json(address);
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const owned = await prisma.address.findFirst({ where: { id: req.params.addressId, userId: req.userId } });
    if (!owned) return res.status(404).json({ error: "Dirección no encontrada" });
    const linkedOrder = await prisma.order.findFirst({ where: { addressId: owned.id }, select: { id: true } });
    if (linkedOrder) return res.status(409).json({ error: "No se puede eliminar una dirección asociada a un pedido" });
    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: owned.id } });
      if (owned.isDefault) {
        const nextAddress = await tx.address.findFirst({ where: { userId: req.userId }, orderBy: { id: "asc" } });
        if (nextAddress) await tx.address.update({ where: { id: nextAddress.id }, data: { isDefault: true } });
      }
    });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2003" || err.message.includes('constraint "Order_addressId_fkey"')) {
      return res.status(409).json({ error: "No se puede eliminar una dirección asociada a un pedido" });
    }
    next(err);
  }
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
