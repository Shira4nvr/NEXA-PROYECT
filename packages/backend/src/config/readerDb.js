// Conexion de solo lectura al endpoint lector del cluster Aurora.
const { Pool } = require("pg");

const DB_HOST = process.env.READER_DB_HOST;
const DB_PORT = Number(process.env.READER_DB_PORT || 5432);
const DB_USER = process.env.READER_DB_USER || "postgres";
const DB_PASSWORD = process.env.READER_DB_PASSWORD;
const DB_NAME = process.env.READER_DB_NAME || "postgres";

if (!DB_HOST) {
  console.warn("[readerDb] Falta READER_DB_HOST en el .env.");
}

if (!DB_PASSWORD || DB_PASSWORD === "TU_PASSWORD") {
  console.warn("[readerDb] Configura READER_DB_PASSWORD antes de conectar.");
}

const readerPool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: { rejectUnauthorized: true },
  max: 5,
  idleTimeoutMillis: 30000,
});

readerPool.on("error", (err) => {
  console.error("[readerDb] Error inesperado en el pool de solo lectura:", err.message);
});

module.exports = { readerPool };