import { apiClient } from "./client";

export async function createOrder(addressId, paymentMethod = "CASH_ON_DELIVERY") {
  const { data } = await apiClient.post("/orders", { addressId, paymentMethod });
  return data;
}

export async function getCustomerOrders() {
  const { data } = await apiClient.get("/orders");
  return data;
}
