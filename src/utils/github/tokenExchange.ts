export interface ExchangeCodeForTokenInput {
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

function parseGitHubTokenPayload(rawBody: string): GitHubTokenResponse {
  try {
    return JSON.parse(rawBody) as GitHubTokenResponse;
  } catch {
    const params = new URLSearchParams(rawBody);
    return {
      access_token: params.get("access_token") ?? undefined,
      error: params.get("error") ?? undefined,
      error_description: params.get("error_description") ?? undefined
    };
  }
}

function normalizeOAuthError(details: string): string {
  if (details.includes("incorrect_client_credentials")) {
    return [
      "GitHub rejected OAuth client credentials.",
      "Verify OAuth app client_id/client_secret in GitHub settings.",
      "For static GitHub Pages deployments, token exchange should be done by a backend, or use PAT login."
    ].join(" ");
  }

  return details;
}

export async function exchangeCodeForToken(
  input: ExchangeCodeForTokenInput,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const form = new URLSearchParams({
    client_id: input.clientId,
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: input.redirectUri
  });

  try {
    const response = await fetchImpl("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json"
      },
      body: form
    });

    const rawBody = await response.text();
    const payload = parseGitHubTokenPayload(rawBody);

    if (!response.ok || !payload.access_token) {
      const details = payload.error_description ?? payload.error ?? "missing access token";
      throw new Error(`GitHub token exchange failed: ${normalizeOAuthError(details)}`);
    }

    return payload.access_token;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        [
          "GitHub token exchange failed due to browser CORS/network restrictions.",
          "If this app is hosted as static GitHub Pages, use PAT login or add a backend OAuth exchange endpoint."
        ].join(" ")
      );
    }

    throw error;
  }
}
