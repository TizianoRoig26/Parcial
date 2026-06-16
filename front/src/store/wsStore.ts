import { create } from "zustand";

export type WsStatus = "connected" | "disconnected" | "connecting";

interface WsState {
  status: WsStatus;
  retryCount: number;
  error: string | null;

  // Acciones
  setStatus: (status: WsStatus) => void;
  setError: (error: string | null) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
  clearState: () => void;
}

export const useWsStore = create<WsState>()((set) => ({
  status: "disconnected",
  retryCount: 0,
  error: null,

  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  incrementRetry: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  resetRetry: () => set({ retryCount: 0 }),
  clearState: () => set({ status: "disconnected", retryCount: 0, error: null }),
}));
