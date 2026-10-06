const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { signToken } = require("../utils/jwt");

const CONSENT_VERSIONS = {
  TERMS_OF_USE: process.env.TERMS_OF_USE_VERSION || "nexo-terms-draft-2026-09",
  PRIVACY_AUTHORIZATION: process.env.PRIVACY_VERSION || "nexo-privacy-draft-2026-09",
  MARKETING: process.env.MARKETING_CONSENT_VERSION || "nexo-marketing-draft-2026-09",
};

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sellerProfile: user.sellerProfile || null,
  };
}

async function register(req, res, next) {
  try {
    const {
      name,
      email: rawEmail,
      password,
      role = "CUSTOMER",
      storeName,
      legalName,
      identificationNumber,
      noticeAddress,
      contactPhone,
      termsAccepted,
      privacyAuthorized,
      marketingConsent = false,
    } = req.body;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Ingresa un correo y una contraseña válidos" });
    }
    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes" });
    }
    if (role !== "CUSTOMER" && role !== "SELLER") {
      return res.status(400).json({ error: "El rol solicitado no se puede registrar" });
    }
    if (termsAccepted !== true || privacyAuthorized !== true) {
      return res.status(400).json({ error: "Debes aceptar términos y autorizar el tratamiento de datos" });
    }
    if (role === "SELLER" && [storeName, legalName, identificationNumber, noticeAddress, contactPhone].some((value) => typeof value !== "string" || !value.trim())) {
      return res.status(400).json({ error: "Faltan datos obligatorios del vendedor" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: role === "SELLER" ? legalName.trim() : (typeof name === "string" ? name.trim() || null : null),
          email,
          password: hashedPassword,
          role,
          ...(role === "SELLER" ? {
            sellerProfile: {
              create: {
                storeName: storeName.trim(),
                legalName: legalName.trim(),
                identificationNumber: identificationNumber.trim(),
                noticeAddress: noticeAddress.trim(),
                contactPhone: contactPhone.trim(),
              },
            },
          } : {}),
        },
        include: { sellerProfile: true },
      });

      await tx.consentRecord.createMany({
        data: [
          { userId: user.id, type: "TERMS_OF_USE", documentVersion: CONSENT_VERSIONS.TERMS_OF_USE },
          { userId: user.id, type: "PRIVACY_AUTHORIZATION", documentVersion: CONSENT_VERSIONS.PRIVACY_AUTHORIZATION },
          ...(marketingConsent === true ? [{ userId: user.id, type: "MARKETING", documentVersion: CONSENT_VERSIONS.MARKETING }] : []),
        ],
      });

      return user;
    });

    const token = signToken({ userId: createdUser.id });
    res.status(201).json({ token, user: serializeUser(createdUser) });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "El correo o la identificación de vendedor ya están registrados" });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { password } = req.body;
    if (!email || typeof password !== "string") {
      return res.status(400).json({ error: "Correo y contraseña son requeridos" });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { sellerProfile: true } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }
    if (!user.isActive) return res.status(403).json({ error: "La cuenta está desactivada" });

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    const token = signToken({ userId: user.id });
    res.json({ token, user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { sellerProfile: true },
    });
    if (!user) return res.status(404).json({ error: "Cuenta no encontrada" });
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getCurrentUser };
