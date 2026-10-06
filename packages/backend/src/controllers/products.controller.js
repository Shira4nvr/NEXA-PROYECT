const { prisma } = require("../config/db");
const { serializeProduct } = require("../utils/productResponse");

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const { category, search } = req.query;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ sellerId: null }, { seller: { status: "ACTIVE" } }],
        ...(category ? { category: { slug: category } } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products.map((product) => serializeProduct(req, product)));
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: req.params.id,
        isActive: true,
        OR: [{ sellerId: null }, { seller: { status: "ACTIVE" } }],
      },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
        reviews: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(serializeProduct(req, product));
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, listProducts, getProductById };
