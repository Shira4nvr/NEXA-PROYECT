import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@shein-clone/shared";

export default function WorkspaceShell({ role, children }) {
  const logout = useAuthStore((state) => state.logout);
  const roleTitle = role === "seller" ? "Vendedor" : role === "admin" ? "Administración" : "Centro legal";

  return (
    <div className="workspace-page">
      <header className="workspace-nav">
        <Link className="store-wordmark" to="/">NEXO</Link>
        <nav aria-label="Navegación principal" className="workspace-nav-links">
          <Link to="/seller">Vendedor</Link>
          <Link to="/admin">Administración</Link>
          <Link to="/legal/terms">Documentos</Link>
          <Link to="/" onClick={logout}>Cerrar sesión</Link>
        </nav>
      </header>
      <div className="workspace-heading">
        <span>ESPACIO DE {roleTitle.toLocaleUpperCase("es-CO")}</span>
        <strong>SESION AUTENTICADA · DATOS DEL SERVIDOR</strong>
      </div>
      <div className="workspace-warning" role="note">
        Las funciones requieren un rol autorizado. Las imágenes de producto se almacenan localmente en el servidor de desarrollo.
      </div>
      <main className="workspace-main">{children}</main>
      <footer className="workspace-footer">
        <span>NEXO · PANEL OPERATIVO</span>
        <nav aria-label="Políticas"><Link to="/legal/terms">Términos</Link><Link to="/legal/privacy">Privacidad</Link><Link to="/legal/refunds">Reembolsos</Link></nav>
      </footer>
    </div>
  );
}