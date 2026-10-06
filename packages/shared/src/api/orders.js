import { apiClient } from "./client";

export async function createOrder(address, paymentMethod = "CASH_ON_DELIVERY") {
  const { data } = await apiClient.post("/orders", { address, paymentMethod });
  return data;
}
