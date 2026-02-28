import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  profileId: string;
  runId: string;
  setProfileId: (profileId: string) => void;
  setRunId: (runId: string) => void;
  resetJourney: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      profileId: "",
      runId: "",
      setProfileId: (profileId) => set({ profileId }),
      setRunId: (runId) => set({ runId }),
      resetJourney: () => set({ profileId: "", runId: "" }),
    }),
    {
      name: "veda-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profileId: state.profileId,
        runId: state.runId,
      }),
    },
  ),
);
