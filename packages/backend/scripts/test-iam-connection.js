// Prueba rapida: genera un token IAM, se conecta a Aurora y corre una query simple.
// Uso: node scripts/test-iam-connection.js
require("dotenv").config();
const { iamPool } = require("../src/config/iamDb");

async function main() {
  console.log("Generando token IAM y conectando...");
  try {
    const result = await iamPool.query("SELECT NOW() AS hora_servidor, current_user AS usuario_conectado");
    console.log("Conexion exitosa via IAM:");
    console.table(result.rows);
  } catch (err) {
    console.error("Fallo la conexion IAM:", err.message);
    console.error("\nRevisa:");
    console.error("1. Que IAM database authentication este habilitado en la instancia RDS.");
    console.error("2. Que el usuario de Postgres tenga el rol rds_iam (GRANT rds_iam TO app_iam_user;).");
    console.error("3. Que tus credenciales de AWS (aws configure / rol de IAM) tengan permiso rds-db:connect.");
    console.error("4. Que el Security Group permita el puerto 5432 desde tu IP.");
  } finally {
    await iamPool.end();
  }
}

main();
