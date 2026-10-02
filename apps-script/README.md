# MyCash Telegram bot (Google Apps Script)

The bot receives Telegram messages through an Apps Script web app, parses them with simple
phrase rules (no AI), and writes to the same Realtime Database as the MyCash web app.

## Files

| File | What it does |
|---|---|
| `Config.gs` | Your tokens, base `PHRASES`, `WALLET_ALIASES`, category names. The only file you normally edit. |
| `Parser.gs` | Turns `kopi 25rb gopay` into a transaction (pure, unit-tested). |
| `Ledger.gs` | Balance math. Mirrors `src/lib/ledger.ts` (unit-tested against the same cases). |
| `Util.gs` | Rupiah formatting, WIB dates, recurring due-check (unit-tested). |
| `Db.gs` | Realtime Database REST calls. |
| `Telegram.gs` | Telegram Bot API calls. |
| `Main.gs` | `doPost` webhook, message flow, inline-button callbacks. |
| `Commands.gs` | `/today /week /month /balance /goals /help`. |
| `Triggers.gs` | Daily recurring job, monthly report, and one-time setup functions. |
| `appsscript.json` | Manifest: Asia/Jakarta timezone, OAuth scopes, web app settings. |

## Setup (once)

1. **Create the bot.** In Telegram, talk to [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token.
2. **Create the script.** Go to [script.google.com](https://script.google.com) with the **same Google account
   that owns the Firebase project** → New project → name it `MyCash Bot`. Do this after the web app setup: the bot
   needs your wallets to exist.
3. **Show the manifest.** Project Settings (gear) → tick *Show "appsscript.json" manifest file in editor*.
4. **Paste the files.** For each `.gs` file here, add a script file with the same name (without `.gs`) and paste
   its contents. Replace the contents of `appsscript.json` with the one here. Delete the default `Code.gs`.
5. **Fill `Config.gs`:** `BOT_TOKEN`, `WEBHOOK_KEY` (any long random string, e.g. from
   `openssl rand -hex 24`) and `DB_URL` (your Realtime Database URL). Leave `CHAT_ID` and `WEBAPP_URL` for
   now. Save every file (Ctrl+S); an orange dot next to a file means unsaved.
6. **Check database access.** Select `testDb` in the function dropdown → Run → *Review permissions* → your
   account → *Advanced → Go to MyCash Bot (unsafe)* → tick **Select all** → Continue. Leaving a box
   unticked gives "This project requires access to your Google Account to run". The log should say
   `Database OK`. If it fails with 401/403, set `DB_SECRET` (see the comment in `Config.gs`) and run again.
7. **Deploy.** Deploy → New deployment → type *Web app* → Execute as **Me**, Who has access **Anyone** → Deploy.
   Copy the URL ending in `/exec` into `WEBAPP_URL`.
8. **Connect Telegram.** Run `setWebhook`. The log shows `"url": ".../exec?key=..."` with no `last_error_message`.
9. **Find your chat id.** Send `/start` to your bot. It replies `Chat ID kamu: 123456789`. Put that number in
   `CHAT_ID`, save, then publish a new version (see the note below). After this the bot ignores every other
   chat.
10. **Schedule jobs.** Run `setupTriggers` (daily recurring at 06:00, monthly report on the 1st at 08:00 WIB).

> Editing code after step 7: Deploy → Manage deployments → edit (pencil) → Version: *New version* → Deploy.
> The URL stays the same, so you don't need `setWebhook` again. Changing only `Config.gs` values still needs a
> new version.

## Using it

```
kopi 25rb gopay              → Pengeluaran · Makanan › Kopi & minuman · GoPay
gaji 8jt bca                 → Pemasukan · Gaji · BCA
+500rb jual barang           → Pemasukan (leading + forces income)
tf 100rb bca ke gopay        → Transfer BCA → GoPay
topup gopay 50rb dari bca    → Transfer BCA → GoPay
kemarin makan 30rb           → dated yesterday
bensin 50rb 28/9             → dated 28 Sep (future dates mean last year)
```

- Amounts: `25rb`, `25ribu`, `25k`, `25.000`, `25000`, `1,5jt`, `1.5jt`, `2juta`.
- No wallet in the message → the main wallet set in the app (Settings → Main wallet).
- Each saved transaction has **Batal** (undo), **Kategori** and **Dompet** buttons.
- An unknown word (e.g. `laundry 30rb`) → the bot asks for the category, saves it, then offers to remember the
  word. Remembered phrases appear in the app under *Lainnya → Frasa bot* and override `PHRASES`.

## Adding phrases by hand

Add entries to `PHRASES` in `Config.gs` (`'word': 'category.key'`). Keys come from `src/lib/seed.ts`.
`npm test` in the web app repo checks every key exists. Then deploy a new version.

## Troubleshooting

- **Bot silent:** run `webhookInfo` and read `last_error_message`. `Wrong response from the webhook: 302`
  plus a growing `pending_update_count` means the live version's `doPost` returns `ContentService` output:
  Telegram treats the redirect as a failure and stalls. `ok_()` in `Main.gs` must use `HtmlService`; publish a
  new version, then run `setWebhook` (it drops the stuck updates). Also check Executions: every `doPost` row
  should show the newest version number.
- **"Gagal memproses: Database … 401":** the script's Google account can't reach the database. Make sure it is
  the Firebase project owner, or use `DB_SECRET`.
- **Wrong timezone in reports:** `appsscript.json` must say `"timeZone": "Asia/Jakarta"`.
