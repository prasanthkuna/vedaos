import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { env } from "../src/config/env";
import { i18n } from "../src/i18n";

void i18n;

const queryClient = new QueryClient();

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
};

export default function RootLayout() {
  const content = <Stack screenOptions={{ headerShown: false }} />;

  return (
    <QueryClientProvider client={queryClient}>
      {env.clerkPublishableKey ? (
        <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
          {content}
        </ClerkProvider>
      ) : (
        content
      )}
    </QueryClientProvider>
  );
}
