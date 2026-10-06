// Punto de entrada unico: tanto mobile como desktop importan desde aqui.
// Ej: import { useCartStore, formatCurrency, getProducts } from "@shein-clone/shared";

export * from "./api/client";
export * from "./api/products";
export * from "./api/auth";
export * from "./api/cart";
export * from "./api/orders";
export * from "./api/admin";
export * from "./api/seller";
export * from "./store/useAuthStore";
export * from "./store/useProductStore";
export * from "./store/useCartStore";
export * from "./utils/formatCurrency";
export * from "./utils/validators";
