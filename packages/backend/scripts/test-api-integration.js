require("dotenv").config();
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const databaseUrl = new URL(process.env.DATABASE_URL || "");
const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1)).toLowerCase();
if (!["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname) || databaseName !== "tutienda") {
  throw new Error("Smoke test cancelado: solo se permite ejecutarlo contra localhost/Tutienda.");
}

const apiBase = `http://localhost:${process.env.PORT || 4000}/api`;
const suffix = crypto.randomUUID();
const emails = [`api-seller-${suffix}@example.test`, `api-customer-${suffix}@example.test`, `api-admin-${suffix}@example.test`];
const userIds = [];
let productId;
let imagePath;

async function request(route, token, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBase}${route}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { response, data, text };
}

async function expectOk(route, token, options) {
  const result = await request(route, token, options);
  assert.ok(result.response.ok, `${route}: ${result.response.status} ${result.data?.error || result.text}`);
  return result.data;
}

async function register(email, password, role, extra = {}) {
  return expectOk("/auth/register", null, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role, termsAccepted: true, privacyAuthorized: true, ...extra }),
  });
}

async function main() {
  const password = `Api-test-${crypto.randomBytes(20).toString("hex")}`;
  const seller = await register(emails[0], password, "SELLER", {
    name: "Vendedor temporal API",
    legalName: "Vendedor temporal API",
    storeName: `Tienda temporal ${suffix.slice(0, 8)}`,
    identificationNumber: `TEST-${suffix}`,
    noticeAddress: "Dirección temporal de prueba",
    contactPhone: "3000000000",
  });
  userIds.push(seller.user.id);

  const customer = await register(emails[1], password, "CUSTOMER");
  userIds.push(customer.user.id);

  const admin = await prisma.user.create({
    data: { name: "Administrador temporal API", email: emails[2], password: await bcrypt.hash(password, 12), role: "ADMIN" },
    select: { id: true },
  });
  userIds.push(admin.id);

  const sellerLogin = await expectOk("/auth/login", null, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emails[0], password }) });
  const customerLogin = await expectOk("/auth/login", null, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emails[1], password }) });
  const adminLogin = await expectOk("/auth/login", null, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emails[2], password }) });
  const sellerToken = sellerLogin.token;
  const customerToken = customerLogin.token;
  const adminToken = adminLogin.token;

  const consentCount = await prisma.consentRecord.count({ where: { userId: customer.user.id } });
  assert.equal(consentCount, 2, "El registro debe guardar términos y autorización de privacidad");

  const profile = await expectOk("/seller/profile", sellerToken);
  assert.equal(profile.status, "PENDING");
  const forbiddenAdmin = await request("/admin/analytics", customerToken);
  assert.equal(forbiddenAdmin.response.status, 403, "Un cliente no debe acceder a administración");

  await expectOk(`/admin/sellers/${profile.id}/status`, adminToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ACTIVE" }),
  });

  const categories = await expectOk("/products/categories");
  assert.ok(categories.length, "Debe existir al menos una categoría");
  const form = new FormData();
  form.append("name", "Producto temporal API");
  form.append("categoryId", categories[0].id);
  form.append("price", "24900");
  form.append("stock", "5");
  form.append("imageAlt", "Fotografía temporal para prueba de API");
  form.append("image", new Blob(["temporary image"], { type: "image/png" }), "api-test.png");
  const product = await expectOk("/seller/products", sellerToken, { method: "POST", body: form });
  productId = product.id;
  imagePath = path.resolve("uploads", path.basename(product.images[0].url));
  assert.equal(product.imageAlt, "Fotografía temporal para prueba de API");

  await expectOk(`/seller/products/${product.id}`, sellerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock: 7 }),
  });
  const cartItem = await expectOk("/cart/items", customerToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId: product.variants[0].id, quantity: 2 }),
  });
  assert.equal(cartItem.quantity, 2);

  const analytics = await expectOk("/admin/analytics", adminToken);
  assert.ok(analytics.users >= 3);
  const accounts = await expectOk(`/admin/users?search=${encodeURIComponent(suffix)}`, adminToken);
  assert.equal(accounts.length, 3);

  await expectOk(`/seller/products/${product.id}`, sellerToken, { method: "DELETE" });
  const publicProducts = await expectOk("/products?search=Producto%20temporal%20API");
  assert.equal(publicProducts.some((item) => item.id === product.id), false, "Un producto archivado no debe aparecer públicamente");

  console.log("API integration OK: registro/consentimientos, roles, vendedor, imágenes, stock, carrito, analíticas y usuarios.");
}

main()
  .catch((error) => {
    console.error("API integration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (productId) await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    if (userIds.length) {
      await prisma.cartItem.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    }
    if (imagePath) await fs.unlink(imagePath).catch(() => {});
    await prisma.$disconnect();
  });