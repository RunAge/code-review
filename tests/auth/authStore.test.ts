import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useAuthStore } from "../../src/stores/authStore";
import { clearToken, getToken } from "../../src/utils/storage/tokenStorage";

describe("authStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    clearToken();
  });

  it("stores PAT token and marks user as authenticated", () => {
    const store = useAuthStore();

    store.setPatToken("ghp_123");

    expect(store.token).toBe("ghp_123");
    expect(store.isAuthenticated).toBe(true);
    expect(getToken()).toBe("ghp_123");
  });

  it("hydrates state from persisted token", () => {
    const store = useAuthStore();

    store.setPatToken("ghp_abc");
    store.token = null;

    store.hydrateFromStorage();

    expect(store.token).toBe("ghp_abc");
    expect(store.isAuthenticated).toBe(true);
  });

  it("clears auth state and persistence on logout", () => {
    const store = useAuthStore();

    store.setPatToken("ghp_abc");
    store.logout();

    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(getToken()).toBeNull();
  });
});
