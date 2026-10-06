import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductStore, useCartStore, formatCurrency } from "@shein-clone/shared";
import "./store.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProduct, fetchProductById } = useProductStore();
  const addItem = useCartStore((state) => state.addItem);
  const itemCount = useCartStore((state) => state.items.length);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProductById(id);
  }, [id]);

  if (!selectedProduct) return <main className="product-detail-page"><div className="store-state-card"><h2>Producto</h2><p>Cargando información…</p></div></main>;

  async function addToCart() {
    await addItem(selectedProduct);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  return (
    <main className="product-detail-page">
      <button className="product-detail-back" type="button" onClick={() => navigate("/store")}>← Volver a la tienda</button>
      <div className="product-detail-grid">
        <img className="product-detail-image" src={selectedProduct.image} alt={selectedProduct.imageAlt || selectedProduct.name || "Producto"} />
        <section className="product-detail-copy">
          <p className="store-eyebrow">Producto seleccionado</p>
          <h1>{selectedProduct.name}</h1>
          <p className="product-detail-price">{formatCurrency(selectedProduct.price)}</p>
          <p className="product-detail-description">{selectedProduct.description || "Producto seleccionado con información disponible en el catálogo."}</p>
          <div className="product-detail-actions">
            <button className="product-detail-button" type="button" onClick={addToCart}>Agregar al carrito</button>
            <span className="product-detail-status">{itemCount > 0 ? `${itemCount} artículos en tu carrito` : "Carrito vacío"}</span>
          </div>
        </section>
      </div>

      {added && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAdded(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="added-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-icon">✓</div>
            <h2 id="added-title">Añadido al carrito</h2>
            <p>{selectedProduct.name} se añadió correctamente. Puedes seguir comprando o revisar tu carrito.</p>
            <div className="modal-actions">
              <button className="modal-secondary-button" type="button" onClick={() => setAdded(false)}>Continuar</button>
              <button className="modal-primary-button" type="button" onClick={() => navigate("/cart")}>Ver carrito</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
