import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useSessionStore } from "../state/session";

export const useRequiredSession = (requireProfile: boolean = false) => {
  const router = useRouter();
  const token = useSessionStore((s) => s.token);
  const profileId = useSessionStore((s) => s.profileId);

  useEffect(() => {
    if (!token) {
      router.replace("/welcome");
      return;
    }
    if (requireProfile && !profileId) {
      router.replace("/birth-details");
    }
  }, [profileId, requireProfile, router, token]);

  return { token, profileId, ready: Boolean(token && (!requireProfile || profileId)) };
};
