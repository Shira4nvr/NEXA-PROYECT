import React from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import SellerDashboard from "../pages/SellerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import LegalCenter from "../pages/LegalCenter";
import WorkspaceShell from "../pages/WorkspaceShell";
import RequireRole from "./RequireRole";
import { useAuthStore, useCartStore } from "@shein-clone/shared";

function StoreLayout({ children }) {
  const logout = useAuthStore((state) => state.logout);
  return (
    <>
      <nav className="store-nav">
        <Link className="store-wordmark" to="/store">NEXO</Link>
        <div className="store-links">
          <Link to="/store">Tienda</Link>
          <Link to="/cart">Carrito</Link>
          <Link to="/" onClick={() => { logout(); useCartStore.getState().clearCart(); }}>Cerrar sesión</Link>
        </div>
      </nav>
      {children}
    </>
  );
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/store" element={<StoreLayout><Home /></StoreLayout>} />
        <Route path="/product/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />
        <Route path="/cart" element={<StoreLayout><Cart /></StoreLayout>} />
        <Route path="/seller" element={<RequireRole role="SELLER"><WorkspaceShell role="seller"><SellerDashboard /></WorkspaceShell></RequireRole>} />
        <Route path="/admin" element={<RequireRole role="ADMIN"><WorkspaceShell role="admin"><AdminDashboard /></WorkspaceShell></RequireRole>} />
        <Route path="/legal/:document" element={<WorkspaceShell><LegalCenter /></WorkspaceShell>} />
      </Routes>
    </HashRouter>
  );
}
