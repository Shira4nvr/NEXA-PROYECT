const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const cartRoutes = require("./routes/cart.routes");
const ordersRoutes = require("./routes/orders.routes");
const sellerRoutes = require("./routes/seller.routes");
const adminRoutes = require("./routes/admin.routes");
const addressesRoutes = require("./routes/addresses.routes");
const locationsRoutes = require("./routes/locations.routes");
// const edgeRoutes = require("./routes/edge.routes");
const { errorHandler } = require("./middleware/errorHandler");
const { uploadsDirectory } = require("./middleware/imageUpload");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDirectory, { dotfiles: "deny", index: false }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/locations", locationsRoutes);
// app.use("/api/edge", edgeRoutes);

// Siempre al final: captura cualquier error de los controladores
app.use(errorHandler);

module.exports = app;
