import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { mmkv } from "~/lib/mmkv";
import logger from "~/lib/log";

const log = logger("privacyStore");

const zustandStorage: StateStorage = {
  setItem: (name: string, value: string) => {
    try {
      return mmkv.set(name, value);
    } catch (error) {
      log.w("Privacy storage setItem failed:", [error]);
      return;
    }
  },
  getItem: (name: string) => {
    try {
      const value = mmkv.getString(name);
      return value ?? null;
    } catch (error) {
      log.w("Privacy storage getItem failed:", [error]);
      return null;
    }
  },
  removeItem: (name: string) => {
    try {
      return mmkv.remove(name);
    } catch (error) {
      log.w("Privacy storage removeItem failed:", [error]);
      return;
    }
  },
};

interface PrivacyState {
  isHomeBalanceHidden: boolean;
  setHomeBalanceHidden: (hidden: boolean) => void;
  toggleHomeBalanceHidden: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      isHomeBalanceHidden: false,
      setHomeBalanceHidden: (hidden) => set({ isHomeBalanceHidden: hidden }),
      toggleHomeBalanceHidden: () =>
        set((state) => ({ isHomeBalanceHidden: !state.isHomeBalanceHidden })),
    }),
    {
      name: "privacy-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
