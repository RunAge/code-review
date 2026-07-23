import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearOAuthSession,
  completeOAuthLogin,
  startOAuthLogin
} from "../../src/composables/oauthSession";

describe("oauthSession", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores verifier and state when starting login", async () => {
    const loginRequest = {
      authorizeUrl: new URL("https://github.com/login/oauth/authorize?x=1"),
      verifier: "verifier_1",
      state: "state_1"
    };

    const createOAuthLoginRequest = vi.fn().mockResolvedValue(loginRequest);

    const url = await startOAuthLogin(
      {
        clientId: "client",
        redirectUri: "http://localhost:3000/auth/callback",
        scope: "repo"
      },
      createOAuthLoginRequest
    );

    expect(url).toBe("https://github.com/login/oauth/authorize?x=1");
    expect(sessionStorage.getItem("oauth_verifier")).toBe("verifier_1");
    expect(sessionStorage.getItem("oauth_state")).toBe("state_1");
  });

  it("completes callback and clears session", async () => {
    sessionStorage.setItem("oauth_verifier", "verifier_1");
    sessionStorage.setItem("oauth_state", "state_1");

    const finishOAuthCallback = vi.fn().mockResolvedValue("gho_1");

    const token = await completeOAuthLogin(
      {
        callbackUrl: "http://localhost:3000/auth/callback?code=c1&state=state_1",
        clientId: "client_1"
      },
      finishOAuthCallback
    );

    expect(token).toBe("gho_1");
    expect(sessionStorage.getItem("oauth_verifier")).toBeNull();
    expect(sessionStorage.getItem("oauth_state")).toBeNull();
  });

  it("throws when session is missing", async () => {
    const finishOAuthCallback = vi.fn();

    await expect(
      completeOAuthLogin(
        {
          callbackUrl: "http://localhost:3000/auth/callback?code=c1&state=state_1",
          clientId: "client_1"
        },
        finishOAuthCallback
      )
    ).rejects.toThrow("Missing OAuth session state");
  });

  it("clears oauth session manually", () => {
    sessionStorage.setItem("oauth_verifier", "v");
    sessionStorage.setItem("oauth_state", "s");

    clearOAuthSession();

    expect(sessionStorage.getItem("oauth_verifier")).toBeNull();
    expect(sessionStorage.getItem("oauth_state")).toBeNull();
  });
});
