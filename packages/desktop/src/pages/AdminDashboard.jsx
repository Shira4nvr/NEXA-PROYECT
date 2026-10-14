import React, { useEffect, useState } from "react";
import { getAdminAnalytics, getAdminOrders, getAdminUsers, setAdminSellerStatus, setAdminUserStatus, getPublicAssetUrl } from "@shein-clone/shared";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function AdminDashboard({ section = "metrics" }) {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isPeopleSection = section === "users" || section === "sellers";

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const request = section === "metrics"
      ? getAdminAnalytics().then((stats) => { if (active) setAnalytics(stats); })
      : section === "orders"
        ? getAdminOrders(orderStatus).then((orderList) => { if (active) setOrders(orderList); })
        : getAdminUsers(query, section === "sellers" ? "SELLER" : "").then((accountList) => { if (active) setUsers(accountList); });
    request
      .then(() => { if (active) setNotice(""); })
      .catch((error) => { if (active) setNotice(error.response?.data?.error || "No se pudieron cargar los datos administrativos."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [query, orderStatus, section]);

  async function toggleUser(user) {
    try {
      const updated = await setAdminUserStatus(user.id, !user.isActive);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, isActive: updated.isActive } : item));
      setNotice("Estado de la cuenta actualizado.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo cambiar el estado de la cuenta.");
    }
  }

  async function updateSellerStatus(user, status) {
    try {
      const updated = await setAdminSellerStatus(user.sellerProfile.id, status);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, sellerProfile: updated } : item));
      setNotice("Estado del vendedor actualizado.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo actualizar el perfil de vendedor.");
    }
  }

  const metrics = analytics ? [
    { label: "Pedidos registrados", value: analytics.orders, note: "Todas las compras" },
    { label: "Valor bruto", value: money.format(analytics.grossCop), note: "COP · sin ajustes ni devoluciones" },
    { label: "Cuentas activas", value: analytics.activeUsers, note: `${analytics.users} cuentas en total` },
    { label: "Productos publicados", value: analytics.activeProducts, note: `${analytics.sellersPending} vendedores pendientes` },
  ] : [];

  return (
    <div className="dashboard-content">
      <div className="page-title-row">
        <div>
          <p className="section-eyebrow">CENTRO DE CONTROL</p>
          <h1>Administración</h1>
          <p className="muted-copy">Cada área de operación tiene su propio espacio de trabajo.</p>
        </div>
        <span className="data-badge">DATOS EN VIVO</span>
      </div>

      {section === "metrics" && (
        <>
          <section className="metric-grid" aria-label="Métricas generales">
            {metrics.map((metric) => <article className="metric-item" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
            {!metrics.length && <p className="empty-state">{isLoading ? "Cargando métricas…" : "Métricas no disponibles."}</p>}
          </section>
          <section className="workspace-section" aria-labelledby="analytics-title">
            <div className="section-heading"><div><p className="section-eyebrow">OPERACIÓN</p><h2 id="analytics-title">Pedidos por estado de pago</h2></div></div>
            <dl className="order-status-list">{Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => <div key={status}><dt>{status}</dt><dd>{count}</dd></div>)}{!Object.keys(analytics?.ordersByStatus || {}).length && <p className="empty-state">{isLoading ? "Cargando datos…" : "Aún no hay pedidos registrados."}</p>}</dl>
          </section>
        </>
      )}

      {section === "orders" && (
        <section className="workspace-section" aria-labelledby="admin-orders-title">
          <div className="section-heading">
            <div><p className="section-eyebrow">OPERACIÓN Y CUMPLIMIENTO</p><h2 id="admin-orders-title">Pedidos de la tienda</h2></div>
            <label className="admin-order-filter">Filtrar por estado
              <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)}>
                <option value="">Todos los estados</option>
                <option value="PENDING">Pago pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="SHIPPED">Enviado</option>
                <option value="DELIVERED">Entregado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </label>
          </div>
          <div className="admin-order-list">
            {orders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <header>
                  <div><span className="section-eyebrow">PEDIDO · {order.status}</span><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</small></div>
                  <div><span className="section-eyebrow">CLIENTE</span><strong>{order.user.name || "Sin nombre"}</strong><small>{order.user.email}</small></div>
                  <strong className="admin-order-total">{money.format(order.total)}</strong>
                </header>
                <div className="admin-order-delivery"><strong>Entrega:</strong> {order.deliveryLabel} · {order.deliveryStreet}, {order.deliveryCity}, {order.deliveryState} · {order.deliveryZipCode}</div>
                <div className="admin-order-items">
                  {order.items.map((item) => {
                    const image = item.variant.product.images?.[0];
                    return <div className="admin-order-item" key={item.id}>
                      {image && <img src={getPublicAssetUrl(image.url)} alt="" />}
                      <span><strong>{item.variant.product.name}</strong><small>{item.variant.product.seller?.storeName || "NEXO"} · {item.variant.size} · {item.variant.color} · {item.quantity} unidad(es)</small></span>
                      <span>{item.fulfillmentStatus === "PREPARING" ? "Alistamiento" : item.fulfillmentStatus === "IN_TRANSIT" ? "En transporte" : item.fulfillmentStatus === "DELIVERED" ? "Entregado" : "Pedido recibido"}{item.estimatedArrival && <small>Llega {new Date(item.estimatedArrival).toLocaleDateString("es-CO", { dateStyle: "medium" })}</small>}</span>
                    </div>;
                  })}
                </div>
                <footer>{order.payment ? `Pago: ${order.payment.method === "CASH_ON_DELIVERY" ? "Contra entrega" : order.payment.method} · ${order.payment.status}` : "Sin información de pago"}</footer>
              </article>
            ))}
            {!orders.length && <p className="empty-state">{isLoading ? "Cargando pedidos…" : "No hay pedidos para este filtro."}</p>}
          </div>
        </section>
      )}

      {isPeopleSection && (
        <section className="workspace-section" aria-labelledby="people-title">
          <div className="section-heading">
            <div><p className="section-eyebrow">{section === "sellers" ? "PUBLICACIÓN Y ACCESO" : "ACCESO Y PERMISOS"}</p><h2 id="people-title">{section === "sellers" ? "Gestión de vendedores" : "Gestión de usuarios"}</h2></div>
            <span className="data-badge">{users.length} {section === "sellers" ? "vendedores" : "cuentas"}</span>
          </div>
          <label className="search-label">Filtrar por nombre, correo o rol<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={section === "sellers" ? "Buscar vendedores" : "Buscar cuentas"} /></label>
          <div className="table-scroll">
            <table className="user-table">
              <thead><tr><th scope="col">Cuenta</th><th scope="col">Rol</th><th scope="col">Cuenta</th>{section === "sellers" && <><th scope="col">Tienda</th><th scope="col">Perfil</th></>}</tr></thead>
              <tbody>{users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name || "Sin nombre"}</strong><span>{user.email}</span></td>
                  <td>{user.role}</td>
                  <td><span className={`user-state ${user.isActive ? "is-active" : "is-paused"}`}>{user.isActive ? "Activa" : "Pausada"}</span><button className="outline-action" type="button" onClick={() => toggleUser(user)}>{user.isActive ? "Desactivar" : "Reactivar"}</button></td>
                  {section === "sellers" && <>
                    <td>{user.sellerProfile?.storeName || "Sin tienda"}</td>
                    <td><span className={`user-state ${user.sellerProfile?.status === "ACTIVE" ? "is-active" : "is-paused"}`}>{user.sellerProfile?.status || "Sin perfil"}</span>
                      {user.sellerProfile?.status !== "ACTIVE" && <button className="outline-action" type="button" onClick={() => updateSellerStatus(user, "ACTIVE")}>Aprobar</button>}
                      {user.sellerProfile?.status === "ACTIVE" && <button className="outline-action" type="button" onClick={() => updateSellerStatus(user, "SUSPENDED")}>Suspender</button>}
                    </td>
                  </>}
                </tr>
              ))}</tbody>
            </table>
            {!users.length && <p className="empty-state">{isLoading ? "Cargando cuentas…" : section === "sellers" ? "No hay vendedores que coincidan." : "No hay usuarios que coincidan."}</p>}
          </div>
        </section>
      )}
      {notice && <p className="form-status" role="status">{notice}</p>}
    </div>
  );
}
