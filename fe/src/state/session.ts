import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  token: string;
  profileId: string;
  runId: string;
  setToken: (token: string) => void;
  setProfileId: (profileId: string) => void;
  setRunId: (runId: string) => void;
  resetJourney: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: "",
      profileId: "",
      runId: "",
      setToken: (token) => set({ token }),
      setProfileId: (profileId) => set({ profileId }),
      setRunId: (runId) => set({ runId }),
      resetJourney: () => set({ profileId: "", runId: "" }),
    }),
    {
      name: "veda-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        profileId: state.profileId,
        runId: state.runId,
      }),
    },
  ),
);
