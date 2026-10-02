# MyCash — Personal Money Tracker PWA + Telegram Bot

## Context

Azriel wants a personal (single-user) money tracker: log every expense and income, see each calendar month at a glance, organize by categories, and log by chatting to a Telegram bot whose webhook runs on Google Apps Script. Web app must be an installable PWA with a modern look (reference: dark-navy header, lime wallet card, pill nav, mono numbers — orange toned down).

Repo state: `/opt/lampp/htdocs/MyCash` has only `firebase init` output (Hosting, project `mycash-c0e81`, `public: "."`, default welcome `index.html` + `404.html`). No app code, no git. Everything below is new.

## Decisions (from Q&A)

| Area | Choice |
|---|---|
| Users | Just Azriel. Web locked to one Firebase UID; bot locked to one Telegram chat ID |
| DB | Firebase **Realtime Database** (region asia-southeast1) |
| Frontend | React + TypeScript + Vite + Tailwind v4 + shadcn/ui + Recharts + vite-plugin-pwa |
| Hosting | Firebase Hosting (existing project), Spark/free plan is enough |
| Login | Google sign-in (Firebase Auth) |
| Currency | IDR only, integer rupiah, `Rp 25.000` |
| Language | App: EN/ID toggle. Bot: always Indonesian (phrase matching accepts both) |
| Timezone | WIB `Asia/Jakarta` |
| Month | Calendar month |
| Categories | Seeded defaults + 2-level subcategories, editable (name, icon, color), archived not hard-deleted |
| Wallets | Cash / banks / e-wallets, per-wallet balance, transfers between wallets (not income/expense) |
| Extras v1 | Charts & trends, monthly recurring, notes + search, savings goals (goal linked to a wallet; progress = wallet balance) |
| Not in v1 | Budgets, CSV export, receipt photos, debts, daily reminder, PIN lock, multi-currency, import |
| Offline | Online-only: cached app shell opens instantly, "offline" banner, add/edit disabled |
| Bot parsing | Rule-based, no AI. `PHRASES` + `WALLET_ALIASES` variables in Apps Script; unknown phrase → category buttons → offer to learn (stored in DB, editable in app) |
| Bot save | Save immediately, reply with [Batal] [Kategori] [Dompet] buttons |
| Bot default wallet | `settings.defaultWalletId` |
| Bot dates | `kemarin`/`yesterday`, `dd/mm`, `dd/mm/yyyy`; else today |
| Bot extras | `/today /week /month /balance /goals /help`, transfers by chat, monthly report on 1st 08:00 |
| Recurring | Monthly only (day 1–31, clamped to month end). Apps Script daily trigger 06:00 creates due items + bot message with [Batal] |
| Apps Script code | `.gs` files kept in repo `apps-script/`, copy-pasted into editor (no clasp) |
| Look | Phone-first, light/dark auto + manual toggle. Accent burnt orange `#E07338`. JetBrains Mono for numbers/headings, Inter for text |
| Nav | Bottom pill bar: Home · History · Stats · More, floating + button |

## Architecture

```
 Phone/desktop PWA (React)  ──Firebase JS SDK (auth: Google)──►  Realtime Database
                                                                     ▲
 Telegram ──webhook POST ?key=SECRET──► Apps Script web app ──REST (OAuth token of owner)──┘
                                         └─ time triggers: daily 06:00 recurring, monthly 1st 08:00 report
```

- PWA talks to RTDB directly with realtime listeners — bot-added transactions appear live in the app.
- Apps Script calls RTDB REST with `ScriptApp.getOAuthToken()` (scopes `firebase.database` + `userinfo.email` in `appsscript.json`); the owner account owns the Firebase project, so requests get admin access. Fallback if that fails in verification: legacy database secret in `Config.gs`.
- Apps Script web app deployed "Execute as: Me, Access: Anyone" (Telegram is anonymous). Apps Script cannot read request headers, so webhook auth = secret `key` query param + chat-ID whitelist.
- Telegram sees Apps Script's 302 redirect as an error and may redeliver → **dedupe by `update_id`** in `CacheService` (6h) under `LockService`. Replies are sent via `UrlFetchApp` → `sendMessage`, never via the HTTP response.

## Data model (RTDB, root-level since single user)

```
/settings        { language: 'id'|'en', defaultWalletId }
/wallets/$id     { name, type: 'cash'|'bank'|'ewallet'|'savings', color, initialBalance, balance, order, archived }
/categories/$id  { type: 'expense'|'income', parentId: null|$id, key?: 'food.coffee', name?: string, icon, color, order, archived }
/transactions/$id{ type: 'expense'|'income'|'transfer', amount: int>0, categoryId|null, walletId, toWalletId?,
                   date: 'YYYY-MM-DD', month: 'YYYY-MM', note, source: 'app'|'bot'|'recurring', recurringId?, createdAt, updatedAt }
/recurring/$id   { type, amount, categoryId, walletId, dayOfMonth: 1-31, note, active, lastRunMonth: 'YYYY-MM' }
/goals/$id       { name, target, deadline?, walletId, createdAt, done }
/phrases/$phrase { type, categoryId }            // learned by bot, edited in app; override base PHRASES
```

- **Category names**: seeded categories carry permanent `key`; display = `name ?? t('cat.'+key)` so defaults translate with the toggle; renaming sets `name`. Base `PHRASES` in Apps Script reference `key`s (survive renames); learned phrases reference ids.
- **Balances are denormalized**: every create/edit/delete is ONE atomic multi-path update: `transactions/$id` + `wallets/$w/balance: increment(delta)` per affected wallet. Same pure `balanceDeltas(oldTx|null, newTx|null) → {walletId: delta}` exists in `src/lib/ledger.ts` and `apps-script/Ledger.gs` (REST uses `{".sv":{"increment":n}}`). Settings has "Recalculate balances" (= `initialBalance` + replay all tx) as safety net.
- Queries: month view `orderByChild('month').equalTo(m)`; trends `startAt/endAt` on `month`; search loads all transactions on demand and filters client-side (single user scale).
- New recurring item whose day already passed this month gets `lastRunMonth = currentMonth` (first run next month). Trigger condition `today >= effectiveDay && lastRunMonth !== thisMonth` gives catch-up if a run is missed.

**`database.rules.json`**: `.read/.write` = `auth.uid === '<OWNER_UID>'`; `.indexOn: ["month","date"]` on transactions; `.validate` on transaction shape (amount number > 0, type enum, date/month strings). App shows "Not authorized — your UID: xxx" on permission-denied so the UID can be pasted into rules on first setup.

## Default seed (first-run onboarding)

Onboarding screen: pick wallets from presets (Cash, BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, + custom) with starting balances, choose default wallet. Categories seeded automatically:

- **Expense**: Makanan (Makan, Kopi & Minuman, Belanja Dapur, Jajan) · Transportasi (Bensin, Parkir, Ojol, Transport Umum, Servis) · Tagihan (Listrik, Air, Internet, Pulsa & Data, Sewa/Kos) · Belanja (Pakaian, Elektronik, Rumah Tangga) · Kesehatan (Obat, Dokter) · Hiburan (Langganan, Nongkrong, Game) · Pendidikan · Lainnya
- **Income**: Gaji · Freelance · Bonus · Hadiah · Lainnya

## Telegram bot (Apps Script, Indonesian replies)

Parsing pipeline (`Parser.gs`, pure functions, no Apps Script globals):
1. Lowercase, extract date tokens (`kemarin|yesterday`, `dd/mm[/yyyy]`; future dd/mm → previous year).
2. Amount: `25rb`, `25ribu`, `25k`, `25.000`, `25000`, `1,5jt`, `1.5jt`, `2juta`. With suffix, `.`/`,` = decimal; without, separators stripped.
3. Transfer if keyword `transfer|tf|pindah|topup|top up` → needs two wallets (`ke|to` / `dari|from`); missing one → ask with wallet buttons.
4. Wallet = `WALLET_ALIASES` + every wallet name in DB; none → default wallet.
5. Category = longest phrase match (DB `/phrases` override base `PHRASES`); leading `+` forces income.
6. Note = original text minus amount/date/wallet tokens.

Flows:
- Full match → save → `✅ Pengeluaran Rp 25.000 · Makanan › Kopi · GoPay` + [Batal] [Kategori] [Dompet].
- No phrase match → store pending parse in `CacheService` → "Kategori untuk 'parkir 5rb'?" parent buttons (+ toggle Pemasukan) → tap parent → subcats + "(utama)" → save → "Ingat 'parkir' sebagai Transportasi › Parkir?" [Ya] [Tidak]. Learned phrase = note text minus stopwords (`beli, bayar, pake, pakai, di, ke, dari, buat, untuk`).
- No amount → short usage hint.
- Callback data (≤64 bytes): `u:<tx>`, `ec:<tx>`, `sc:<tx>:<cat>`, `ew:<tx>`, `sw:<tx>:<wallet>`, `pc:<pending>:<cat>`, `lp:<pending>`, `ln:<pending>`.
- Commands: `/today /week /month` (income, expense, net, top categories), `/balance` (per wallet + total), `/goals` (progress bars), `/help`, `/start` (unknown chat → replies its chat ID for setup, nothing else).
- Triggers: `dailyRecurring` 06:00 WIB; `monthlyReport` on day 1 at 08:00 (last month totals, top 5 expense categories with %, vs previous month, wallet balances).

## Web app screens

- **Login**: big mono headline, "Lanjut dengan Google" pill button.
- **Home**: navy header with Total Saldo (mono, large); swipeable wallet credit-card carousel (wallet color, name, balance); quick pills [Pengeluaran] [Pemasukan] [Transfer]; month switcher; Income/Spend segmented toggle → parent-category list (icon in navy circle, total, tx count, %), tap to expand subcats; month income/expense/net summary.
- **History**: transactions grouped by date, month switcher, filters (type/wallet/category), search (note/category/amount across all months), tap → edit sheet, delete with confirm.
- **Stats**: tabs Harian / Mingguan / Bulanan / Tahunan bar charts (selected bar orange, rest peach tint), donut by category for selected month, 12-month income vs expense.
- **More**: Goals, Wallets, Categories (2-level editor, icon/color picker, archive), Recurring, Frasa Bot (learned phrases list, edit/delete), Settings (language, theme, default wallet, recalculate balances, UID, sign out).
- **Add/Edit sheet** (shadcn Drawer): type segmented control, large mono amount with live `.` grouping (`inputmode="numeric"`), category grid → subcats, wallet chips (+ "to" wallet for transfer), date (default today), note. Disabled while offline.

Design tokens (CSS vars on `:root`, overridden for `.dark` and `prefers-color-scheme`):
- Light: bg `#E9E8EF`, card `#FFFFFF`, ink/header `#1F2630`, text `#1F2630`, muted `#7A7F8A`
- Dark: bg `#14181E`, card `#1E242C`, header `#0F1318`, text `#ECEEF2`
- Accent `#E07338`, accent-soft `#F9E0D2` (dark: `#3A2A22`), lime card `#DDF35A`, income `#2F9E6E`, expense `#D9534F`
- Radius: cards 20px, buttons/nav pills full. Fonts self-hosted via `@fontsource` (cached by SW). Icons: `lucide-react`.

## Repo layout

```
firebase.json            public → dist, SPA rewrite to /index.html, no-cache header for sw.js, database rules
database.rules.json
package.json  vite.config.ts  tsconfig*.json  components.json  index.html
public/                  icons 192/512/maskable, favicon, apple-touch-icon
src/
  main.tsx  App.tsx  index.css (tokens)
  lib/       firebase.ts (config hardcoded — not secret), ledger.ts, money.ts, dates.ts, seed.ts, types.ts
  i18n/      en.ts, id.ts, index.tsx (typed t(), provider, persists choice in /settings)
  hooks/     useAuth, useSettings, useWallets, useCategories, useMonthTx, useAllTx, useOnline (.info/connected)
  components/ui/ (shadcn)  components/ BottomNav, WalletCarousel, WalletCard, TxList, TxSheet, AmountInput,
             CategoryPicker, MonthSwitcher, OfflineBanner, AuthGate
  pages/     Login, Onboarding, Home, History, Stats, More, Wallets, Categories, Recurring, Goals, Phrases, Settings
apps-script/ appsscript.json (timeZone Asia/Jakarta, oauthScopes, webapp), Config.gs (BOT_TOKEN, WEBHOOK_KEY,
             CHAT_ID, DB_URL, PHRASES, WALLET_ALIASES), Main.gs (doPost, dedupe, routing), Parser.gs, Ledger.gs,
             Db.gs, Telegram.gs, Commands.gs, Triggers.gs (dailyRecurring, monthlyReport, setupTriggers,
             setWebhook, testDb), README.md (paste + deploy steps)
tests/       ledger.test.ts, money.test.ts, dates.test.ts, parser.test.ts + gsLedger.test.ts (load .gs via node:vm)
docs/superpowers/specs/2026-10-02-mycash-design.md   (copy of this design)
```

`Parser.gs` / `Ledger.gs` stay pure so Vitest can load them with `vm.runInNewContext` — no `module.exports` needed.

## Implementation order

1. **Scaffold**: `git init`; Vite React-TS; Tailwind v4 + shadcn init; deps (firebase, react-router, recharts, date-fns, lucide-react, @fontsource/inter, @fontsource/jetbrains-mono, vite-plugin-pwa, vitest); replace welcome `index.html`, delete `404.html`; update `firebase.json`; save design doc to `docs/`.
2. **Core lib + tests**: types, money (parse/format IDR), dates (WIB today, month keys, clamp day), ledger `balanceDeltas` + `buildTxUpdate` — test-first.
3. **Firebase + auth**: init, AuthGate (login / not-authorized UID screen / onboarding if no wallets), rules file, seed.
4. **Shell**: tokens, fonts, theme toggle, i18n, layout, BottomNav, FAB, OfflineBanner.
5. **Home + TxSheet** (expense/income/transfer create/edit).
6. **History** (groups, filters, search, edit/delete).
7. **Stats** (Recharts).
8. **More**: Wallets, Categories, Recurring, Goals, Phrases, Settings (incl. recalculate).
9. **PWA**: manifest (name MyCash, standalone, theme `#1F2630`), icons, Workbox `generateSW` precache + `navigateFallback`, update prompt.
10. **Apps Script**: Parser (test-first with the cases below), Ledger, Db, Telegram, Main, Commands, Triggers, README.
11. **Deploy + E2E**.

## Manual setup steps for Azriel (documented in README)

1. Firebase console: create Realtime Database (asia-southeast1), enable Google sign-in provider, register web app → copy config into `src/lib/firebase.ts`.
2. Deploy, sign in once, copy UID from not-authorized screen into `database.rules.json`, `firebase deploy --only database`.
3. BotFather → new bot → token. Message bot `/start` → it replies your chat ID (after step 4).
4. script.google.com → new project → show manifest → paste `apps-script/*` → fill `Config.gs` → Deploy as web app → run `testDb()`, `setWebhook()`, `setupTriggers()` once, authorize.

## Verification

- `npm test` (Vitest):
  - Parser: `beli kopi 25rb pake gopay` → expense 25000 food.coffee GoPay; `gaji masuk 8jt` → income 8000000 Salary default wallet; `+500rb jual barang` → income; `1,5jt`/`1.5jt`/`25.000`/`25000`; `kemarin makan 30rb` → yesterday; `bensin 50rb 28/9` → 28 Sep; `tf 100rb bca ke gopay` and `topup gopay 50rb dari bca` → transfer BCA→GoPay; `parkir 5rb` with no phrase → unmatched; learned phrase overrides base.
  - Ledger (TS and GS copies, same table of cases): create/edit/delete for each type, amount change, wallet change, type change (expense↔income↔transfer).
  - Money/dates: IDR formatting, day 31 clamp in Feb, WIB date boundaries.
- `npm run build && npm run preview`: Lighthouse installability passes; DevTools offline → shell loads with offline banner, add disabled.
- Local data flows with Firebase emulators (`firebase emulators:start --only auth,database`, needs `jre-openjdk`): onboarding seed, add/edit/delete expense/income/transfer → wallet balances correct; recalculate matches; light/dark + EN/ID toggles; Playwright smoke at 390px width.
- Apps Script: `testDb()` writes `/meta/ping`, reads back, applies `.sv increment` → proves OAuth admin access + increment over REST.
- Live E2E after deploy: send bot messages from the test list → rows appear live in installed PWA with correct balances; [Batal] reverts balance; unknown phrase → pick → learn → next message auto-matches; `getWebhookInfo` checked and forced redelivery doesn't duplicate; run `dailyRecurring`/`monthlyReport` manually → correct tx + message; unknown chat ID gets no data.
