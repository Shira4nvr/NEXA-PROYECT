import { apiClient } from "./client";

export async function fetchCartFromServer() {
  const { data } = await apiClient.get("/cart");
  return data;
}

export async function addItemToServer(variantId, quantity = 1) {
  const { data } = await apiClient.post("/cart/items", { variantId, quantity });
  return data;
}

export async function updateItemOnServer(variantId, quantity) {
  const { data } = await apiClient.patch(`/cart/items/${variantId}`, { quantity });
  return data;
}

export async function removeItemFromServer(variantId) {
  await apiClient.delete(`/cart/items/${variantId}`);
}
