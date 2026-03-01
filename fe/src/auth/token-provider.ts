type TokenProvider = () => Promise<string | null>;

let provider: TokenProvider | null = null;

export const setTokenProvider = (next: TokenProvider | null) => {
  provider = next;
};

export const getFreshToken = async (): Promise<string | null> => {
  if (!provider) return null;
  try {
    return await provider();
  } catch {
    return null;
  }
};
