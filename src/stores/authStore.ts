import { defineStore } from "pinia";

import { clearToken, getToken, setToken } from "../utils/storage/tokenStorage";

interface AuthState {
  token: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: getToken()
  }),

  getters: {
    isAuthenticated: (state) => state.token !== null
  },

  actions: {
    setPatToken(token: string) {
      this.token = token;
      setToken(token);
    },

    hydrateFromStorage() {
      this.token = getToken();
    },

    logout() {
      this.token = null;
      clearToken();
    }
  }
});
