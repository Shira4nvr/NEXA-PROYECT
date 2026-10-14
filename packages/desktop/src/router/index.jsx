import React from "react";
import { HashRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import SellerDashboard from "../pages/SellerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import CustomerOrders from "../pages/CustomerOrders";
import LegalCenter from "../pages/LegalCenter";
import WorkspaceShell from "../pages/WorkspaceShell";
import RequireRole from "./RequireRole";
import { useAuthStore, useCartStore } from "@shein-clone/shared";

function StoreLayout({ children }) {
  const logout = useAuthStore((state) => state.logout);
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  return (
    <>
      <nav className="store-nav">
        <Link className="store-wordmark" to="/store">NEXO</Link>
        <div className="store-links">
          <Link to="/store">Tienda</Link>
          <Link to="/cart">Carrito{itemCount > 0 ? ` (${itemCount})` : ""}</Link>
          <Link to="/orders">Mis pedidos</Link>
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
        <Route path="/orders" element={<RequireRole role="CUSTOMER"><StoreLayout><CustomerOrders /></StoreLayout></RequireRole>} />
        <Route path="/seller" element={<Navigate to="/seller/products" replace />} />
        <Route path="/seller/products" element={<RequireRole role="SELLER"><WorkspaceShell role="seller"><SellerDashboard section="products" /></WorkspaceShell></RequireRole>} />
        <Route path="/seller/orders" element={<RequireRole role="SELLER"><WorkspaceShell role="seller"><SellerDashboard section="orders" /></WorkspaceShell></RequireRole>} />
        <Route path="/admin" element={<Navigate to="/admin/metrics" replace />} />
        <Route path="/admin/metrics" element={<RequireRole role="ADMIN"><WorkspaceShell role="admin"><AdminDashboard section="metrics" /></WorkspaceShell></RequireRole>} />
        <Route path="/admin/orders" element={<RequireRole role="ADMIN"><WorkspaceShell role="admin"><AdminDashboard section="orders" /></WorkspaceShell></RequireRole>} />
        <Route path="/admin/users" element={<RequireRole role="ADMIN"><WorkspaceShell role="admin"><AdminDashboard section="users" /></WorkspaceShell></RequireRole>} />
        <Route path="/admin/sellers" element={<RequireRole role="ADMIN"><WorkspaceShell role="admin"><AdminDashboard section="sellers" /></WorkspaceShell></RequireRole>} />
        <Route path="/legal/:document" element={<WorkspaceShell><LegalCenter /></WorkspaceShell>} />
      </Routes>
    </HashRouter>
  );
}
