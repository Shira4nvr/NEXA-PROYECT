import { apiClient } from "./client";

export async function getProducts({ category, search } = {}) {
  const { data } = await apiClient.get("/products", { params: { category, search } });
  return data;
}

export async function getCategories() {
  const { data } = await apiClient.get("/products/categories");
  return data;
}

export async function getProductById(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
}
