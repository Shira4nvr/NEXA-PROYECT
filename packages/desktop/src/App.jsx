import React from "react";
import AppRouter from "./router";
import { configureApiBaseUrl } from "@shein-clone/shared";

const apiBaseUrl = import.meta.env.VITE_API_URL;
if (apiBaseUrl) configureApiBaseUrl(apiBaseUrl);

export default function App() {
  if (!import.meta.env.DEV && !apiBaseUrl) {
    return (
      <main style={{ maxWidth: 640, margin: "15vh auto", padding: 32, fontFamily: "sans-serif" }}>
        <h1>Falta configurar el servidor</h1>
        <p>Esta instalación necesita la dirección HTTPS de la API. Configura VITE_API_URL y vuelve a compilar la aplicación.</p>
      </main>
    );
  }
  return <AppRouter />;
}
