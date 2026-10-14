import { apiClient } from "./client";

export async function getColombianCities() {
  const { data } = await apiClient.get("/locations/cities");
  return data;
}
