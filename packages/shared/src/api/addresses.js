import { apiClient } from "./client";

export async function getAddresses() {
  const { data } = await apiClient.get("/addresses");
  return data;
}

export async function createAddress(address) {
  const { data } = await apiClient.post("/addresses", address);
  return data;
}

export async function updateAddress(addressId, address) {
  const { data } = await apiClient.patch(`/addresses/${addressId}`, address);
  return data;
}

export async function deleteAddress(addressId) {
  await apiClient.delete(`/addresses/${addressId}`);
}
