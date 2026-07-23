const STATE_LENGTH = 32;
const ALLOWED_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export interface BuildGitHubAuthorizeUrlInput {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  scope?: string;
}

function getCryptoObject(): Crypto {
  if (typeof globalThis.crypto === "undefined") {
    throw new Error("Web Crypto API is not available");
  }

  return globalThis.crypto;
}

export function createOAuthState(length = STATE_LENGTH): string {
  const bytes = new Uint8Array(length);
  getCryptoObject().getRandomValues(bytes);

  let state = "";
  for (const byte of bytes) {
    state += ALLOWED_CHARS[byte % ALLOWED_CHARS.length];
  }

  return state;
}

export function buildGitHubAuthorizeUrl(
  input: BuildGitHubAuthorizeUrlInput
): URL {
  const url = new URL("https://github.com/login/oauth/authorize");

  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", input.state);
  url.searchParams.set("response_type", "code");

  if (input.scope) {
    url.searchParams.set("scope", input.scope);
  }

  return url;
}

export function parseOAuthCallbackParams(callbackUrl: string): {
  code: string | null;
  state: string | null;
  error: string | null;
} {
  const url = new URL(callbackUrl);

  return {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
  };
}

export function validateOAuthState(
  expectedState: string,
  actualState: string | null
): boolean {
  return actualState === expectedState;
}
