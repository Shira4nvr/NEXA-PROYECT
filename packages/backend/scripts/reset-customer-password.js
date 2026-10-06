require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function readHidden(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error("Ejecuta este comando desde una terminal interactiva.");
  }
  process.stdout.write(prompt);
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      input.removeListener("data", onData);
      input.setRawMode(false);
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Operación cancelada."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else value += character;
      }
    };
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function main() {
  const databaseUrl = new URL(process.env.DATABASE_URL || "");
  const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1)).toLowerCase();
  if (!["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname) || databaseName !== "tutienda") {
    throw new Error("Restablecimiento cancelado: este comando solo permite localhost/Tutienda.");
  }

  const email = (process.env.CUSTOMER_EMAIL || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("CUSTOMER_EMAIL debe contener un correo válido.");
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user || user.role !== "CUSTOMER") throw new Error("No se encontró un usuario CUSTOMER con ese correo.");

  const password = await readHidden("Nueva contraseña (12–72 bytes): ");
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("La contraseña debe tener entre 12 y 72 bytes.");
  }

  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 12) } });
  console.log("Contraseña actualizada. Solo se guardó el hash; la contraseña no se mostró.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });