import { beforeEach, describe, expect, it } from "vitest";

import { clearToken, getToken, setToken } from "../../src/utils/storage/tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => {
    clearToken();
  });

  it("stores and reads token", () => {
    setToken("gho_test");

    expect(getToken()).toBe("gho_test");
  });

  it("clears token", () => {
    setToken("gho_test");
    clearToken();

    expect(getToken()).toBeNull();
  });
});
