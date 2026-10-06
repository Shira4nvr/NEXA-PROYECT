// Conexion a Aurora PostgreSQL usando AUTENTICACION IAM en vez de contrasena fija.
//
// Como funciona:
// 1. En lugar de una contrasena guardada, generamos un TOKEN firmado con las
//    credenciales de AWS (validas 15 minutos) cada vez que se abre una conexion.
// 2. RDS valida ese token contra IAM en el momento de conectar.
// 3. Una vez conectada, la sesion sigue viva aunque el token ya haya vencido
//    (el token solo se usa en el "apreton de manos" inicial).
//
// Requisitos previos en AWS (una sola vez):
//   a) En la instancia/cluster de RDS: Modify -> "IAM database authentication" -> Enable
//   b) Dentro de Postgres, crear el usuario y darle el rol especial rds_iam:
//        CREATE USER app_iam_user;
//        GRANT rds_iam TO app_iam_user;
//      (un usuario IAM no necesita password en Postgres, se autentica por token)
//   c) Adjuntar una policy de IAM al usuario/rol que ejecuta este backend:
//        {
//          "Effect": "Allow",
//          "Action": "rds-db:connect",
//          "Resource": "arn:aws:rds-db:REGION:ACCOUNT_ID:dbuser:DB_RESOURCE_ID/app_iam_user"
//        }
//   d) Tener credenciales de AWS disponibles donde corre el backend:
//        - En tu maquina local: `aws configure` (usa el perfil por defecto)
//        - En EC2/ECS/Lambda: un rol de IAM adjunto (recomendado, sin claves a mano)

const { Pool } = require("pg");
const { RDSSigner } = require("@aws-sdk/rds-signer");

const REGION = process.env.AWS_REGION || "us-east-2";
const DB_HOST = process.env.IAM_DB_HOST; // ej: database-2-instance-1.cpmo688mg0l4.us-east-2.rds.amazonaws.com
const DB_PORT = Number(process.env.IAM_DB_PORT || 5432);
const DB_USER = process.env.IAM_DB_USER || "app_iam_user";
const DB_NAME = process.env.IAM_DB_NAME || "postgres";

if (!DB_HOST) {
  console.warn("[iamDb] Falta IAM_DB_HOST en el .env — la conexion IAM no se inicializara.");
}

const signer = new RDSSigner({
  region: REGION,
  hostname: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
});

// pg soporta una funcion async como password: se llama justo antes de cada
// conexion nueva del pool, generando un token fresco automaticamente.
const iamPool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  database: DB_NAME,
  password: () => signer.getAuthToken(),
  ssl: { rejectUnauthorized: true }, // RDS exige SSL para conexiones IAM
  max: 5,
  idleTimeoutMillis: 30000,
});

iamPool.on("error", (err) => {
  console.error("[iamDb] Error inesperado en el pool de conexiones IAM:", err.message);
});

module.exports = { iamPool };
