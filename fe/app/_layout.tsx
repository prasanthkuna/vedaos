import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { i18n } from "../src/i18n";
import { AppClerkProvider, ClerkGate, SessionTokenSync } from "../src/auth/clerk";

void i18n;

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <AppClerkProvider>
      <QueryClientProvider client={queryClient}>
        <ClerkGate>
          <SessionTokenSync />
          <Stack screenOptions={{ headerShown: false }} />
        </ClerkGate>
      </QueryClientProvider>
    </AppClerkProvider>
  );
}
