import { useAuthStore } from "../stores/authStore";
import { finishOAuthCallback } from "../utils/github/authFlow";
import { exchangeCodeForToken } from "../utils/github/tokenExchange";
import {
  clearOAuthSession,
  getOAuthSessionKeys,
  startOAuthLogin,
} from "./oauthSession";

function getPublicConfig() {
  if (typeof useRuntimeConfig === "function") {
    const config = useRuntimeConfig();
    return config.public;
  }

  return {
    githubClientId: "",
    githubRedirectUri: "",
    githubTokenExchangeUrl: "",
  };
}

export function useAuthUi() {
  const store = useAuthStore();

  async function beginOAuthLogin() {
    const config = getPublicConfig();

    const url = await startOAuthLogin({
      clientId: config.githubClientId,
      redirectUri: config.githubRedirectUri,
      scope: "repo pull_request:write",
    });

    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }

  async function finishOAuthFromCurrentLocation() {
    if (typeof window === "undefined") {
      return;
    }

    const config = getPublicConfig();
    const { verifierKey, stateKey } = getOAuthSessionKeys();
    const verifier = sessionStorage.getItem(verifierKey);
    const expectedState = sessionStorage.getItem(stateKey);

    if (!verifier || !expectedState) {
      throw new Error("Missing OAuth session state");
    }

    const token = await finishOAuthCallback({
      callbackUrl: window.location.href,
      expectedState,
      clientId: config.githubClientId,
      codeVerifier: verifier,
      exchangeCodeForToken: ({ clientId, code, codeVerifier }) =>
        exchangeCodeForToken({
          clientId,
          code,
          codeVerifier,
          redirectUri: config.githubRedirectUri,
          tokenExchangeUrl: config.githubTokenExchangeUrl,
        }),
    });

    store.setPatToken(token);
    clearOAuthSession();
  }

  function setPatToken(token: string) {
    store.setPatToken(token);
  }

  return {
    beginOAuthLogin,
    finishOAuthFromCurrentLocation,
    setPatToken,
  };
}
