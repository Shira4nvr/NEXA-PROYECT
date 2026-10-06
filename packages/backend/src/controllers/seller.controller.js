const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { prisma } = require("../config/db");
const { uploadsDirectory } = require("../middleware/imageUpload");
const { serializeProduct } = require("../utils/productResponse");

const productInclude = {
  category: true,
  images: { orderBy: { position: "asc" } },
  variants: true,
};

async function getProfile(req, res, next) {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) return res.status(404).json({ error: "No existe un perfil de vendedor para esta cuenta" });
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function activeSeller(req, res) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId } });
  if (!profile) {
    res.status(403).json({ error: "La cuenta no tiene perfil de vendedor" });
    return null;
  }
  if (profile.status !== "ACTIVE") {
    res.status(403).json({ error: "El perfil de vendedor aún no está aprobado" });
    return null;
  }
  return profile;
}

async function listProducts(req, res, next) {
  try {
    const profile = await activeSeller(req, res);
    if (!profile) return;
    const products = await prisma.product.findMany({
      where: { sellerId: profile.id, isActive: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(products.map((product) => serializeProduct(req, product)));
  } catch (err) {
    next(err);
  }
}

function parseProductFields(body, { partial = false } = {}) {
  const data = {};
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) return { error: "El nombre debe tener entre 1 y 100 caracteres" };
    data.name = body.name.trim();
  }
  if (!partial || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isSafeInteger(price) || price <= 0) return { error: "El precio debe ser un entero positivo en COP" };
    data.basePrice = price;
  }
  if (!partial || body.categoryId !== undefined) {
    if (typeof body.categoryId !== "string" || !body.categoryId.trim()) return { error: "Selecciona una categoría" };
    data.categoryId = body.categoryId;
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 2000) return { error: "La descripción no puede superar 2000 caracteres" };
    data.description = body.description.trim() || null;
  }
  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isSafeInteger(stock) || stock < 0) return { error: "El stock debe ser un entero igual o mayor que cero" };
    data.stock = stock;
  }
  if (body.imageAlt !== undefined) {
    if (typeof body.imageAlt !== "string" || !body.imageAlt.trim() || body.imageAlt.trim().length > 180) return { error: "El texto alternativo debe tener entre 1 y 180 caracteres" };
    data.imageAlt = body.imageAlt.trim();
  }
  return { data };
}

async function removeUploadedFile(file) {
  if (!file?.path) return;
  try {
    await fs.unlink(file.path);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("No se pudo eliminar una carga fallida:", err.message);
  }
}

async function createProduct(req, res, next) {
  try {
    const profile = await activeSeller(req, res);
    if (!profile) {
      await removeUploadedFile(req.file);
      return;
    }
    if (!req.file) return res.status(400).json({ error: "La fotografía del producto es obligatoria" });
    const { data, error } = parseProductFields(req.body);
    if (error) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error });
    }
    const alt = data.imageAlt;
    if (!alt) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: "Agrega un texto alternativo para la fotografía" });
    }
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: "La categoría no existe" });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        basePrice: data.basePrice,
        categoryId: data.categoryId,
        sellerId: profile.id,
        images: { create: { url: `/uploads/${path.basename(req.file.filename)}`, altText: alt } },
        variants: {
          create: {
            size: "Único",
            color: "Único",
            sku: `NX-${crypto.randomUUID()}`,
            stock: data.stock,
          },
        },
      },
      include: productInclude,
    });
    res.status(201).json(serializeProduct(req, product));
  } catch (err) {
    await removeUploadedFile(req.file);
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const profile = await activeSeller(req, res);
    if (!profile) {
      await removeUploadedFile(req.file);
      return;
    }
    const { data, error } = parseProductFields(req.body, { partial: true });
    if (error) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error });
    }
    if (req.file && !data.imageAlt) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: "Agrega un texto alternativo para la fotografía" });
    }
    if (!Object.keys(data).length && !req.file) return res.status(400).json({ error: "No hay cambios para guardar" });
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
      if (!category) return res.status(400).json({ error: "La categoría no existe" });
    }

    const existing = await prisma.product.findFirst({
      where: { id: req.params.productId, sellerId: profile.id, isActive: true },
      include: { images: true },
    });
    if (!existing) {
      await removeUploadedFile(req.file);
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const updateData = { ...data };
    delete updateData.stock;
    delete updateData.imageAlt;
    const updated = await prisma.$transaction(async (tx) => {
      if (data.stock !== undefined) {
        await tx.productVariant.updateMany({ where: { productId: existing.id }, data: { stock: data.stock } });
      }
      if (req.file) {
        await tx.productImage.deleteMany({ where: { productId: existing.id } });
        await tx.productImage.create({
          data: { productId: existing.id, url: `/uploads/${path.basename(req.file.filename)}`, altText: data.imageAlt, position: 0 },
        });
      }
      return tx.product.update({ where: { id: existing.id }, data: updateData, include: productInclude });
    });

    if (req.file) await Promise.all(existing.images.map((image) => removeLocalImage(image.url)));
    res.json(serializeProduct(req, updated));
  } catch (err) {
    await removeUploadedFile(req.file);
    next(err);
  }
}

async function removeLocalImage(url) {
  if (!url?.startsWith("/uploads/")) return;
  const filePath = path.resolve(uploadsDirectory, path.basename(url));
  if (!filePath.startsWith(`${path.resolve(uploadsDirectory)}${path.sep}`)) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("No se pudo eliminar una imagen anterior:", err.message);
  }
}

async function archiveProduct(req, res, next) {
  try {
    const profile = await activeSeller(req, res);
    if (!profile) return;
    const result = await prisma.product.updateMany({
      where: { id: req.params.productId, sellerId: profile.id, isActive: true },
      data: { isActive: false },
    });
    if (!result.count) return res.status(404).json({ error: "Producto no encontrado" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, listProducts, createProduct, updateProduct, archiveProduct };