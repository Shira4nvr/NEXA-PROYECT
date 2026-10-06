import React from "react";
import { formatCurrency } from "@shein-clone/shared";
import "../pages/store.css";

export default function ProductCard({ product, onClick }) {
  return (
    <article
      className="product-card"
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="product-card-image-wrap">
        <img className="product-card-image" src={product.image} alt={product.imageAlt || product.name || "Producto"} />
        <span className="product-card-arrow" aria-hidden="true">↗</span>
      </div>
      <div className="product-card-body">
        <div className="product-card-meta">
          <p className="product-card-name">{product.name}</p>
          <p className="product-card-price">{formatCurrency(product.price)}</p>
        </div>
        {product.description && <p className="product-card-description">{product.description}</p>}
      </div>
    </article>
  );
}
