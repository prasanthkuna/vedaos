import { APIError } from "encore.dev/api";
import { verifyToken } from "@clerk/backend";
import { CLERK_SECRET_KEY } from "../config/secrets";

const clerkIssuer = process.env.CLERK_ISSUER?.trim();
const clerkAudience = process.env.CLERK_AUDIENCE?.trim();

export const requireUserId = async (authorization?: string): Promise<string> => {
  if (!authorization) {
    throw APIError.unauthenticated("missing_authorization_header");
  }

  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : authorization.trim();

  if (!token) {
    throw APIError.unauthenticated("missing_bearer_token");
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY(),
      ...(clerkIssuer ? { issuer: clerkIssuer } : {}),
      ...(clerkAudience ? { audience: clerkAudience } : {}),
    });

    if (!payload.sub) {
      throw APIError.unauthenticated("invalid_token_subject");
    }

    return payload.sub;
  } catch (error) {
    throw APIError.unauthenticated(
      error instanceof Error ? `invalid_token:${error.message}` : "invalid_token",
    );
  }
};
