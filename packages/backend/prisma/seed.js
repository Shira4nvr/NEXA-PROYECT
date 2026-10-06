require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando datos previos...");
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creando categorias...");
  const vestidos = await prisma.category.create({ data: { name: "Vestidos", slug: "vestidos" } });
  const camisetas = await prisma.category.create({ data: { name: "Camisetas", slug: "camisetas" } });
  const pantalones = await prisma.category.create({ data: { name: "Pantalones", slug: "pantalones" } });
  const chaquetas = await prisma.category.create({ data: { name: "Chaquetas", slug: "chaquetas" } });

  console.log("Creando productos con variantes e imagenes...");

  const productsData = [
    {
      name: "Vestido floral verano",
      description: "Vestido ligero ideal para clima calido, estampado floral.",
      basePrice: 45900,
      categoryId: vestidos.id,
      images: ["https://picsum.photos/seed/1/400", "https://picsum.photos/seed/11/400"],
      variants: [
        { size: "S", color: "Rojo", sku: "VFV-S-ROJ", stock: 10 },
        { size: "M", color: "Rojo", sku: "VFV-M-ROJ", stock: 8 },
        { size: "M", color: "Azul", sku: "VFV-M-AZU", stock: 5 },
      ],
    },
    {
      name: "Camiseta oversize basica",
      description: "Camiseta de algodon 100%, corte oversize.",
      basePrice: 29900,
      categoryId: camisetas.id,
      images: ["https://picsum.photos/seed/2/400"],
      variants: [
        { size: "S", color: "Negro", sku: "COB-S-NEG", stock: 20 },
        { size: "L", color: "Blanco", sku: "COB-L-BLA", stock: 15 },
      ],
    },
    {
      name: "Jean recto tiro alto",
      description: "Jean de corte recto, tiro alto, tela con elastano.",
      basePrice: 69900,
      categoryId: pantalones.id,
      images: ["https://picsum.photos/seed/3/400"],
      variants: [
        { size: "36", color: "Azul oscuro", sku: "JRT-36-AZO", stock: 12 },
        { size: "38", color: "Azul oscuro", sku: "JRT-38-AZO", stock: 9 },
      ],
    },
    {
      name: "Chaqueta denim clasica",
      description: "Chaqueta de jean clasica, cierre de botones.",
      basePrice: 89900,
      categoryId: chaquetas.id,
      images: ["https://picsum.photos/seed/4/400"],
      variants: [
        { size: "M", color: "Azul claro", sku: "CDC-M-AZC", stock: 7 },
      ],
    },
  ];

  for (const p of productsData) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        categoryId: p.categoryId,
        images: { create: p.images.map((url, i) => ({ url, position: i })) },
        variants: { create: p.variants },
      },
    });
  }

  console.log(`Listo: ${productsData.length} productos, cada uno con sus variantes e imagenes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
