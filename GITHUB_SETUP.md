# GitHub Pages + Telegram (cloud setup)

The tracker no longer needs your laptop running. The web UI is on GitHub Pages; Telegram reminders and the bot run via GitHub Actions.

## 0. Telegram MCP in Cursor (optional)

1. Run once locally (creates `.env`, never committed):

   ```bash
   ./scripts/setup-telegram-env.sh
   ```

2. **Restart Cursor** so the Telegram MCP server loads (`.cursor/mcp.json` + global `~/.cursor/mcp.json`).

3. In chat you can ask the agent to use `tg_get_me`, `tg_send_message`, etc.

## 1. Repository secrets

In **GitHub → Personal-Tracker → Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|--------|
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | **Numeric** ID from [@userinfobot](https://t.me/userinfobot) (e.g. `67835516`) — not `@username`. Send `/start` to your bot first. |

If Actions fail with `chat not found`, the chat ID is wrong or you have not messaged the bot yet.

**Fix chat ID:** Actions → **Discover Telegram Chat ID** → Run workflow (send `/start` to your bot first). Set `TELEGRAM_CHAT_ID` to the numeric `id` printed in the log.

## 2. Enable GitHub Pages

**Settings → Pages → Build and deployment → Source:** GitHub Actions.

Pushing to `master` runs `.github/workflows/deploy.yml` and publishes:
https://yashb042.github.io/Personal-Tracker/

## 3. What runs in the cloud

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `telegram-bot.yml` | ~every 2 min | Poll Telegram; handle `log`, **button taps**, history |

**Button taps:** The cloud bot is not instant like your old laptop server. Taps are processed on the next poll (~2 min). If nothing happens, type *log* again or wait and tap once more.
| `tracker-scheduler.yml` | 8 AM IST | Start daily tracking in Telegram |
| `tracker-scheduler.yml` | Hourly 9 AM–10 PM IST | Nag until today is logged |
| `tracker-scheduler.yml` | Wed / Fri / Sun | Midweek, Friday, weekly report |
| `tracker-scheduler.yml` | ~1 PM IST (some days) | Random motivation |

## 4. Do not run the local server

```bash
# ❌ Don't use for production anymore
node server.js
```

Use the web app on GitHub Pages, or Telegram (`log`, `history`, `week`).

## 5. Manual test

**Actions → Tracker Scheduled Reminders → Run workflow** → job: `daily-prompt`

You should get the tracking flow in Telegram within a minute (bot poll runs every 5 min).

## 6. Notes

- Bot replies may take up to **5 minutes** (GitHub Actions polling interval).
- Activity data is stored in `data/activities.json` in the repo (committed by Actions).
- The web app syncs that file on load.
