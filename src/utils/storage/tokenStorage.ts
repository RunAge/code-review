const TOKEN_KEY = "github_access_token";

type StorageLike = Pick<Storage, "setItem" | "getItem" | "removeItem">;

const memoryStorage = new Map<string, string>();

function getStorage(): StorageLike {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis.localStorage !== "undefined") {
    return globalThis.localStorage;
  }

  return {
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    }
  };
}

export function setToken(token: string): void {
  getStorage().setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return getStorage().getItem(TOKEN_KEY);
}

export function clearToken(): void {
  getStorage().removeItem(TOKEN_KEY);
}
