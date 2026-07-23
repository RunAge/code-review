import { describe, expect, it } from "vitest";

import {
  buildGitHubAuthorizeUrl,
  createOAuthState,
  parseOAuthCallbackParams,
  validateOAuthState
} from "../../src/utils/github/oauth";

describe("OAuth flow", () => {
  it("builds GitHub authorization URL with PKCE params", () => {
    const url = buildGitHubAuthorizeUrl({
      clientId: "client_123",
      redirectUri: "http://localhost:3000/auth/callback",
      codeChallenge: "challenge_abc",
      state: "state_123",
      scope: "repo pull_request:write"
    });

    expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("client_123");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/auth/callback");
    expect(url.searchParams.get("code_challenge")).toBe("challenge_abc");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("state_123");
    expect(url.searchParams.get("scope")).toBe("repo pull_request:write");
    expect(url.searchParams.get("response_type")).toBe("code");
  });

  it("creates random state token with URL-safe characters", () => {
    const state = createOAuthState();

    expect(state.length).toBeGreaterThanOrEqual(32);
    expect(state).toMatch(/^[A-Za-z0-9._~-]+$/);
  });

  it("parses callback params and validates state", () => {
    const parsed = parseOAuthCallbackParams(
      "https://app.local/auth/callback?code=abc123&state=state_1"
    );

    expect(parsed).toEqual({ code: "abc123", state: "state_1", error: null });
    expect(validateOAuthState("state_1", parsed.state)).toBe(true);
    expect(validateOAuthState("different", parsed.state)).toBe(false);
  });

  it("reads OAuth errors from callback URL", () => {
    const parsed = parseOAuthCallbackParams(
      "https://app.local/auth/callback?error=access_denied"
    );

    expect(parsed).toEqual({ code: null, state: null, error: "access_denied" });
  });
});
