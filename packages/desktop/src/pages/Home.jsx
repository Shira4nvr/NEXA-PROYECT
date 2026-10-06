import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProductStore } from "@shein-clone/shared";
import ProductCard from "../components/ProductCard";
import "./store.css";

export default function Home() {
  const { products, fetchProducts, error, isLoading } = useProductStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main className="store-page">
      <section className="store-hero">
        <div className="store-hero-copy">
          <p className="store-eyebrow">Colección 2026</p>
          <h1>Productos que<br />se adaptan a ti.</h1>
          <p>Descubre piezas cuidadosamente seleccionadas, con información clara y un proceso de compra sencillo.</p>
        </div>
        <p className="store-result-count"><strong>{products.length}</strong> productos disponibles</p>
      </section>

      {isLoading && <p className="store-status" role="status">Cargando catálogo…</p>}
      {error && <p className="store-state-card" role="alert">{error}</p>}
      {!isLoading && !error && products.length === 0 && (
        <div className="store-state-card">
          <h2>Catálogo vacío</h2>
          <p>No hay productos disponibles en este momento.</p>
        </div>
      )}
      {!isLoading && !error && products.length > 0 && (
        <div className="store-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} onClick={() => navigate(`/product/${product.id}`)} />)}
        </div>
      )}
    </main>
  );
}
