import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAddress,
  createOrder,
  deleteAddress,
  formatCurrency,
  getAddresses,
  updateAddress,
  useAuthStore,
  useCartStore,
} from "@shein-clone/shared";
import ColombiaAddressFields from "../components/ColombiaAddressFields";
import "./store.css";

const emptyAddress = { label: "Casa", street: "", city: "", state: "", zipCode: "", country: "CO" };

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal, error, clearCart } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [notice, setNotice] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    let active = true;
    getAddresses()
      .then((results) => {
        if (!active) return;
        setAddresses(results);
        const defaultAddress = results.find((item) => item.isDefault) || results[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setAddress(defaultAddress);
        }
      })
      .catch((loadError) => {
        if (active) setNotice(loadError.response?.data?.error || "No se pudieron cargar tus direcciones guardadas.");
      })
      .finally(() => { if (active) setIsLoadingAddresses(false); });
    return () => { active = false; };
  }, []);

  function selectAddress(addressId) {
    setSelectedAddressId(addressId);
    const savedAddress = addresses.find((item) => item.id === addressId);
    setAddress(savedAddress ? { ...savedAddress } : { ...emptyAddress });
    setNotice("");
  }

  async function confirmPurchase() {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setOrderId("");
    setNotice("");
    try {
      const savedAddress = selectedAddressId
        ? await updateAddress(selectedAddressId, address)
        : await createAddress({ ...address, isDefault: addresses.length === 0 });
      setAddresses((current) => [
        savedAddress,
        ...current
          .filter((item) => item.id !== savedAddress.id)
          .map((item) => savedAddress.isDefault ? { ...item, isDefault: false } : item),
      ]);
      setSelectedAddressId(savedAddress.id);
      const result = await createOrder(savedAddress.id);
      clearCart();
      setOrderId(result.orderId);
      setNotice("Tu compra se registró correctamente. Puedes consultar el seguimiento en Mis pedidos.");
    } catch (purchaseError) {
      const message = purchaseError.response?.data?.error || "No se pudo crear el pedido. Revisa la dirección e inténtalo de nuevo.";
      useCartStore.getState().setError(message);
      setNotice(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = getTotal();

  return (
    <main className="cart-page">
      <header className="cart-header">
        <div>
          <p className="store-eyebrow">TU COMPRA</p>
          <h1>Tu carrito</h1>
          <p>Revisa tus productos, guarda tu dirección y confirma el pedido.</p>
        </div>
        <span className="cart-count">{itemCount} {itemCount === 1 ? "artículo" : "artículos"}</span>
      </header>

      {error && <p className="cart-notice is-error" role="alert">{error}</p>}
      {notice && <p className={`cart-notice ${orderId ? "is-success" : ""}`} role={orderId ? "status" : "alert"}>{notice}{orderId && <> <Link to="/orders">Ver pedido</Link></>}</p>}
      {items.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty-icon">⌁</div>
          <h2>{orderId ? "Compra confirmada" : "Tu carrito está vacío"}</h2>
          <p>{orderId ? `Número de pedido: ${orderId}` : "Agrega productos para comenzar tu compra."}</p>
          <div className="cart-empty-actions">
            {orderId && <Link className="cart-checkout-button" to="/orders">Consultar mis pedidos</Link>}
            <Link className="cart-continue-link" to="/store">Seguir explorando productos</Link>
          </div>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-list" aria-label="Artículos del carrito">
            <div className="cart-list-heading"><h2>Productos seleccionados</h2><span>{items.length} referencias</span></div>
            {items.map((item) => (
              <article className="cart-item" key={item.variantId}>
                <img className="cart-item-image" src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h2>{item.name}</h2>
                  <p className="cart-item-price">{formatCurrency(item.price)} por unidad</p>
                  <div className="cart-quantity-control" aria-label={`Cantidad de ${item.name}`}>
                    <button type="button" aria-label={`Disminuir cantidad de ${item.name}`} onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label={`Aumentar cantidad de ${item.name}`} onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <span className="cart-item-total">{formatCurrency(item.price * item.quantity)}</span>
                  <button className="cart-remove-button" type="button" onClick={() => removeItem(item.variantId)}>Quitar</button>
                </div>
              </article>
            ))}
            <Link className="cart-continue-link" to="/store">← Seguir comprando</Link>
          </section>

          <aside className="cart-summary">
            <p className="store-eyebrow">PASO FINAL</p>
            <h2>Resumen de compra</h2>
            <div className="cart-summary-row"><span>Productos ({itemCount})</span><strong>{formatCurrency(total)}</strong></div>
            <div className="cart-summary-row"><span>Envío</span><strong>Por coordinar</strong></div>
            <form className="cart-address-form" onSubmit={(event) => { event.preventDefault(); setShowConfirmation(true); }}>
              {addresses.length > 0 && (
                <label>Dirección guardada
                  <select value={selectedAddressId} onChange={(event) => selectAddress(event.target.value)}>
                    {addresses.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.city}, {item.state}</option>)}
                    <option value="">+ Agregar otra dirección</option>
                  </select>
                </label>
              )}
              {addresses.length === 0 && !isLoadingAddresses && <p className="cart-address-hint">Registra una dirección para el envío; se guardará en tu cuenta.</p>}
              {isLoadingAddresses && <p className="cart-address-hint">Cargando tus direcciones guardadas…</p>}
              <ColombiaAddressFields value={address} onChange={setAddress} />
              <div className="cart-summary-row total"><span>Total de productos</span><strong>{formatCurrency(total)}</strong></div>
              <p className="cart-address-hint">El costo del envío se coordinará con el vendedor y no está incluido en este total.</p>
              <button className="cart-checkout-button" type="submit" disabled={isSubmitting || !token || isLoadingAddresses}>
                {isSubmitting ? "Procesando pedido…" : "Continuar y confirmar"}
              </button>
            </form>
          </aside>
        </div>
      )}

      {showConfirmation && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowConfirmation(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="purchase-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-icon">✓</div>
            <h2 id="purchase-title">Confirmar pedido</h2>
            <p>Vas a solicitar {itemCount} {itemCount === 1 ? "artículo" : "artículos"} por <strong>{formatCurrency(total)}</strong>.</p>
            <div className="modal-product">
              <img src={items[0]?.image} alt="" />
              <div><strong>{items[0]?.name}</strong><span>{items.length > 1 ? `y ${items.length - 1} referencias más` : "Un artículo"}</span></div>
            </div>
            <span className="modal-note">Entrega a {address.city}, {address.state} · {address.street}</span>
            <div className="modal-actions">
              <button className="modal-secondary-button" type="button" onClick={() => setShowConfirmation(false)}>Revisar</button>
              <button className="modal-primary-button" type="button" onClick={confirmPurchase} disabled={isSubmitting}>Confirmar compra</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
