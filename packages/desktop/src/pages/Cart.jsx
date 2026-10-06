import React, { useState } from "react";
import { useCartStore, formatCurrency, createOrder, useAuthStore } from "@shein-clone/shared";
import "./store.css";

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal, error, clearCart } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [address, setAddress] = useState({
    label: "Entrega",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "CO",
  });

  async function handlePurchase(event) {
    event.preventDefault();
    if (!token || items.length === 0) return;

    setShowConfirmation(true);
  }

  async function confirmPurchase() {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setOrderId("");
    try {
      const result = await createOrder(address);
      clearCart();
      setOrderId(result.orderId);
    } catch (purchaseError) {
      useCartStore.getState().setError?.(purchaseError.response?.data?.error || "No se pudo crear el pedido");
    } finally {
      setIsSubmitting(false);
    }
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <main className="cart-page">
      <header className="cart-header">
        <div>
          <h1>Tu carrito</h1>
          <p>Revisa los artículos y la dirección antes de comprar.</p>
        </div>
        <span className="cart-count">{itemCount} {itemCount === 1 ? "artículo" : "artículos"}</span>
      </header>

      {error && <p role="alert">{error}</p>}
      {items.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty-icon">⌁</div>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega un producto para comenzar tu compra.</p>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-list" aria-label="Artículos del carrito">
            {items.map((item) => (
              <article className="cart-item" key={item.variantId}>
                <img className="cart-item-image" src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h2>{item.name}</h2>
                  <p className="cart-item-price">{formatCurrency(item.price)} por unidad</p>
                  <div className="cart-quantity-control" aria-label={`Cantidad de ${item.name}`}>
                    <button type="button" aria-label="Disminuir cantidad" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label="Aumentar cantidad" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <span className="cart-item-total">{formatCurrency(item.price * item.quantity)}</span>
                  <button className="cart-remove-button" type="button" onClick={() => removeItem(item.variantId)}>Quitar</button>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-summary">
            <h2>Resumen de compra</h2>
            <div className="cart-summary-row"><span>Artículos</span><strong>{itemCount}</strong></div>
            <div className="cart-summary-row"><span>Subtotal</span><strong>{formatCurrency(getTotal())}</strong></div>
            <form className="cart-address-form" onSubmit={handlePurchase}>
              <label>Dirección de entrega
                <input required value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} placeholder="Calle y número" />
              </label>
              <label>Ciudad
                <input required value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} placeholder="Ciudad" />
              </label>
              <label>Departamento
                <input required value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} placeholder="Departamento" />
              </label>
              <label>Código postal
                <input required value={address.zipCode} onChange={(event) => setAddress({ ...address, zipCode: event.target.value })} placeholder="Código postal" />
              </label>
              <div className="cart-summary-row total"><span>Total</span><strong>{formatCurrency(getTotal())}</strong></div>
              <button className="cart-checkout-button" type="submit" disabled={isSubmitting || !token}>
                {isSubmitting ? "Creando pedido…" : "Confirmar compra"}
              </button>
            </form>
          </aside>
        </div>
      )}

      {orderId && <p role="status">Pedido creado: {orderId}</p>}

      {showConfirmation && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowConfirmation(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="purchase-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-icon">✓</div>
            <h2 id="purchase-title">Confirmar compra</h2>
            <p>Estás a punto de crear un pedido por <strong>{formatCurrency(getTotal())}</strong> con {itemCount} {itemCount === 1 ? "artículo" : "artículos"}.</p>
            <div className="modal-product">
              <img src={items[0]?.image} alt="" />
              <div><strong>{items[0]?.name}</strong><span>{items.length > 1 ? `y ${items.length - 1} artículos más` : "Articulo único"}</span></div>
            </div>
            <span className="modal-note">El pedido se procesará con la dirección ingresada.</span>
            <div className="modal-actions">
              <button className="modal-secondary-button" type="button" onClick={() => setShowConfirmation(false)}>Cancelar</button>
              <button className="modal-primary-button" type="button" onClick={confirmPurchase} disabled={isSubmitting}>Confirmar pedido</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
