import { create } from "zustand";
import { loginRequest, registerRequest } from "../api/auth";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await loginRequest(email, password);
      set({ token, user, isLoading: false });
      return { token, user };
    } catch (err) {
      set({ error: err.response?.data?.error || "No se pudo iniciar sesión", isLoading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await registerRequest(payload);
      set({ token, user, isLoading: false });
      return { token, user };
    } catch (err) {
      set({ error: err.response?.data?.error || "No se pudo crear la cuenta", isLoading: false });
      throw err;
    }
  },

  logout: () => set({ user: null, token: null }),
}));
