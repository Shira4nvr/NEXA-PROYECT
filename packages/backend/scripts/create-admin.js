require("dotenv").config();
const readline = require("readline/promises");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

function ask(prompt) {
  return rl.question(prompt);
}

async function askSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Ejecuta este comando desde una terminal interactiva para ocultar la contraseña.");
  }
  process.stdout.write(prompt);
  const previousWriter = rl._writeToOutput;
  rl._writeToOutput = () => {};
  process.stdin.setRawMode(true);
  process.stdin.resume();
  try {
    return await rl.question("");
  } finally {
    process.stdin.setRawMode(false);
    rl._writeToOutput = previousWriter;
    process.stdout.write("\n");
  }
}

async function main() {
  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  if (admins > 0) throw new Error("Ya existe una cuenta ADMIN. Pide a un administrador actual que gestione el acceso.");

  const name = (await ask("Nombre del administrador: ")).trim();
  const email = (await ask("Correo del administrador: ")).trim().toLowerCase();
  const password = await askSecret("Contraseña (mínimo 12 caracteres): ");

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Datos no válidos. Usa nombre, correo válido y contraseña de 12 a 72 bytes.");
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error("Ese correo ya tiene una cuenta; no se cambiará su rol desde este comando.");

  await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 12), role: "ADMIN" },
  });
  console.log("Cuenta administradora creada. La contraseña no se mostró ni se guardó en el .env.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });