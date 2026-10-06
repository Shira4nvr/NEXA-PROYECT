// Prueba rapida de conexion al endpoint lector de Aurora.
// Uso: npm run test:reader
require("dotenv").config();
const { readerPool } = require("../src/config/readerDb");

async function main() {
  console.log("Conectando al lector de Aurora...");
  try {
    const result = await readerPool.query(
      "SELECT NOW() AS hora_servidor, current_user AS usuario_conectado"
    );
    console.log("Conexion exitosa al lector:");
    console.table(result.rows);
  } catch (err) {
    console.error("Fallo la conexion al lector:", err.message);
    console.error("Revisa la contrasena, el Security Group y el acceso publico de Aurora.");
    process.exitCode = 1;
  } finally {
    await readerPool.end();
  }
}

main();