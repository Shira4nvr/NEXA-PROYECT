import React, { useEffect, useState } from "react";
import { archiveSellerProduct, createSellerProduct, getCategories, getSellerProducts, getSellerProfile, updateSellerProduct } from "@shein-clone/shared";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getSellerProfile(), getCategories()])
      .then(async ([sellerProfile, availableCategories]) => {
        const sellerProducts = sellerProfile.status === "ACTIVE" ? await getSellerProducts() : [];
        if (!active) return;
        setProfile(sellerProfile);
        setCategories(availableCategories);
        setProducts(sellerProducts);
      })
      .catch((error) => {
        if (active) setNotice(error.response?.data?.error || "No se pudo conectar con el módulo de vendedor.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setNotice("Selecciona una imagen de hasta 5 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setNotice("");
  }

  async function addProduct(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!imageFile) return setNotice("Selecciona una fotografía para el producto.");
    const fields = new FormData(formElement);
    const payload = new FormData();
    payload.append("name", fields.get("product-name"));
    payload.append("price", fields.get("price"));
    payload.append("stock", fields.get("stock"));
    payload.append("categoryId", fields.get("categoryId"));
    payload.append("imageAlt", fields.get("image-alt"));
    payload.append("image", imageFile);
    setNotice("");
    try {
      const product = await createSellerProduct(payload);
      setProducts((current) => [product, ...current]);
      formElement.reset();
      setImageFile(null);
      setImagePreview("");
      setNotice("Producto guardado en la base de datos.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo guardar el producto.");
    }
  }

  async function changeStock(product, amount) {
    const stock = Math.max(0, product.variants.reduce((sum, variant) => sum + variant.stock, 0) + amount);
    try {
      await updateSellerProduct(product.id, { stock });
      setProducts((current) => current.map((item) => item.id === product.id
        ? { ...item, variants: item.variants.map((variant) => ({ ...variant, stock })) }
        : item));
      setNotice("Stock actualizado en la base de datos.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo actualizar el stock.");
    }
  }

  async function removeProduct(productId) {
    try {
      await archiveSellerProduct(productId);
      setProducts((current) => current.filter((product) => product.id !== productId));
      setNotice("Producto retirado del catálogo.");
    } catch (error) {
      setNotice(error.response?.data?.error || "No se pudo retirar el producto.");
    }
  }

  return (
    <div className="dashboard-content">
      <div className="page-title-row">
        <div><p className="section-eyebrow">CATÁLOGO</p><h1>Productos</h1><p className="muted-copy">Gestiona publicaciones, precios y existencias de muestra.</p></div>
          <span className="data-badge">{products.length} productos</span>
      </div>

        {profile?.status === "PENDING" && <div className="legal-draft-alert" role="status">Tu perfil de vendedor está pendiente de aprobación. No podrás publicar productos hasta que administración lo active.</div>}
        {profile?.status === "SUSPENDED" && <div className="legal-draft-alert" role="alert">El perfil de vendedor está suspendido. Contacta a administración.</div>}
        {isLoading && <p className="muted-copy">Cargando inventario…</p>}

      <section className="workspace-section" aria-labelledby="add-product-title">
        <div className="section-heading"><div><p className="section-eyebrow">NUEVA PUBLICACIÓN</p><h2 id="add-product-title">Añadir producto</h2></div></div>
        <form className="product-form" onSubmit={addProduct}>
          <div className="product-form-fields">
            <label>Nombre del producto<input name="product-name" autoComplete="off" maxLength="100" required /></label>
            <label>Precio de venta (COP)<input name="price" type="number" inputMode="numeric" min="1" step="1" required /></label>
            <label>Unidades disponibles<input name="stock" type="number" inputMode="numeric" min="0" step="1" defaultValue="0" required /></label>
            <label>Categoría<select name="categoryId" required defaultValue=""><option value="" disabled>Selecciona una categoría</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
            <label>Fotografía<input name="product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} required /></label>
            <label className="wide-field">Texto alternativo de la foto<input name="image-alt" maxLength="180" placeholder="Describe la información visual de la foto" required={Boolean(imagePreview)} /></label>
          </div>
          <div className="form-bottom-row">
            {imagePreview ? <img className="upload-preview" src={imagePreview} alt="Vista previa de la fotografía que se publicará" /> : <span className="field-hint">Si subes una foto, añade texto alternativo descriptivo. No incluyas datos de personas sin autorización.</span>}
            <button type="submit" className="solid-action" disabled={isLoading || profile?.status !== "ACTIVE"}>Publicar producto</button>
          </div>
          <p className="form-status" aria-live="polite">{notice}</p>
        </form>
      </section>

      <section className="workspace-section" aria-labelledby="inventory-title">
        <div className="section-heading"><div><p className="section-eyebrow">INVENTARIO</p><h2 id="inventory-title">Publicaciones</h2></div></div>
        <div className="seller-product-list">
          {products.map((product) => (
            <article className="seller-product-row" key={product.id}>
              <img src={product.image} alt={product.imageAlt || product.name} />
              <div className="seller-product-info"><h3>{product.name}</h3><p>{money.format(product.price)}</p><span>{product.imageAlt ? "Texto alternativo agregado" : "Falta texto alternativo"}</span></div>
              <div className="stock-control" aria-label={`Existencias de ${product.name}`}>
                <button type="button" aria-label={`Reducir stock de ${product.name}`} onClick={() => changeStock(product, -1)}>−</button>
                <output aria-label={`Stock: ${product.variants.reduce((sum, variant) => sum + variant.stock, 0)}`}>{product.variants.reduce((sum, variant) => sum + variant.stock, 0)}</output>
                <button type="button" aria-label={`Aumentar stock de ${product.name}`} onClick={() => changeStock(product, 1)}>+</button>
              </div>
              <button className="delete-action" type="button" onClick={() => removeProduct(product.id)}>Eliminar</button>
            </article>
          ))}
          {products.length === 0 && <p className="empty-state">No hay productos en esta vista de demostración.</p>}
        </div>
      </section>
    </div>
  );
}