import { ClerkLoaded, ClerkLoading, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Text } from "react-native";
import { env } from "../config/env";
import { useSessionStore } from "../state/session";
import { setTokenProvider } from "./token-provider";

export const AppClerkProvider = ({ children }: { children: ReactNode }) => (
  <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
    {children}
  </ClerkProvider>
);

export const ClerkGate = ({ children }: { children: ReactNode }) => (
  <>
    <ClerkLoading>
      <Text style={{ color: "#C6D2CF", textAlign: "center", marginTop: 24 }}>Loading sign-in...</Text>
    </ClerkLoading>
    <ClerkLoaded>{children}</ClerkLoaded>
  </>
);

export const SessionTokenSync = () => {
  const { isSignedIn, getToken } = useAuth();
  const setToken = useSessionStore((s) => s.setToken);
  const resetJourney = useSessionStore((s) => s.resetJourney);

  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) {
        setToken("");
        setTokenProvider(null);
        resetJourney();
        return;
      }
      const token = await getToken();
      setToken(token ?? "");
      setTokenProvider(() => getToken());
    };
    void sync();
    const interval = setInterval(() => {
      void sync();
    }, 45_000);
    return () => clearInterval(interval);
  }, [getToken, isSignedIn, resetJourney, setToken]);

  return null;
};
