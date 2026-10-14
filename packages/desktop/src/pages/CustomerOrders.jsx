import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAddress,
  deleteAddress,
  formatCurrency,
  getAddresses,
  getCustomerOrders,
  getPublicAssetUrl,
  updateAddress,
} from "@shein-clone/shared";
import ColombiaAddressFields from "../components/ColombiaAddressFields";
import "./store.css";

const EMPTY_ADDRESS = { label: "", street: "", city: "", state: "", zipCode: "", country: "CO" };
const FULFILLMENT_STEPS = [
  ["PENDING", "Pedido recibido"],
  ["PREPARING", "Preparando"],
  ["IN_TRANSIT", "En transporte"],
  ["DELIVERED", "Entregado"],
];
const FULFILLMENT_LABELS = Object.fromEntries(FULFILLMENT_STEPS);
const ORDER_LABELS = { PENDING: "Pago pendiente", PAID: "Pagado", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELLED: "Cancelado" };

function dateLabel(value, options = { dateStyle: "medium" }) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-CO", options).format(new Date(value));
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getCustomerOrders(), getAddresses()])
      .then(([customerOrders, savedAddresses]) => {
        if (!active) return;
        setOrders(customerOrders);
        setAddresses(savedAddresses);
      })
      .catch((error) => {
        if (active) setNotice(error.response?.data?.error || "No se pudo cargar la información de tu cuenta.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setAddress({ ...item });
    setNotice("");
  }

  function cancelEdit() {
    setEditingId("");
    setAddress(EMPTY_ADDRESS);
  }

  async function saveAddress(event) {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    try {
      const saved = editingId
        ? await updateAddress(editingId, address)
        : await createAddress({ ...address, isDefault: addresses.length === 0 });
      setAddresses((current) => {
        const next = editingId
          ? current.map((item) => item.id === saved.id ? saved : saved.isDefault ? { ...item, isDefault: false } : item)
          : [...current, saved];
        return next.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.label.localeCompare(b.label, "es"));
      });
      setNotice(editingId ? "Dirección actualizada." : "Dirección guardada en tu cuenta.");
      cancelEdit();
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo guardar la dirección.");
    } finally {
      setIsSaving(false);
    }
  }

  async function markDefault(item) {
    try {
      const saved = await updateAddress(item.id, { isDefault: true });
      setAddresses((current) => current.map((entry) => ({ ...entry, isDefault: entry.id === saved.id })));
      setNotice("Dirección principal actualizada.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo actualizar la dirección.");
    }
  }

  async function removeAddress(item) {
    try {
      await deleteAddress(item.id);
      setAddresses((current) => {
        const remaining = current.filter((entry) => entry.id !== item.id);
        if (item.isDefault && remaining.length) remaining[0] = { ...remaining[0], isDefault: true };
        return remaining;
      });
      if (editingId === item.id) cancelEdit();
      setNotice("Dirección eliminada.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo eliminar la dirección.");
    }
  }

  return (
    <main className="customer-orders-page">
      <header className="cart-header">
        <div>
          <p className="store-eyebrow">TU CUENTA</p>
          <h1>Mis pedidos</h1>
          <p>Consulta tus compras, su preparación y la fecha estimada de llegada.</p>
        </div>
        <Link className="cart-continue-link" to="/store">Seguir comprando</Link>
      </header>

      {notice && <p className="cart-notice" role="status">{notice}</p>}
      <section className="customer-orders-section" aria-labelledby="orders-title">
        <div className="cart-list-heading">
          <div><p className="store-eyebrow">SOLICITUDES Y COMPRAS</p><h2 id="orders-title">Seguimiento de pedidos</h2></div>
          <span>{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</span>
        </div>
        {isLoading && <p className="cart-address-hint">Cargando tus pedidos…</p>}
        {!isLoading && orders.length === 0 && (
          <div className="cart-empty compact"><h3>Aún no tienes pedidos</h3><p>Cuando confirmes una compra, su seguimiento aparecerá aquí.</p><Link to="/store">Explorar la tienda</Link></div>
        )}
        <div className="customer-order-list">
          {orders.map((order) => (
            <article className="customer-order-card" key={order.id}>
              <header className="customer-order-header">
                <div><span className="store-eyebrow">PEDIDO</span><strong>{order.id}</strong></div>
                <div><span className="store-eyebrow">FECHA</span><strong>{dateLabel(order.createdAt)}</strong></div>
                <div><span className="order-status-pill">{ORDER_LABELS[order.status] || order.status}</span></div>
                <strong>{formatCurrency(order.total)}</strong>
              </header>
              <div className="customer-order-items">
                {order.items.map((item) => {
                  const product = item.variant.product;
                  const image = product.images?.[0];
                  const currentStep = FULFILLMENT_STEPS.findIndex(([status]) => status === item.fulfillmentStatus);
                  return (
                    <div className="customer-order-item" key={item.id}>
                      {image && <img src={getPublicAssetUrl(image.url)} alt={image.altText || product.name} />}
                      <div className="customer-order-item-main">
                        <div className="customer-order-item-title"><strong>{product.name}</strong><span>{item.variant.size} · {item.variant.color} · Cantidad {item.quantity}</span></div>
                        <div className="fulfillment-timeline" aria-label={`Estado: ${FULFILLMENT_LABELS[item.fulfillmentStatus] || item.fulfillmentStatus}`}>
                          {FULFILLMENT_STEPS.map(([status, label], index) => (
                            <div className={`fulfillment-step ${index <= currentStep ? "is-complete" : ""}`} key={status}>
                              <span>{index < currentStep ? "✓" : index + 1}</span><small>{label}</small>
                            </div>
                          ))}
                        </div>
                        <div className="customer-order-item-meta">
                          <span>Vendedor: {product.seller?.storeName || "NEXO"}</span>
                          {item.estimatedArrival && <strong>Llegada estimada: {dateLabel(item.estimatedArrival)}</strong>}
                        </div>
                      </div>
                      <strong className="customer-order-item-price">{formatCurrency(item.priceAtOrder * item.quantity)}</strong>
                    </div>
                  );
                })}
              </div>
              <footer className="customer-order-address">
                <span>Entrega: {order.deliveryLabel} · {order.deliveryStreet}, {order.deliveryCity}, {order.deliveryState} · {order.deliveryZipCode}</span>
                {order.payment && <span>Pago: {order.payment.method === "CASH_ON_DELIVERY" ? "Contra entrega" : order.payment.method}</span>}
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="customer-orders-section address-book" aria-labelledby="addresses-title">
        <div className="cart-list-heading">
          <div><p className="store-eyebrow">DATOS DE ENTREGA</p><h2 id="addresses-title">Mis direcciones</h2><p>Guarda varias ubicaciones y elige una al pagar.</p></div>
          <span>{addresses.length} guardadas</span>
        </div>
        <div className="saved-address-list">
          {addresses.map((item) => (
            <article className="saved-address-card" key={item.id}>
              <div><strong>{item.label} {item.isDefault && <span className="default-address-badge">Principal</span>}</strong><p>{item.street}<br />{item.city}, {item.state} · {item.zipCode}</p></div>
              <div className="saved-address-actions">
                {!item.isDefault && <button type="button" className="outline-action" onClick={() => markDefault(item)}>Hacer principal</button>}
                <button type="button" className="outline-action" onClick={() => startEdit(item)}>Editar</button>
                <button type="button" className="delete-action" onClick={() => removeAddress(item)}>Eliminar</button>
              </div>
            </article>
          ))}
          {!addresses.length && <p className="empty-state">Aún no tienes direcciones guardadas.</p>}
        </div>
        <form className="address-book-form" onSubmit={saveAddress}>
          <h3>{editingId ? "Editar dirección" : "Agregar una dirección"}</h3>
          <div className="address-form-grid"><ColombiaAddressFields value={address} onChange={setAddress} idPrefix="address-book" /></div>
          <div className="saved-address-actions">
            <button type="submit" className="solid-action" disabled={isSaving}>{isSaving ? "Guardando…" : editingId ? "Guardar cambios" : "Guardar dirección"}</button>
            {editingId && <button type="button" className="outline-action" onClick={cancelEdit}>Cancelar</button>}
          </div>
        </form>
      </section>
    </main>
  );
}
