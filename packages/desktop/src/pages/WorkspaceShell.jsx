import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "@shein-clone/shared";

export default function WorkspaceShell({ role, children }) {
  const logout = useAuthStore((state) => state.logout);
  const roleTitle = role === "seller" ? "Vendedor" : role === "admin" ? "Administración" : "Centro legal";
  const sectionLinks = role === "seller"
    ? [{ to: "/seller/products", label: "Productos" }, { to: "/seller/orders", label: "Pedidos" }]
    : role === "admin"
      ? [{ to: "/admin/metrics", label: "Métricas" }, { to: "/admin/orders", label: "Pedidos" }, { to: "/admin/users", label: "Usuarios" }, { to: "/admin/sellers", label: "Vendedores" }]
      : [];

  return (
    <div className="workspace-page">
      <header className="workspace-nav">
        <Link className="store-wordmark" to="/">NEXO</Link>
        <nav aria-label="Navegación principal" className="workspace-nav-links">
          <Link to="/store">Tienda</Link>
          {sectionLinks.map((item) => <NavLink to={item.to} key={item.to}>{item.label}</NavLink>)}
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