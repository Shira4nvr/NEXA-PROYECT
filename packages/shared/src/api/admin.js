import { apiClient } from "./client";

export async function getAdminAnalytics() {
  const { data } = await apiClient.get("/admin/analytics");
  return data;
}

export async function getAdminUsers(search = "") {
  const { data } = await apiClient.get("/admin/users", { params: { search } });
  return data;
}

export async function setAdminUserStatus(userId, isActive) {
  const { data } = await apiClient.patch(`/admin/users/${userId}/status`, { isActive });
  return data;
}

export async function setAdminSellerStatus(sellerId, status) {
  const { data } = await apiClient.patch(`/admin/sellers/${sellerId}/status`, { status });
  return data;
}