import {
  createOAuthLoginRequest,
  finishOAuthCallback,
  type CreateOAuthLoginRequestInput,
  type ExchangeCodeForToken,
  type OAuthLoginRequest
} from "../utils/github/authFlow";

const OAUTH_VERIFIER_KEY = "oauth_verifier";
const OAUTH_STATE_KEY = "oauth_state";

export async function startOAuthLogin(
  input: CreateOAuthLoginRequestInput,
  createLoginRequest: (input: CreateOAuthLoginRequestInput) => Promise<OAuthLoginRequest> =
    createOAuthLoginRequest
): Promise<string> {
  const request = await createLoginRequest(input);

  sessionStorage.setItem(OAUTH_VERIFIER_KEY, request.verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, request.state);

  return request.authorizeUrl.toString();
}

export async function completeOAuthLogin(
  input: {
    callbackUrl: string;
    clientId: string;
  },
  finishCallback: (input: {
    callbackUrl: string;
    expectedState: string;
    clientId: string;
    codeVerifier: string;
    exchangeCodeForToken: ExchangeCodeForToken;
  }) => Promise<string>
): Promise<string> {
  const verifier = sessionStorage.getItem(OAUTH_VERIFIER_KEY);
  const state = sessionStorage.getItem(OAUTH_STATE_KEY);

  if (!verifier || !state) {
    throw new Error("Missing OAuth session state");
  }

  const token = await finishCallback({
    callbackUrl: input.callbackUrl,
    expectedState: state,
    clientId: input.clientId,
    codeVerifier: verifier,
    exchangeCodeForToken: async () => {
      throw new Error("exchangeCodeForToken must be wired by caller");
    }
  });

  clearOAuthSession();

  return token;
}

export function clearOAuthSession(): void {
  sessionStorage.removeItem(OAUTH_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
}

export function getOAuthSessionKeys() {
  return {
    verifierKey: OAUTH_VERIFIER_KEY,
    stateKey: OAUTH_STATE_KEY
  };
}
