import { apiClient } from "./client";

export async function getSellerProfile() {
  const { data } = await apiClient.get("/seller/profile");
  return data;
}

export async function getSellerProducts() {
  const { data } = await apiClient.get("/seller/products");
  return data;
}

export async function createSellerProduct(formData) {
  const { data } = await apiClient.post("/seller/products", formData);
  return data;
}

export async function updateSellerProduct(productId, formData) {
  const { data } = await apiClient.patch(`/seller/products/${productId}`, formData);
  return data;
}

export async function archiveSellerProduct(productId) {
  await apiClient.delete(`/seller/products/${productId}`);
}

export async function getSellerOrders() {
  const { data } = await apiClient.get("/seller/orders");
  return data;
}

export async function updateSellerOrderItemFulfillment(orderItemId, status, estimatedArrival) {
  const { data } = await apiClient.patch(`/seller/orders/items/${orderItemId}/fulfillment`, {
    status,
    estimatedArrival,
  });
  return data;
}