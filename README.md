# MyCash

Personal income and expense tracker. It's an installable PWA (React + Firebase Realtime Database),
plus a Telegram bot on Google Apps Script that writes to the same database.

- Monthly view of income and expenses, categories with subcategories, wallets with balances and transfers
- Charts (daily, weekly, monthly, yearly), search across all months, savings goals linked to a wallet
- Monthly recurring transactions (created by the bot's daily job), and a monthly report in Telegram
- Indonesian / English, light / dark, IDR only, WIB timezone, single user

Design and decisions: [docs/superpowers/specs/2026-10-02-mycash-design.md](docs/superpowers/specs/2026-10-02-mycash-design.md).
Bot setup: [apps-script/README.md](apps-script/README.md).

## Make your own MyCash

Each person runs their own copy: their own Firebase project (free Spark plan is enough), their own
Telegram bot, their own data. Nothing is shared between copies. Below, `<project-id>` is your Firebase
project ID, e.g. `mycash-1a2b3`.

You need Node.js 20+ and the Firebase CLI (`npm i -g firebase-tools`, then `firebase login`).

### 1. Firebase project (console.firebase.google.com)

1. **Add project** → any name. Google Analytics is optional.
2. **Project settings → General → Your apps → Web (`</>`)** → register an app (no Firebase Hosting setup
   needed here). Keep the `firebaseConfig` values it shows.
3. **Build → Realtime Database → Create database** → location **Singapore (asia-southeast1)** →
   **locked mode**. Copy the database URL shown above the data.
4. **Build → Authentication → Get started → Sign-in method → Google → Enable** → pick a support email →
   Save. Skipping *Get started* makes sign-in fail with `auth/configuration-not-found`.
5. **Build → Hosting → Get started** (just click through; the CLI does the rest).

### 2. Configure and deploy

```bash
npm install
cp .env.example .env.local      # paste the firebaseConfig values + database URL
firebase use --add              # pick <project-id>, alias "default"
npm run deploy                  # build + hosting + database rules
```

The first deploy has no `OWNER_UID` yet, so the database denies everyone. That's expected.

### 3. Sign in and authorize yourself

1. Open **`https://<project-id>.firebaseapp.com`**. Use this address, not `<project-id>.web.app`: sign-in
   runs on the page's own domain, and Google only allows the `firebaseapp.com` return address by default
   (`web.app` fails with `redirect_uri_mismatch`).
2. Sign in with Google. The app shows *This account is not allowed yet* and your UID.
3. Put the UID in `.env.local` as `OWNER_UID=…`, then `npm run deploy` again. Only that account can now read
   or write the database.
4. Reload. Pick your wallets, enter current balances, choose the main wallet.
5. On your phone, open the same `firebaseapp.com` address → *Add to Home screen* / *Install app*.

Optional, to also use `web.app`: Google Cloud console → APIs & Services → Credentials → "Web client (auto
created by Google Service)" → add `https://<project-id>.web.app/__/auth/handler` to *Authorized redirect
URIs*.

### 4. Telegram bot

Follow [apps-script/README.md](apps-script/README.md). Use the **same Google account** that owns the
Firebase project, and paste your database URL into `DB_URL` in `Config.gs`.

## Development

```bash
npm install
npm test                  # unit tests (app logic + Apps Script parser/ledger)
npm run dev               # against the real database
npm run build             # type-check + production build into dist/
```

Against local emulators (needs Java):

```bash
npm run emulators                         # auth :9099, database :9000, UI :4000
VITE_USE_EMULATORS=true npm run dev
```

The emulator signs you in with a fake Google account, so the app shows the not-authorized screen with that
account's UID. To develop against it, temporarily put that UID in `OWNER_UID` and rerun `npm run emulators`.

`database.rules.json` is generated from `database.rules.template.json` by `npm run rules` (part of
`deploy` and `emulators`). Edit the template, not the generated file.

## How balances work

Wallet balances are stored, not recalculated on every read. Every transaction write goes through
`buildTxUpdate` (`src/lib/ledger.ts`, mirrored in `apps-script/Ledger.gs`), which writes the transaction and
increments the affected wallets in one atomic multi-path update. *Settings → Recalculate balances* rebuilds
them from each wallet's starting balance plus every transaction, in case they ever drift.

## Project layout

```
src/lib/        pure logic (money, dates, ledger, stats, goals) + Firebase access (db.ts)
src/hooks/      realtime data hooks, shared data context
src/pages/      Home, History, Stats, More and its sub-pages
src/components/ UI building blocks; components/ui = shadcn/ui
apps-script/    Telegram bot (copy-paste into script.google.com)
tests/          Vitest; *.gs files are loaded with node:vm
```
