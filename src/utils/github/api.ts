type TokenResolver = () => string | null;

export function createGitHubFetch(tokenResolver: TokenResolver, fetchImpl: typeof fetch = fetch) {
  return async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = tokenResolver();
    const headers = new Headers(init.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetchImpl(input, {
      ...init,
      headers
    });
  };
}
