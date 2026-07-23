const VERIFIER_LENGTH = 128;
const ALLOWED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

function toBase64Url(input: ArrayBuffer): string {
  const bytes = new Uint8Array(input);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getCryptoObject(): Crypto {
  if (typeof globalThis.crypto === "undefined") {
    throw new Error("Web Crypto API is not available");
  }

  return globalThis.crypto;
}

export async function generateCodeVerifier(length = VERIFIER_LENGTH): Promise<string> {
  const cryptoObject = getCryptoObject();
  const bytes = new Uint8Array(length);
  cryptoObject.getRandomValues(bytes);

  let verifier = "";
  for (const byte of bytes) {
    verifier += ALLOWED_CHARS[byte % ALLOWED_CHARS.length];
  }

  return verifier;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const cryptoObject = getCryptoObject();
  const encoded = new TextEncoder().encode(verifier);
  const digest = await cryptoObject.subtle.digest("SHA-256", encoded);

  return toBase64Url(digest);
}
