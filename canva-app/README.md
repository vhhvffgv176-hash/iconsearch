# IconSearch Canva App

Search IconSearch inside Canva and insert SVG icons into the current design.

## Requirements

Canva's current starter-kit docs recommend Node 24 and npm 11. This app is configured to run on Node 22 or 24, matching the current starter kit engine range.

## Local Development

```bash
cd canva-app
npm install
npm start
```

The dev server serves the standalone app bundle at:

```text
http://localhost:8080/app.js
```

In Canva Developer Portal, set **App source > Development URL** to that URL and use **Preview**.

The app automatically loads additional pages as the user scrolls. A visible **Load more icons** button is also available as an accessible fallback.

## Production Upload

```bash
npm run typecheck
npm run lint
npm run build
```

Upload `dist/app.js` to **Code upload > App source > JavaScript file** and upload
`translations.json` to the version's **Translations file** input. Remove the
Development URL before submitting the version for review.

## Features

- Live paginated search against `https://iconsearch.info/api/icon-search`.
- Library and commercial-safety filters.
- SVG asset upload with `aiDisclosure: "none"`.
- Insert selected icon into the current Canva design.
- Canva App UI Kit theming for both light and dark mode.
- Extracted, translatable interface strings.

## Account Authentication

The public icon-search workflow does not require an IconSearch account. The
optional **Connect IconSearch account** button uses Canva's `@canva/user` OAuth
popup, so credentials are never collected inside the app iframe.

The IconSearch OAuth provider supports authorization code + PKCE, rotating
refresh tokens, and grant revocation. Before testing the account flow:

1. Apply `supabase/migrations/202608080001_canva_oauth.sql` to the production
   Supabase project.
2. Add `CANVA_OAUTH_CLIENT_ID`, `CANVA_OAUTH_CLIENT_SECRET`,
   `CANVA_OAUTH_REDIRECT_URI`, and `CANVA_OAUTH_TOKEN_PEPPER` to the production
   web deployment. The token pepper must contain at least 32 random characters.
3. In **Canva Developer Portal > Authentication**, use the same client ID and
   secret and configure:
   - Authorization URL: `https://iconsearch.info/oauth/canva/authorize`
   - Token URL: `https://iconsearch.info/api/oauth/canva/token`
   - Revocation URL: `https://iconsearch.info/api/oauth/canva/revoke`
4. Copy the exact redirect URI shown by Canva into
   `CANVA_OAUTH_REDIRECT_URI`, redeploy the website, then test sign in, account
   creation, cancellation, password reset, token refresh, and **Remove from your
   apps** before uploading the app bundle.

Never commit the OAuth secret, service-role key, or token pepper.
