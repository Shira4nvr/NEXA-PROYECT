require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Ejecuta este comando desde una terminal interactiva para ocultar la contraseña.");
  }
  const input = process.stdin;
  return new Promise((resolve, reject) => {
    let password = "";
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
          resolve(password);
          return;
        }
        if (character === "\u007f" || character === "\b") password = password.slice(0, -1);
        else password += character;
      }
    };
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
    process.stdout.write(prompt);
  });
}

async function main() {
  const name = (process.env.CUSTOMER_NAME || "").trim();
  const email = (process.env.CUSTOMER_EMAIL || "").trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Falta un nombre o un correo válido en CUSTOMER_NAME/CUSTOMER_EMAIL.");
  }
  if (process.env.LEGAL_CONSENT_CONFIRMED !== "yes") {
    throw new Error("Falta confirmar la aceptación de términos y autorización de privacidad.");
  }
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new Error("Ya existe una cuenta con ese correo; no se modificó.");
  }

  const password = await readHidden("Contraseña del cliente (mínimo 12 caracteres): ");
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("La contraseña debe tener entre 12 y 72 bytes.");
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, password: await bcrypt.hash(password, 12), role: "CUSTOMER" },
      select: { id: true, name: true, email: true, role: true },
    });
    await tx.consentRecord.createMany({
      data: [
        { userId: created.id, type: "TERMS_OF_USE", documentVersion: process.env.TERMS_OF_USE_VERSION || "nexo-terms-draft-2026-09" },
        { userId: created.id, type: "PRIVACY_AUTHORIZATION", documentVersion: process.env.PRIVACY_VERSION || "nexo-privacy-draft-2026-09" },
      ],
    });
    return created;
  });

  console.log(`Cliente creado: ${user.name} (${user.role}), id ${user.id}. La contraseña solo se guardó como hash.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });