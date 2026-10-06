import { create } from "zustand";
import { getProducts, getProductById } from "../api/products";

export const useProductStore = create((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,

  fetchProducts: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const products = await getProducts(filters);
      set({ products, isLoading: false });
    } catch (error) {
      set({ products: [], error: error.response?.data?.error || "No se pudo cargar el catálogo", isLoading: false });
    }
  },

  fetchProductById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const product = await getProductById(id);
      set({ selectedProduct: product, isLoading: false });
    } catch (error) {
      set({ selectedProduct: null, error: error.response?.data?.error || "No se pudo cargar el producto", isLoading: false });
    }
  },
}));
