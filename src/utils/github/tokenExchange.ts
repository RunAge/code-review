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

export async function exchangeCodeForToken(
  input: ExchangeCodeForTokenInput,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImpl("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: input.clientId,
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: input.redirectUri
    })
  });

  const payload = (await response.json()) as GitHubTokenResponse;

  if (!response.ok || !payload.access_token) {
    const details = payload.error_description ?? payload.error ?? "missing access token";
    throw new Error(`GitHub token exchange failed: ${details}`);
  }

  return payload.access_token;
}
