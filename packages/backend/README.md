# Backend — Node.js + Express + Prisma + PostgreSQL (AWS RDS)

API REST para las aplicaciones, conectada a PostgreSQL mediante Prisma.
En producción, aloja el backend dentro de la VPC de RDS y conserva la base de
datos privada. Los clientes de escritorio y móvil se conectan a la API HTTPS,
nunca directamente a PostgreSQL.

## Instalacion (primera vez)

```bash
cd packages/backend
cp .env.example .env
```

Edita `.env` para apuntar `DATABASE_URL` a una base de desarrollo accesible
desde esta máquina. No copies credenciales de producción en el repositorio ni
en una aplicación cliente.

```bash
npm install
npx prisma migrate dev --name init
```

En desarrollo, estos comandos:
1. Instala dependencias (express, prisma, bcrypt, jwt, etc.)
2. Crea las tablas de desarrollo en PostgreSQL segun `schema.prisma`

`npm run seed` carga productos de muestra, pero elimina antes los datos
existentes; ejecútalo solo en una base de desarrollo desechable y vacía.

`prisma migrate dev` es para desarrollo. Para aplicar migraciones en un
entorno desplegado, usa `npx prisma migrate deploy` desde el backend con su
`DATABASE_URL` de producción inyectada por el gestor de secretos del servidor.
No ejecutes `npm run seed` en una base que ya contenga datos.

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
| GET | `/api/admin/orders?status=` | Admin | Consulta de pedidos con filtro por estado y avance logístico |
| GET | `/api/admin/users?search=` | Admin | Búsqueda de cuentas |
| PATCH | `/api/admin/users/:userId/status` | Admin | Activar/desactivar cuenta |
| PATCH | `/api/admin/sellers/:sellerId/status` | Admin | Aprobar/suspender vendedor |
| GET/POST/PATCH/DELETE | `/api/cart/...` | Autenticado | Carrito por variante y stock disponible |
| GET | `/api/orders` | Cliente autenticado | Historial de compras y seguimiento por artículo |
| POST | `/api/orders` | Cliente autenticado | Crear pedido con una dirección guardada |
| GET/POST/PATCH/DELETE | `/api/addresses/...` | Autenticado | Consultar, guardar, corregir y eliminar direcciones propias |
| GET | `/api/locations/cities` | Público | Municipios y departamentos de Colombia para formularios de entrega |
| GET | `/api/seller/orders` | Vendedor activo | Pedidos que contienen productos de su tienda |
| PATCH | `/api/seller/orders/items/:orderItemId/fulfillment` | Vendedor propietario | Alistamiento, transporte y fecha estimada de llegada |

El registro de vendedor requiere `storeName`, `legalName`, `identificationNumber`, `noticeAddress` y `contactPhone`, además de correo, contraseña y aceptación separada de términos/privacidad. El registro público no permite crear administradores.

La publicación de producto usa `multipart/form-data`: `name`, `categoryId`, `price` (entero COP), `stock`, `imageAlt` e `image` (JPEG/PNG/WebP, máximo 5 MB). Las imágenes quedan en `packages/backend/uploads` para desarrollo; configura almacenamiento privado externo antes de desplegar.

El seguimiento logístico se guarda por artículo, para que cada vendedor solo pueda actualizar los productos de su tienda aunque una compra incluya artículos de varias tiendas. Los estados avanzan de `PENDING` a `PREPARING`, `IN_TRANSIT` y `DELIVERED`; se exige programar una fecha de llegada antes de marcar el transporte. Cada pedido conserva una copia de los datos de entrega, así que corregir una dirección guardada no cambia pedidos anteriores. El catálogo de ciudades consulta la API pública de api-colombia.com y conserva los resultados en caché durante una hora.

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

## Conexión recomendada a AWS RDS

Mantén la instancia RDS en subredes privadas con **Public access = No**. El
backend es el único componente de la aplicación que necesita acceso a la base:

1. Despliega el backend en AWS dentro de la misma VPC (por ejemplo, en ECS
   Fargate o EC2) y configura un endpoint HTTPS público para la API mediante un
   Application Load Balancer y un certificado TLS.
2. En el Security Group de RDS, permite TCP/5432 **solo desde el Security
   Group del backend**. No abras PostgreSQL a `0.0.0.0/0` ni a Internet.
3. Inyecta `DATABASE_URL` y un `JWT_SECRET` aleatorio desde AWS Secrets Manager
   o el almacén de secretos del entorno. Usa un usuario PostgreSQL dedicado a
   la aplicación, no el usuario maestro `postgres`.
4. Aplica las migraciones con `npx prisma migrate deploy` como paso de release
   controlado. Haz una copia de seguridad y confirma el estado de la instancia
   antes de migrar.
5. Configura almacenamiento persistente y privado para imágenes de producto
   (por ejemplo, S3); el directorio local `uploads/` es solo para desarrollo y
   no debe ser el almacenamiento de producción.
6. Configura monitorización, copias de seguridad automáticas, rotación de
   credenciales y una comprobación de salud de `/health`.
7. Apunta las aplicaciones de escritorio y móvil a `https://<dominio-api>/api`.
   No pongas `DATABASE_URL`, contraseñas de PostgreSQL ni claves AWS en esos
   clientes.

Si se necesita administrar o probar la base privada desde el PC, usa una VPN
de la VPC o un túnel autenticado de administración (por ejemplo, AWS Systems
Manager Session Manager hacia un host de salto). No hace falta habilitar acceso
público a RDS para publicar las aplicaciones.

**Estado de conexión de esta máquina:** el `.env` local sigue apuntando a
`localhost/Tutienda`. El endpoint compartido para RDS no resolvió por DNS desde
este equipo, por lo que no se puede validar la ruta ni aplicar migraciones
remotas desde aquí. Se necesita que AWS conecte este equipo a la VPC mediante
VPN/túnel y que las credenciales se configuren localmente, sin enviarlas por
chat ni guardarlas en Git.

Consulta las guías de [escritorio](../desktop/README.md) y
[móvil](../mobile/README.md) para generar instaladores una vez que la API HTTPS
esté desplegada y accesible.

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
