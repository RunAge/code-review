import { describe, expect, it, vi } from "vitest";

import { exchangeCodeForToken } from "../../src/utils/github/tokenExchange";

describe("exchangeCodeForToken", () => {
  it("calls GitHub token endpoint and returns access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "gho_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const token = await exchangeCodeForToken(
      {
        clientId: "client_1",
        code: "code_1",
        codeVerifier: "verifier_1",
        redirectUri: "http://localhost:3000/auth/callback",
      },
      fetchMock as unknown as typeof fetch
    );

    expect(token).toBe("gho_123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://github.com/login/oauth/access_token");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Accept")).toBe("application/json");
    expect(new Headers(init.headers).get("Content-Type")).toBeNull();
    const body = init.body as URLSearchParams;
    expect(body.get("client_id")).toBe("client_1");
    expect(body.get("code")).toBe("code_1");
    expect(body.get("code_verifier")).toBe("verifier_1");
    expect(body.get("redirect_uri")).toBe(
      "http://localhost:3000/auth/callback"
    );
  });

  it("calls configured backend token exchange endpoint when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "gho_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await exchangeCodeForToken(
      {
        clientId: "client_1",
        code: "code_1",
        codeVerifier: "verifier_1",
        redirectUri: "http://localhost:3000/auth/callback",
        tokenExchangeUrl: "https://oauth.example.com/exchange",
      },
      fetchMock as unknown as typeof fetch
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://oauth.example.com/exchange");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Accept")).toBe("application/json");
    expect(new Headers(init.headers).get("Content-Type")).toBe(
      "application/json"
    );
    expect(init.body).toBeTypeOf("string");
    expect(JSON.parse(String(init.body))).toEqual({
      client_id: "client_1",
      code: "code_1",
      code_verifier: "verifier_1",
      redirect_uri: "http://localhost:3000/auth/callback",
    });
  });

  it("throws when API responds without access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "bad_verification_code" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      exchangeCodeForToken(
        {
          clientId: "client_1",
          code: "code_1",
          codeVerifier: "verifier_1",
          redirectUri: "http://localhost:3000/auth/callback",
        },
        fetchMock as unknown as typeof fetch
      )
    ).rejects.toThrow("GitHub token exchange failed");
  });
});
