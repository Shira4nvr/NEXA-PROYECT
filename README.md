# NEXO — Marketplace multiplataforma

Monorepo con backend PostgreSQL/Prisma, aplicación de escritorio Electron y
aplicación móvil Expo para Android/iOS. Los clientes consumen la misma API y
comparten lógica de negocio mediante `packages/shared`.

## Estructura

```text
packages/
├── backend/  API REST, Prisma y PostgreSQL
├── desktop/  Aplicación de escritorio Electron + React + Vite
├── mobile/   Aplicación Android/iOS con React Native + Expo
└── shared/   Cliente API, estado y utilidades compartidas
```

## Desarrollo local

Instala las dependencias desde la raíz con `npm install`, configura PostgreSQL
y las variables del backend siguiendo [la guía del backend](./packages/backend/README.md).
Después inicia cada proceso desde la raíz:

```powershell
npm run backend
npm run desktop
npm run mobile
```

En Expo Go, la app móvil usa la dirección de red del servidor Expo para acceder
al backend. Un teléfono físico y un emulador no deben usar `localhost` para
conectarse a otro dispositivo.

## Instaladores y despliegue

- **Windows:** configura `VITE_API_URL` y ejecuta
  `npm run desktop:build`. El instalador queda en `release/`. Consulta
  [la guía de escritorio](./packages/desktop/README.md) para firma y requisitos
  de macOS.
- **Android/iOS:** configura `EXPO_PUBLIC_API_URL` con la URL HTTPS pública de
  la API, incluyendo `/api`, y usa EAS Build. Consulta
  [la guía móvil](./packages/mobile/README.md) para APK/AAB, iOS y credenciales.
- Las URLs de ejemplo no son servidores reales. No se debe distribuir una
  compilación hasta configurar y probar el dominio de producción del backend.
