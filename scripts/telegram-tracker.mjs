/**
 * Personal Tracker — Telegram bot & reminders for GitHub Actions.
 * Replaces the local server.js cron + polling (runs 24/7 in the cloud).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import activityFields from '../client/src/activityFields.js';

const { gymOrSportsValue } = activityFields;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const STATE_FILE = path.join(DATA_DIR, 'bot-state.json');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BOT_API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;
const PAGES_URL = process.env.PAGES_URL || 'https://yashb042.github.io/Personal-Tracker/';

const TARGET_DATE = new Date('2026-07-31T23:59:59+05:30');

const THEMES = [
  (d) => `🔥 BEAST MODE: You have ${d} days till July 31. Every rep counts.`,
  (d) => `⚡ NO EXCUSES: Champions don't skip. ${d} days left.`,
  (d) => `💀 DISCIPLINE > MOTIVATION: ${d} days. Are you earning your body?`,
  (d) => `🏆 FUTURE YOU will thank PRESENT YOU. ${d} days remaining.`,
  (d) => `🥊 PAIN IS TEMPORARY, PRIDE IS FOREVER. ${d} days to go.`,
  (d) => `🚀 SHOW UP. EVERY. DAMN. DAY. ${d} days till July 31.`,
  (d) => `⛰️ THE GRIND DOESN'T QUIT — and neither do you. ${d} days left.`,
  (d) => `🦁 HUNT YOUR GOAL. ${d} days remaining. Stay savage.`,
];

// ── Data I/O ──────────────────────────────────────────
function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

const dailyActivities = loadJson(ACTIVITIES_FILE, []);
const state = loadJson(STATE_FILE, {
  botPollingOffset: 0,
  conversations: {},
});

function persistState() {
  saveJson(STATE_FILE, state);
}

// ── Date helpers (IST) ────────────────────────────────
function istNow() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
}

function todayDateIST() {
  return istNow().toISOString().split('T')[0];
}

function formatDateNice(dateStr) {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function daysUntilTarget() {
  const ms = TARGET_DATE.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function currentThemeLine() {
  const left = daysUntilTarget();
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  const themeIndex = Math.floor(dayOfYear / 3) % THEMES.length;
  return THEMES[themeIndex](left);
}

function startOfWeekIST() {
  const ist = istNow();
  const day = ist.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(ist.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  return monday.toISOString().split('T')[0];
}

function currentWeekDates() {
  const monStr = startOfWeekIST();
  const monDate = new Date(monStr + 'T00:00:00Z');
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monDate.getTime() + i * 24 * 60 * 60 * 1000);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

function weekStats() {
  const weekSet = new Set(currentWeekDates());
  const week = dailyActivities.filter((a) => weekSet.has(a.date));
  return week.filter(gymOrSportsValue).length;
}

function weekProgressLine() {
  const activeDays = weekStats();
  const status = activeDays >= 4 ? '✅' : activeDays >= 2 ? '⚠️' : '💀';
  return `This week: ${activeDays}/4 gym or sports days ${status}`;
}

function computeGuitarStreak() {
  const byDate = new Map(dailyActivities.map((a) => [a.date, a]));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const check = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - i * 24 * 60 * 60 * 1000);
    const ds = check.toISOString().split('T')[0];
    const a = byDate.get(ds);
    if (a && a.practicedGuitar) streak++;
    else break;
  }
  return streak;
}

// ── Telegram API ──────────────────────────────────────
async function tgPost(method, body) {
  const res = await fetch(`${BOT_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data;
}

function trackerWebAppMarkup() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Open Tracker (instant)', web_app: { url: PAGES_URL } }],
      ],
    },
  };
}

async function sendMessage(chatId, text, extra = {}) {
  const body = { chat_id: chatId, text, ...extra };
  if (!extra.reply_markup) body.parse_mode = 'Markdown';
  await tgPost('sendMessage', body);
}

async function answerCallback(callbackQueryId) {
  try {
    await tgPost('answerCallbackQuery', { callback_query_id: callbackQueryId });
  } catch { /* ignore */ }
}

async function sendInstantLogPrompt(chatId) {
  const date = todayDateIST();
  await sendMessage(
    chatId,
    `${currentThemeLine()}\n\n📋 *Daily Tracker — ${formatDateNice(date)}*\n\nTap below to log instantly (opens in Telegram, no wait):`,
    trackerWebAppMarkup()
  );
}

async function handleBotMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const textLower = text.toLowerCase();

  if (text === '/start') {
    await sendMessage(
      chatId,
      '👋 *Personal Tracker* (GitHub cloud)\n\n' +
        '• Tap *Open Tracker* below — instant form in Telegram\n' +
        '• *history* — last 7 days\n' +
        '• *week* — gym or sports stats\n\n' +
        'Reminders run on GitHub Actions. Your laptop can be off.\n' +
        'One-time: add a GitHub token in the app Settings for instant save.',
      trackerWebAppMarkup()
    );
    return;
  }

  if (textLower === 'log' || text === '/track') {
    await sendInstantLogPrompt(chatId);
    return;
  }

  if (textLower === 'week' || text === '/week') {
    await sendMessage(chatId, `📊 ${weekProgressLine()}`);
    return;
  }

  if (textLower === 'history' || text === '/history') {
    const sorted = [...dailyActivities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    if (sorted.length === 0) {
      await sendMessage(chatId, '📭 No tracking data yet. Type *log* to start!');
      return;
    }
    let historyMsg = '📊 *Last 7 days:*\n';
    for (const a of sorted) {
      const active = gymOrSportsValue(a);
      historyMsg += `\n📅 *${formatDateNice(a.date)}*\n`;
      historyMsg += `  🛏️ ${a.sleepTime || '-'} | ⏰ ${a.wakeUpTime || '-'}\n`;
      historyMsg += `  🏋️ Gym or sports: ${active === undefined ? '–' : active ? 'Yes' : 'No'}\n`;
    }
    historyMsg += `\n${weekProgressLine()}`;
    await sendMessage(chatId, historyMsg);
    return;
  }

  if (textLower === 'cancel' || text === '/cancel') {
    if (state.conversations[String(chatId)]) {
      delete state.conversations[String(chatId)];
      persistState();
      await sendMessage(chatId, '❌ Tracking cancelled.');
    } else {
      await sendMessage(chatId, 'Nothing to cancel.');
    }
    return;
  }

  if (state.conversations[String(chatId)]) {
    delete state.conversations[String(chatId)];
    await sendInstantLogPrompt(chatId);
  } else {
    await sendMessage(chatId, 'Type *log* to track today\'s activities.');
  }
}

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  await answerCallback(query.id);
  await sendInstantLogPrompt(chatId);
}

// ── Scheduled jobs ────────────────────────────────────
async function sendTelegramToUser(message, extra = {}) {
  if (!CHAT_ID) return;
  await sendMessage(parseInt(CHAT_ID, 10), message, extra);
}

async function sendSundayReport() {
  const activeDays = weekStats();
  const guitarStreak = computeGuitarStreak();

  let verdict;
  if (activeDays >= 4) verdict = 'Solid week. Keep this energy. 🔥';
  else if (activeDays >= 3) verdict = 'Decent — but you missed the target. Tighten up next week. ⚠️';
  else verdict = 'Weak week. No more excuses. Reset Monday. 💀';

  await sendTelegramToUser(
    `📊 *Weekly Report*\n\n` +
      `🏋️ Gym or sports: ${activeDays}/4 days\n` +
      `🎸 Guitar streak: ${guitarStreak} days\n\n` +
      verdict
  );
}

function claimDailyPrompt() {
  const today = todayDateIST();
  const previous = state.dailyNagState;
  if (state.dailyPromptDate === today ||
      (previous?.date === today && (previous.completed || previous.nagCount > 0)) ||
      dailyActivities.some((activity) => activity.date === today)) {
    console.log('Daily prompt already claimed or activity already logged');
    return null;
  }

  state.dailyPromptDate = today;
  persistState();
  return today;
}

async function sendDailyPrompt(date) {
  if (state.dailyPromptDate !== date || date !== todayDateIST()) {
    throw new Error('Daily prompt has no claim for today');
  }
  await sendTelegramToUser(
    `${currentThemeLine()}\n\n📋 *Daily Tracker — ${formatDateNice(date)}*\n\nTap to log (instant):`,
    trackerWebAppMarkup()
  );
}

async function pollBotOnce(timeout = 0) {
  const res = await fetch(
    `${BOT_API}/getUpdates?offset=${state.botPollingOffset}&timeout=${timeout}&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'callback_query']))}`
  );
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'getUpdates failed');
  const updates = data.result || [];
  for (const update of updates) {
    state.botPollingOffset = update.update_id + 1;
    if (update.message) await handleBotMessage(update.message);
    else if (update.callback_query) await handleCallbackQuery(update.callback_query);
  }
  persistState();
  return updates.length;
}

async function pollBot() {
  let total = 0;
  for (let i = 0; i < 20; i++) {
    const n = await pollBotOnce(0);
    total += n;
    if (n === 0) break;
  }
  console.log(`Processed ${total} Telegram update(s)`);
}

async function pollBurst() {
  let total = 0;
  for (let i = 0; i < 30; i++) {
    const n = await pollBotOnce(0);
    total += n;
    if (n === 0 && i > 2) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`Burst processed ${total} Telegram update(s)`);
}

// ── CLI ───────────────────────────────────────────────
const mode = process.argv[2] || 'poll';

async function main() {
  ensureDataDir();
  if (mode === 'claim-daily-prompt') {
    if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
    const date = claimDailyPrompt();
    if (date) fs.appendFileSync(process.env.GITHUB_OUTPUT, `date=${date}\n`);
    return;
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required');
    process.exit(1);
  }
  switch (mode) {
    case 'poll':
      await pollBot();
      console.log('Bot poll complete');
      break;
    case 'poll-burst':
      await pollBurst();
      console.log('Bot poll burst complete');
      break;
    case 'daily-prompt': {
      const date = claimDailyPrompt();
      if (date) await sendDailyPrompt(date);
      break;
    }
    case 'send-daily-prompt':
      await sendDailyPrompt(process.env.PROMPT_DATE);
      break;
    case 'sunday':
      await sendSundayReport();
      break;
    default:
      console.error(`Unknown mode: ${mode}`);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
