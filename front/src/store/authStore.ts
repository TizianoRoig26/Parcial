import { create } from "zustand";
import type { AuthState, IUser } from "../features/auth/types";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: (credentials) => {
    
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: () => {
    const { user, isAuthenticated } = get();
    return user !== null && isAuthenticated;
  }
}));
