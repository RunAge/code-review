# OAuth token exchange endpoint contract

This app supports two auth paths:

- PAT login (works on static hosting)
- OAuth PKCE login via backend token exchange endpoint

To enable backend OAuth exchange in frontend, set:

- `NUXT_PUBLIC_GITHUB_TOKEN_EXCHANGE_URL=https://your-backend.example.com/oauth/github/exchange`

## Request from frontend

Method: `POST`

Headers:

- `Content-Type: application/json`
- `Accept: application/json`

Body:

```json
{
  "client_id": "<github oauth app client id>",
  "code": "<oauth code>",
  "code_verifier": "<pkce code verifier>",
  "redirect_uri": "<callback uri used in authorize step>"
}
```

## Backend behavior

1. Validate payload.
2. Call GitHub endpoint:
   - `POST https://github.com/login/oauth/access_token`
3. Send parameters as form data:
   - `client_id`
   - `client_secret` (read from backend secret storage)
   - `code`
   - `code_verifier`
   - `redirect_uri`
4. Forward JSON response to frontend.

Example success response:

```json
{
  "access_token": "gho_xxx",
  "token_type": "bearer",
  "scope": "repo,pull_request:write"
}
```

Example error response:

```json
{
  "error": "incorrect_client_credentials",
  "error_description": "The client_id and/or client_secret passed are incorrect."
}
```

## CORS requirements on backend endpoint

Allow your frontend origin, for example:

- `https://runage-live.kamide.re`

Allow methods:

- `POST`
- `OPTIONS`

Allow headers:

- `Content-Type`
- `Accept`

Never expose `client_secret` to the browser.
