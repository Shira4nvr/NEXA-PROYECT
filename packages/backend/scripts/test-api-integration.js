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
const categoryIds = [];
let productId;
let imagePath;
const orderIds = [];
const addressIds = [];
const colombianToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

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

  let categories = await expectOk("/products/categories");
  if (!categories.length) {
    const category = await prisma.category.create({
      data: { name: `Categoría temporal ${suffix.slice(0, 8)}`, slug: `api-test-${suffix}` },
      select: { id: true, name: true },
    });
    categoryIds.push(category.id);
    categories = [category];
  }
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

  const address = await expectOk("/addresses", customerToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      label: "Dirección de prueba",
      street: "Calle de integración 123",
      city: "Bogotá",
      state: "Bogotá D.C.",
      zipCode: "110111",
      country: "CO",
      isDefault: true,
    }),
  });
  addressIds.push(address.id);
  const alternateAddress = await expectOk("/addresses", customerToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      label: "Otra dirección de prueba",
      street: "Carrera secundaria 456",
      city: "Medellín",
      state: "Antioquia",
      zipCode: "050001",
      country: "CO",
    }),
  });
  addressIds.push(alternateAddress.id);
  const transferDefault = await expectOk(`/addresses/${address.id}`, customerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault: false }),
  });
  assert.equal(transferDefault.isDefault, false);
  assert.equal((await expectOk("/addresses", customerToken)).find((item) => item.id === alternateAddress.id).isDefault, true, "Debe conservarse una sola dirección principal");
  await expectOk(`/addresses/${address.id}`, customerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault: true }),
  });
  const order = await expectOk("/orders", customerToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addressId: address.id }),
  });
  orderIds.push(order.orderId);
  const sellerOrders = await expectOk("/seller/orders", sellerToken);
  const sellerOrderItem = sellerOrders.find((item) => item.order.id === order.orderId);
  assert.ok(sellerOrderItem, "El vendedor debe ver su artículo del pedido");
  assert.equal(sellerOrderItem.fulfillmentStatus, "PENDING");

  const prepareItem = await expectOk(`/seller/orders/items/${sellerOrderItem.id}/fulfillment`, sellerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PREPARING" }),
  });
  assert.equal(prepareItem.fulfillmentStatus, "PREPARING");
  const customerFulfillmentUpdate = await request(`/seller/orders/items/${sellerOrderItem.id}/fulfillment`, customerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "IN_TRANSIT", estimatedArrival: colombianToday() }),
  });
  assert.equal(customerFulfillmentUpdate.response.status, 403, "Un cliente no debe modificar la logística");
  const withoutArrival = await request(`/seller/orders/items/${sellerOrderItem.id}/fulfillment`, sellerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "IN_TRANSIT" }),
  });
  assert.equal(withoutArrival.response.status, 400, "El pedido requiere fecha estimada para iniciar transporte");

  const estimatedArrival = colombianToday();
  await expectOk(`/seller/orders/items/${sellerOrderItem.id}/fulfillment`, sellerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "IN_TRANSIT", estimatedArrival }),
  });
  const customerOrders = await expectOk("/orders", customerToken);
  assert.equal(customerOrders[0].items[0].fulfillmentStatus, "IN_TRANSIT");
  assert.ok(customerOrders[0].items[0].estimatedArrival, "El cliente debe ver la fecha estimada");
  assert.equal(customerOrders[0].deliveryStreet, "Calle de integración 123");
  const adminCustomerOrders = await request("/orders", adminToken);
  assert.equal(adminCustomerOrders.response.status, 403, "Un administrador no debe usar el endpoint de clientes");

  const updatedAddress = await expectOk(`/addresses/${address.id}`, customerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ street: "Dirección corregida 456" }),
  });
  assert.equal(updatedAddress.street, "Dirección corregida 456");
  const foreignAddressUpdate = await request(`/addresses/${address.id}`, sellerToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ street: "Cambio no autorizado" }),
  });
  assert.equal(foreignAddressUpdate.response.status, 404, "Un vendedor no debe editar direcciones de clientes");
  assert.equal((await expectOk("/orders", customerToken))[0].deliveryStreet, "Calle de integración 123", "Editar la libreta no debe modificar el domicilio histórico del pedido");
  const deleteUsedAddress = await request(`/addresses/${address.id}`, customerToken, { method: "DELETE" });
  assert.equal(deleteUsedAddress.response.status, 409, "No se debe borrar una dirección vinculada a un pedido");

  const analytics = await expectOk("/admin/analytics", adminToken);
  assert.ok(analytics.users >= 3);
  const accounts = await expectOk(`/admin/users?search=${encodeURIComponent(suffix)}`, adminToken);
  assert.equal(accounts.length, 3);
  const sellerAccounts = await expectOk("/admin/users?role=SELLER", adminToken);
  assert.ok(sellerAccounts.some((account) => account.id === seller.user.id), "El filtro de vendedores debe incluir el vendedor temporal");
  const adminOrders = await expectOk("/admin/orders?status=PENDING", adminToken);
  assert.ok(adminOrders.some((item) => item.id === order.orderId), "La sección administrativa debe incluir el pedido");

  await expectOk(`/seller/products/${product.id}`, sellerToken, { method: "DELETE" });
  const publicProducts = await expectOk("/products?search=Producto%20temporal%20API");
  assert.equal(publicProducts.some((item) => item.id === product.id), false, "Un producto archivado no debe aparecer públicamente");

  console.log("API integration OK: registro, roles, inventario, carrito, direcciones, compra, seguimiento, analíticas y usuarios.");
}

main()
  .catch((error) => {
    console.error("API integration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (orderIds.length) {
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } }).catch(() => {});
    }
    if (addressIds.length) await prisma.address.deleteMany({ where: { id: { in: addressIds } } }).catch(() => {});
    if (productId) await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    if (categoryIds.length) await prisma.category.deleteMany({ where: { id: { in: categoryIds } } }).catch(() => {});
    if (userIds.length) {
      await prisma.cartItem.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    }
    if (imagePath) await fs.unlink(imagePath).catch(() => {});
    await prisma.$disconnect();
  });