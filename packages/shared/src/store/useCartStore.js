import { create } from "zustand";
import { addItemToServer, fetchCartFromServer, removeItemFromServer, updateItemOnServer } from "../api/cart";
import { apiClient } from "../api/client";
import { useAuthStore } from "./useAuthStore";

function imageUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url || "";
  const origin = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function normalizeCartItem(item) {
  const variant = item.variant || {};
  const product = variant.product || {};
  const image = product.images?.[0];
  return {
    productId: product.id || item.productId,
    variantId: variant.id || item.variantId,
    name: product.name || item.name,
    price: variant.price ?? product.basePrice ?? item.price ?? 0,
    image: imageUrl(image?.url || product.image || item.image),
    quantity: item.quantity,
  };
}

export const useCartStore = create((set, get) => ({
  items: [],
  error: null,

  setError: (message) => set({ error: message }),

  syncFromServer: async () => {
    if (!useAuthStore.getState().token) return;
    try {
      const items = await fetchCartFromServer();
      set({ items: items.map(normalizeCartItem), error: null });
    } catch (error) {
      set({ error: error.response?.data?.error || "No se pudo cargar el carrito" });
    }
  },

  addItem: async (product) => {
    const variant = product.variants?.[0];
    if (!variant) {
      set({ error: "Este producto no tiene una variante disponible" });
      return;
    }
    const authenticated = Boolean(useAuthStore.getState().token);
    try {
      const item = authenticated
        ? normalizeCartItem(await addItemToServer(variant.id, 1))
        : normalizeCartItem({
            variantId: variant.id,
            quantity: 1,
            variant: { ...variant, product: { ...product, basePrice: product.basePrice ?? product.price } },
          });
      const current = get().items;
      const existing = current.find((entry) => entry.variantId === item.variantId);
      set({
        items: existing
          ? current.map((entry) => entry.variantId === item.variantId ? item : entry)
          : [...current, item],
        error: null,
      });
    } catch (error) {
      set({ error: error.response?.data?.error || "No se pudo agregar el producto" });
    }
  },

  removeItem: async (variantId) => {
    try {
      if (useAuthStore.getState().token) await removeItemFromServer(variantId);
      set({ items: get().items.filter((item) => item.variantId !== variantId && item.productId !== variantId), error: null });
    } catch (error) {
      set({ error: error.response?.data?.error || "No se pudo quitar el producto" });
    }
  },

  updateQuantity: async (variantId, quantity) => {
    if (quantity <= 0) {
      await get().removeItem(variantId);
      return;
    }
    try {
      const updated = useAuthStore.getState().token
        ? normalizeCartItem(await updateItemOnServer(variantId, quantity))
        : get().items.find((item) => item.variantId === variantId);
      if (updated) set({ items: get().items.map((item) => item.variantId === variantId ? { ...item, quantity: updated.quantity } : item), error: null });
    } catch (error) {
      set({ error: error.response?.data?.error || "No se pudo actualizar la cantidad" });
    }
  },

  clearCart: () => set({ items: [], error: null }),

  // Selector derivado: total del carrito
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
