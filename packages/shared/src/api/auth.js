import { apiClient } from "./client";

export async function loginRequest(email, password) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data; // { token, user }
}

export async function registerRequest(payload) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data; // { token, user }
}

export async function getCurrentUserRequest() {
  const { data } = await apiClient.get("/auth/me");
  return data.user;
}
