const { PrismaClient } = require("@prisma/client");

// Instancia unica de Prisma para toda la app (evita abrir muchas conexiones)
const prisma = new PrismaClient();

module.exports = { prisma };
