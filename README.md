# Tanuki AI Inventarisatie

Formulier voor Team Tanuki om AI-tool-gebruik te inventariseren. Gehost als
Cloudflare Worker; schrijft server-side (geen client-side Firebase auth) naar
een Firebase Realtime Database via een legacy Database Secret.

## Architectuur

- `public/index.html` — statische form, post't naar `/api/submit` op dezelfde origin.
- `src/index.ts` — Worker: serveert de static asset, en handelt `/api/submit`
  af door server-side naar Firebase te schrijven met `FIREBASE_DB_SECRET`
  (nooit zichtbaar in de browser).

## Secrets (Worker, niet in code)

- `FIREBASE_DB_URL` — bv. `https://<project>-default-rtdb.europe-west1.firebasedatabase.app`
- `FIREBASE_DB_SECRET` — legacy Database Secret uit Firebase Console →
  Project settings → Service accounts → Database secrets

> Let op: regio's buiten `us-central1` zitten achter `firebasedatabase.app`,
> niet (meer) achter `firebaseio.com` — het oude domein geeft een
> certificaatmismatch (SSL error) als de regio niet us-central1 is.

## Deploy

```bash
npx wrangler@latest deploy          # met account/CLOUDFLARE_API_TOKEN
# of, zonder account:
npx wrangler@latest deploy --temporary
npx wrangler@latest secret put FIREBASE_DB_URL [--temporary]
npx wrangler@latest secret put FIREBASE_DB_SECRET [--temporary]
```
