# Backend — Node.js + Express + Prisma + PostgreSQL (AWS RDS)

API REST para la app, conectada a una base de datos PostgreSQL alojada en AWS RDS.

## Instalacion (primera vez)

```bash
cd packages/backend
cp .env.example .env
```

Edita `.env` y pon tu `DATABASE_URL` real de RDS (usuario, password y endpoint
que copiaste de la consola de AWS).

```bash
npm install
npx prisma migrate dev --name init
npm run seed
```

Esto:
1. Instala dependencias (express, prisma, bcrypt, jwt, etc.)
2. Crea las tablas en tu base de datos de RDS segun `schema.prisma`
3. Llena la tabla de productos con datos de ejemplo

Si `prisma migrate dev` falla con timeout o "connection refused", revisa que
el Security Group de tu instancia RDS tenga abierto el puerto 5432 para tu IP
(ver seccion de troubleshooting mas abajo).

## Correr el servidor

Desde la raiz del monorepo:

```bash
npm run backend
```

O directamente desde `packages/backend`:

```bash
npm run dev
```

Deberia mostrar: `Backend corriendo en http://localhost:4000`

## API y permisos

Todas las rutas protegidas requieren `Authorization: Bearer <token>`. Los tokens se emiten después del login/registro; cada solicitud vuelve a comprobar que la cuenta esté activa.

| Método | Ruta | Permiso | Uso |
|---|---|---|---|
| GET | `/health` | Público | Estado del backend |
| POST | `/api/auth/register` | Público | Registro cliente o vendedor, consentimientos versionados |
| POST | `/api/auth/login` | Público | Login; devuelve rol y perfil de vendedor |
| GET | `/api/auth/me` | Autenticado | Cuenta actual |
| GET | `/api/products` | Público | Productos publicados (`category`, `search`) |
| GET | `/api/products/categories` | Público | Categorías para catálogo y alta de producto |
| GET | `/api/products/:id` | Público | Detalle publicado |
| GET/POST | `/api/seller/products` | Vendedor activo | Inventario y publicación multipart |
| PATCH/DELETE | `/api/seller/products/:productId` | Vendedor propietario | Edición, stock y archivado lógico |
| GET | `/api/seller/profile` | Vendedor | Estado del perfil |
| GET | `/api/admin/analytics` | Admin | Órdenes, valor agregado, productos y usuarios |
| GET | `/api/admin/users?search=` | Admin | Búsqueda de cuentas |
| PATCH | `/api/admin/users/:userId/status` | Admin | Activar/desactivar cuenta |
| PATCH | `/api/admin/sellers/:sellerId/status` | Admin | Aprobar/suspender vendedor |
| GET/POST/PATCH/DELETE | `/api/cart/...` | Autenticado | Carrito por variante y stock disponible |

El registro de vendedor requiere `storeName`, `legalName`, `identificationNumber`, `noticeAddress` y `contactPhone`, además de correo, contraseña y aceptación separada de términos/privacidad. El registro público no permite crear administradores.

La publicación de producto usa `multipart/form-data`: `name`, `categoryId`, `price` (entero COP), `stock`, `imageAlt` e `image` (JPEG/PNG/WebP, máximo 5 MB). Las imágenes quedan en `packages/backend/uploads` para desarrollo; configura almacenamiento privado externo antes de desplegar.

## Crear el primer administrador

Desde la raíz del monorepo:

```bash
npm run admin:create --workspace=packages/backend
```

El comando solicita nombre/correo y lee la contraseña sin mostrarla. Solo crea el primer admin; no promueve cuentas existentes ni imprime credenciales. La plataforma no tiene una cuenta administradora presembrada.

## Probar la integración

```bash
npm run test:api --workspace=packages/backend
```

La prueba solo permite `localhost/Tutienda`, crea datos temporales con identificadores únicos y los elimina al terminar. No la ejecutes contra producción.

## Migraciones y seed

```bash
npx prisma migrate status
npx prisma migrate dev --name nombre_cambio
```

`npm run seed` es destructivo: elimina los registros de las tablas de catálogo/usuarios antes de crear el catálogo de muestra. No lo uses para aplicar migraciones ni en una base con datos que quieras conservar.

Las versiones de consentimiento salen de `TERMS_OF_USE_VERSION`, `PRIVACY_VERSION` y `MARKETING_CONSENT_VERSION`; sus valores por defecto están marcados como borrador. Sustitúyelos solo después de aprobar los documentos legales.

## Ver la base de datos visualmente

```bash
npx prisma studio
```

Abre una interfaz web en el navegador para ver/editar las tablas directamente.

## Troubleshooting conexion a AWS RDS

- **"Can't reach database server"**: revisa el Security Group de tu instancia
  RDS -> Inbound rules -> debe permitir el puerto 5432 desde tu IP actual
  (tu IP cambia si reinicias tu router, revisa "My IP" de nuevo en la regla).
- **"Public access" en No**: si tu instancia no es publica, solo podras
  conectarte desde dentro de la misma VPC (ej: un servidor EC2), no desde
  tu PC local.
- **Contrasena con caracteres especiales**: si tu password tiene simbolos
  como `@` o `#`, debes codificarlos en la URL (URL-encode), o Prisma no
  podra parsear el `DATABASE_URL` correctamente.

## Cuando despliegues el backend (no solo la base de datos)

Esta guia cubre solo la BASE DE DATOS en RDS. Para correr el servidor Express
en si mismo en AWS, las opciones mas comunes son EC2 (una maquina virtual
donde corres `npm start`) o Elastic Beanstalk (mas administrado). Si prefieres
algo mas simple que EC2, tambien puedes desplegar el backend en Railway/Render
y apuntarlo a tu base de datos de RDS igual.

## Conexion alternativa con autenticacion IAM (sin password fijo)

Ademas de la conexion normal de Prisma (usuario + password en `DATABASE_URL`),
el proyecto incluye un modulo en `src/config/iamDb.js` que se conecta a Aurora
usando **autenticacion IAM**: en vez de una contrasena guardada, AWS genera un
token temporal (valido 15 minutos) que se regenera automaticamente en cada
conexion. Esto es lo que se describe como "autenticacion por nodo con
credenciales propias" en el proyecto de arquitectura de red edge.

### Por que no se usa esto para TODO el backend

Prisma administra su propio pool de conexiones y espera una `DATABASE_URL`
fija. Los tokens IAM expiran a los 15 minutos, asi que mezclarlos con Prisma
en produccion es delicado. Por eso el proyecto usa:
- **Prisma + password normal** para toda la app (CRUD de productos, carrito, etc.)
- **iamDb.js + pg puro** como modulo separado, para demostrar/usar autenticacion
  IAM en casos puntuales (por ejemplo, un nodo edge que solo necesita hacer
  consultas de solo lectura hacia la nube central).

### Configuracion en AWS (una sola vez)

1. En la consola de RDS, entra a tu instancia -> **Modify** -> activa
   **"IAM database authentication"** -> Continue -> Apply immediately.
2. Conectate a la base de datos (con el usuario maestro, por ejemplo via
   `psql` o Prisma Studio) y crea un usuario especial para IAM:
   ```sql
   CREATE USER app_iam_user;
   GRANT rds_iam TO app_iam_user;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_iam_user;
   ```
   Un usuario IAM no lleva password en Postgres: se autentica con el token.
3. En **IAM** (consola de AWS), crea una policy que permita conectarse:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": "rds-db:connect",
       "Resource": "arn:aws:rds-db:us-east-2:TU_ACCOUNT_ID:dbuser:TU_RESOURCE_ID/app_iam_user"
     }]
   }
   ```
   `TU_RESOURCE_ID` es el "Resource ID" de la instancia (lo ves en la pestaña
   Configuration de la instancia en RDS, empieza con `db-`).
4. Adjunta esa policy al usuario o rol de IAM que va a correr el backend.

### Configurar credenciales de AWS localmente

Para que `iamDb.js` pueda firmar el token, tu maquina necesita credenciales
de AWS disponibles. La forma mas simple:

```bash
aws configure
```

(te pedira Access Key ID, Secret Access Key y la region). Si el backend corre
en EC2 o ECS, es mejor usar un **rol de IAM adjunto a la instancia** en vez de
claves guardadas a mano.

### Probar la conexion IAM

```bash
npm run test:iam
```

Si todo esta bien configurado, deberia imprimir la hora del servidor y el
usuario conectado. Si falla, el script imprime una lista de cosas para
revisar (IAM auth habilitado, rol rds_iam, policy, Security Group).

### Importante: nunca pegues un token generado a mano en el codigo o el .env

Los enlaces de conexion con `X-Amz-Security-Token` que a veces genera la
consola de AWS son validos solo 15 minutos. Pegarlos en un archivo o en el
chat no sirve para nada permanente, y si alguien mas los ve, puede conectarse
mientras sigan vigentes. El codigo de este proyecto siempre genera un token
nuevo en el momento de conectar, nunca usa uno fijo.
