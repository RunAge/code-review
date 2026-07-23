import { generateCodeChallenge, generateCodeVerifier } from "../crypto/pkce";
import {
  buildGitHubAuthorizeUrl,
  createOAuthState,
  parseOAuthCallbackParams,
  validateOAuthState,
} from "./oauth";

export interface CreateOAuthLoginRequestInput {
  clientId: string;
  redirectUri: string;
  scope?: string;
}

export interface OAuthLoginRequest {
  authorizeUrl: URL;
  verifier: string;
  state: string;
}

export interface ExchangeCodeInput {
  clientId: string;
  code: string;
  codeVerifier: string;
}

export type ExchangeCodeForToken = (
  input: ExchangeCodeInput
) => Promise<string>;

export interface FinishOAuthCallbackInput {
  callbackUrl: string;
  expectedState: string;
  clientId: string;
  codeVerifier: string;
  exchangeCodeForToken: ExchangeCodeForToken;
}

export async function createOAuthLoginRequest(
  input: CreateOAuthLoginRequestInput
): Promise<OAuthLoginRequest> {
  const verifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(verifier);
  const state = createOAuthState();

  const authorizeUrl = buildGitHubAuthorizeUrl({
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    codeChallenge,
    state,
    scope: input.scope,
  });

  return {
    authorizeUrl,
    verifier,
    state,
  };
}

export async function finishOAuthCallback(
  input: FinishOAuthCallbackInput
): Promise<string> {
  const parsed = parseOAuthCallbackParams(input.callbackUrl);

  if (parsed.error) {
    throw new Error(`OAuth authorization failed: ${parsed.error}`);
  }

  if (!validateOAuthState(input.expectedState, parsed.state)) {
    throw new Error("Invalid OAuth state");
  }

  if (!parsed.code) {
    throw new Error("Missing OAuth code");
  }

  return input.exchangeCodeForToken({
    clientId: input.clientId,
    code: parsed.code,
    codeVerifier: input.codeVerifier,
  });
}
