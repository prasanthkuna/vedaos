const requireEnv = (key: string, value: string | undefined): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value.trim();
};

export const env = {
  apiBaseUrl: requireEnv("EXPO_PUBLIC_API_BASE_URL", process.env.EXPO_PUBLIC_API_BASE_URL),
  clerkPublishableKey: requireEnv("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY", process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY),
};
