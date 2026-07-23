import { describe, expect, it, vi } from "vitest";

import { createGitHubFetch } from "../../src/utils/github/api";

describe("createGitHubFetch", () => {
  it("adds Authorization Bearer header to outgoing requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    const githubFetch = createGitHubFetch(() => "gho_test_token", fetchMock as unknown as typeof fetch);
    await githubFetch("https://api.github.com/user");

    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get("Authorization")).toBe("Bearer gho_test_token");
  });
});
