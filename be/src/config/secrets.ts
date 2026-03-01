import { secret } from "encore.dev/config";

export const CLERK_SECRET_KEY = secret("CLERK_SECRET_KEY");
export const CLERK_PUBLISHABLE_KEY = secret("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
export const PII_ENCRYPTION_KEY = secret("PIIEncryptionKey");
export const OPENAI_API_KEY = secret("OpenAIAPIKey");
