# GitHub-only tracker (laptop can be off)

## How it works

| Piece | Role |
|-------|------|
| **GitHub Actions** | Sends Telegram reminders (8 AM, hourly nags, weekly report) |
| **GitHub Pages** | Hosts the tracker app inside Telegram as a **Web App** |
| **Telegram “Open Tracker” button** | Opens the app instantly — no 2‑minute wait, no extra hosting, no laptop |

GitHub Actions **cannot** process Telegram inline button taps quickly (polling is every 5+ minutes). So reminders use a **Web App button**, not the old chat button wizard.

## One-time setup

### 1. GitHub repo secrets

**Settings → Secrets → Actions**

| Secret | Value |
|--------|--------|
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Numeric ID from [@userinfobot](https://t.me/userinfobot) |

Wrong chat ID? Run **Actions → Discover Telegram Chat ID** (send `/start` to your bot first).

### 2. GitHub Pages

**Settings → Pages → Source:** GitHub Actions.

Live app: https://yashb042.github.io/Personal-Tracker/

### 3. Telegram Web App button (BotFather)

1. Open [@BotFather](https://t.me/BotFather) → your bot → **Bot Settings → Menu Button**
2. Set URL to: `https://yashb042.github.io/Personal-Tracker/`

### 4. GitHub token in the app (instant save)

1. Open the tracker (from Telegram **Open Tracker** or the URL above)
2. Go to **Settings**
3. Add a fine-grained token with **Contents: Read and write** on `Personal-Tracker`
4. Save — stored in your browser only

After this, saving in the Telegram Web App writes to GitHub immediately and stops hourly nags for that day.

## Daily use

1. Get a reminder in Telegram
2. Tap **📱 Open Tracker (instant)**
3. Fill the form → **Save** (closes in Telegram when sync succeeds)

Optional: type `log` in Telegram to get the same Open Tracker button again.

## What runs on GitHub

| Workflow | Schedule |
|----------|----------|
| `tracker-scheduler.yml` | 8 AM prompt, hourly nags, Wed/Fri/Sun reports |
| `deploy.yml` | Deploys app on every push to `master` |

`telegram-bot.yml` is **disabled** (slow polling is not used).

## Do not run locally for production

```bash
# Not needed for reminders or instant logging
node server.js
```

Your old local server was only needed for instant *inline* buttons. The Web App replaces that without keeping your laptop on.
