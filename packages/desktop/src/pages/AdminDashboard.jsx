import React, { useEffect, useState } from "react";
import { getAdminAnalytics, getAdminUsers, setAdminSellerStatus, setAdminUserStatus } from "@shein-clone/shared";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([getAdminAnalytics(), getAdminUsers(query)])
      .then(([stats, accountList]) => {
        if (!active) return;
        setAnalytics(stats);
        setUsers(accountList);
        setNotice("");
      })
      .catch((error) => { if (active) setNotice(error.response?.data?.error || "No se pudieron cargar los datos administrativos."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [query]);

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
    { label: "Órdenes", value: analytics.orders, note: "Registros actuales" },
    { label: "Valor bruto de órdenes", value: money.format(analytics.grossCop), note: "COP · sin ajustes ni devoluciones" },
    { label: "Cuentas activas", value: analytics.activeUsers, note: `${analytics.users} cuentas en total` },
    { label: "Productos publicados", value: analytics.activeProducts, note: `${analytics.sellersPending} vendedores pendientes` },
  ] : [];

  return (
    <div className="dashboard-content">
      <div className="page-title-row">
        <div>
          <p className="section-eyebrow">OPERACIÓN</p><h1>Centro de administración</h1><p className="muted-copy">Datos agregados de órdenes y cuentas registradas.</p>
        </div>
        <span className="data-badge">API EN VIVO</span>
      </div>

      <section className="metric-grid" aria-label="Analíticas">
        {metrics.map((metric) => <article className="metric-item" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
        {!metrics.length && <p className="empty-state">{isLoading ? "Cargando analíticas…" : "Analíticas no disponibles."}</p>}
      </section>

      <section className="workspace-section" aria-labelledby="analytics-title">
        <div className="section-heading"><div><p className="section-eyebrow">ÓRDENES</p><h2 id="analytics-title">Estados registrados</h2></div></div>
        <dl className="order-status-list">{Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => <div key={status}><dt>{status}</dt><dd>{count}</dd></div>)}{!Object.keys(analytics?.ordersByStatus || {}).length && <p className="empty-state">Aún no hay órdenes registradas.</p>}</dl>
      </section>

      <section className="workspace-section" aria-labelledby="users-title">
        <div className="section-heading"><div><p className="section-eyebrow">ACCESO</p><h2 id="users-title">Gestión de usuarios</h2></div><span className="data-badge">{users.length} cuentas</span></div>
        <label className="search-label">Filtrar por nombre, correo o rol<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cuentas" /></label>
        <div className="table-scroll">
          <table className="user-table">
            <thead><tr><th scope="col">Cuenta</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Cuenta</th><th scope="col">Perfil vendedor</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name || "Sin nombre"}</strong><span>{user.email}</span><small>{user.id}</small></td>
                <td>{user.role}</td>
                <td><span className={`user-state ${user.isActive ? "is-active" : "is-paused"}`}>{user.isActive ? "Activa" : "Pausada"}</span></td>
                <td><button className="outline-action" type="button" onClick={() => toggleUser(user)}>{user.isActive ? "Desactivar" : "Reactivar"}</button></td>
                <td>{user.sellerProfile && <><span className={`user-state ${user.sellerProfile.status === "ACTIVE" ? "is-active" : "is-paused"}`}>{user.sellerProfile.status}</span>{user.sellerProfile.status !== "ACTIVE" && <button className="outline-action" type="button" onClick={() => updateSellerStatus(user, "ACTIVE")}>Aprobar</button>}{user.sellerProfile.status === "ACTIVE" && <button className="outline-action" type="button" onClick={() => updateSellerStatus(user, "SUSPENDED")}>Suspender</button>}</>}</td>
              </tr>
            ))}</tbody>
          </table>
          {!users.length && <p className="empty-state">{isLoading ? "Cargando cuentas…" : "No hay cuentas que coincidan."}</p>}
        </div>
        <p className="form-status" aria-live="polite">{notice}</p>
      </section>
    </div>
  );
}