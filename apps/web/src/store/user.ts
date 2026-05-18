import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Plan } from "@/types";

interface UserState {
  user: User | null;
  plan: Plan;
  credits: number;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateCredits: (credits: number) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      plan: "free",
      credits: 0,
      isLoading: false,

      setUser: (user) =>
        set({
          user,
          plan: user?.plan || "free",
          credits: user?.credits || 0,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateCredits: (credits) =>
        set((state) => ({
          credits,
          user: state.user ? { ...state.user, credits } : null,
        })),

      clearUser: () => set({ user: null, plan: "free", credits: 0 }),
    }),
    {
      name: "user-store",
      partialize: (state) => ({ plan: state.plan }),
    }
  )
);
