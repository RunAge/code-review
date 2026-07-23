import { describe, expect, it } from "vitest";

import { generateCodeChallenge, generateCodeVerifier } from "../../src/utils/crypto/pkce";

describe("PKCE", () => {
  it("generates a verifier with the expected length and charset", async () => {
    const verifier = await generateCodeVerifier();

    expect(verifier).toHaveLength(128);
    expect(verifier).toMatch(/^[A-Za-z0-9._~-]+$/);
  });

  it("generates a deterministic SHA-256 code challenge", async () => {
    const verifier = "test-verifier-123";
    const challenge = await generateCodeChallenge(verifier);

    expect(challenge).toBe("B2Y4U9QxczYll4lD6sc8T1fQ4e7v4keMRCpN8QxRfN8");
  });
});
