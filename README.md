# Shein Clone — Arquitectura Base

App de e-commerce con dos clientes (movil y escritorio) que comparten la MISMA
logica de negocio (llamadas a API, estado global, validaciones, formato de moneda).

## Estructura

```
shein-clone/
├── packages/
│   ├── shared/     -> Logica compartida (API, stores, utils). NO tiene UI.
│   ├── mobile/     -> App movil con React Native + Expo (iOS/Android)
│   └── desktop/    -> App de escritorio con Electron + React + Vite (Windows/Mac/Linux)
```

## Por que este enfoque

- `shared` no sabe nada de React Native ni de Electron: solo hace fetch de datos,
  guarda estado (Zustand) y expone funciones puras. Esto evita duplicar la logica
  de negocio en cada plataforma.
- `mobile` y `desktop` SOLO se encargan de la interfaz visual (pantallas,
  componentes, navegacion) y consumen `shared`.
- Cuando cambies una regla de negocio (ej: como se calcula el total del carrito,
  o como se valida el login) la cambias UNA vez en `shared` y se refleja en
  ambas apps.

## Como instalar (cuando tengas internet/npm disponible)

```bash
# En la raiz del proyecto
npm install

# Correr la app movil (abre Expo, escaneas QR con tu celular)
npm run mobile

# Correr la app de escritorio (abre ventana de Electron)
npm run desktop
```

## Backend

Este esqueleto asume que existe una API REST (ej: Node.js + Express + PostgreSQL)
con endpoints como:

- `GET /products`
- `GET /products/:id`
- `POST /auth/login`
- `GET /cart`, `POST /cart/items`, etc.

Mientras no tengas el backend listo, `packages/shared/src/api/client.js` apunta
a una URL de ejemplo y los servicios devuelven datos de prueba (mock) para que
puedas seguir construyendo la interfaz sin bloquearte.

## Siguientes pasos sugeridos

1. Definir el backend (API) y reemplazar los mocks en `packages/shared/src/api`.
2. Agregar autenticacion real (JWT) en `useAuthStore`.
3. Agregar pasarela de pago (Stripe, MercadoPago, etc.) en desktop y mobile.
4. Agregar notificaciones push (Expo Notifications) en mobile.
5. Empaquetar desktop para distribucion (`electron-builder`) y mobile con EAS Build.
