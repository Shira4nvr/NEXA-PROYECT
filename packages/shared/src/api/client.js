import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

// Backend local (Express + Prisma). Cambialo por tu URL de produccion cuando despliegues.
//
// IMPORTANTE para mobile: "localhost" en tu celular apunta al propio celular,
// no a tu PC. Si pruebas con Expo Go en un dispositivo fisico, reemplaza esto
// por la IP local de tu PC en la red, ej: "http://192.168.1.15:4000/api"
// (consiguela con `ipconfig` en Windows o `ifconfig` en Mac/Linux).
// En el emulador de Android usa "http://10.0.2.2:4000/api".
const BASE_URL = "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export function configureApiBaseUrl(baseURL) {
  if (typeof baseURL === "string" && /^https?:\/\//i.test(baseURL)) {
    apiClient.defaults.baseURL = baseURL.replace(/\/$/, "");
  }
}

export function getPublicAssetUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url || "";
  const origin = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

// Agrega automaticamente el token de sesion (si existe) a cada request.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo centralizado de errores (ej: token vencido -> logout automatico).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
