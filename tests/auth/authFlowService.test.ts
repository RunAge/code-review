import { describe, expect, it, vi } from "vitest";

import {
  createOAuthLoginRequest,
  finishOAuthCallback,
  type ExchangeCodeForToken,
} from "../../src/utils/github/authFlow";

describe("authFlow service", () => {
  it("creates OAuth login request with verifier, challenge and state", async () => {
    const request = await createOAuthLoginRequest({
      clientId: "client_123",
      redirectUri: "http://localhost:3000/auth/callback",
      scope: "repo",
    });

    expect(request.verifier).toHaveLength(128);
    expect(request.state.length).toBeGreaterThanOrEqual(32);
    expect(request.authorizeUrl.searchParams.get("client_id")).toBe(
      "client_123"
    );
    expect(request.authorizeUrl.searchParams.get("code_challenge_method")).toBe(
      "S256"
    );
    expect(request.authorizeUrl.searchParams.get("state")).toBe(request.state);
  });

  it("finishes OAuth callback and returns access token", async () => {
    const exchangeCodeForToken: ExchangeCodeForToken = vi
      .fn()
      .mockResolvedValue("gho_token");

    const token = await finishOAuthCallback({
      callbackUrl:
        "http://localhost:3000/auth/callback?code=code123&state=state123",
      expectedState: "state123",
      clientId: "client_123",
      codeVerifier: "verifier_abc",
      exchangeCodeForToken,
    });

    expect(token).toBe("gho_token");
    expect(exchangeCodeForToken).toHaveBeenCalledWith({
      clientId: "client_123",
      code: "code123",
      codeVerifier: "verifier_abc",
    });
  });

  it("throws when callback contains OAuth error", async () => {
    const exchangeCodeForToken: ExchangeCodeForToken = vi.fn();

    await expect(
      finishOAuthCallback({
        callbackUrl: "http://localhost:3000/auth/callback?error=access_denied",
        expectedState: "state123",
        clientId: "client_123",
        codeVerifier: "verifier_abc",
        exchangeCodeForToken,
      })
    ).rejects.toThrow("OAuth authorization failed: access_denied");
  });

  it("throws when state does not match", async () => {
    const exchangeCodeForToken: ExchangeCodeForToken = vi.fn();

    await expect(
      finishOAuthCallback({
        callbackUrl:
          "http://localhost:3000/auth/callback?code=code123&state=other",
        expectedState: "state123",
        clientId: "client_123",
        codeVerifier: "verifier_abc",
        exchangeCodeForToken,
      })
    ).rejects.toThrow("Invalid OAuth state");
  });
});
