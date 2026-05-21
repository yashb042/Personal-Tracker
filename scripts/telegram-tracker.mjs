/**
 * Personal Tracker — Telegram bot & reminders for GitHub Actions.
 * Replaces the local server.js cron + polling (runs 24/7 in the cloud).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const MOTIVATIONAL_POOL = [
  'You paid for that gym membership. Use it or lose it.',
  "Excuses don't burn calories. Move.",
  "Skipping today is stealing from tomorrow's you.",
  'Comfort is a slow death. Get up.',
  'Stop scrolling. Start sweating.',
  'Your muscles are filing a missing person report.',
  "30 minutes. That's it. You spend more time on Instagram.",
  'Discipline is choosing between what you want now and what you want most.',
  "Someone out there is training while you're on the couch. Catch up.",
  "Nobody's going to do this for you. Get up.",
  "The gym doesn't care about your mood. Go anyway.",
  () => `You have ${daysUntilTarget()} days till July 31. Don't waste them.`,
];

const TRACKING_STEPS = [
  { key: 'sleepTime', question: '🛏️ What time did you sleep last night?', options: [['9 PM', '9:30 PM', '10 PM'], ['10:30 PM', '11 PM', '11:30 PM'], ['12 AM', '12:30 AM', '1 AM'], ['After 1 AM']] },
  { key: 'wakeUpTime', question: '⏰ What time did you wake up today?', options: [['5 AM', '5:30 AM', '6 AM'], ['6:30 AM', '7 AM', '7:30 AM'], ['8 AM', '8:30 AM', '9 AM'], ['After 9 AM']] },
  { key: 'laptopDropTime', question: '💻 What time did you stop working / close your laptop?', options: [['5 PM', '5:30 PM', '6 PM'], ['6:30 PM', '7 PM', '7:30 PM'], ['8 PM', '9 PM', '10 PM'], ['After 10 PM']] },
  { key: 'gymTime', question: '🏋️ Did you go to the gym? If yes, what time?', options: [['6 AM', '7 AM', '8 AM'], ['5 PM', '6 PM', '7 PM'], ['Other time'], ['❌ No gym today']] },
  { key: 'sportPlayed', question: '🏃 Did you play any sport today?', options: [['⚽ Football', '🏏 Cricket'], ['🏸 Badminton', '🏊 Swimming'], ['🏃 Running', 'Other sport'], ['❌ No sport']] },
  { key: 'practicedGuitar', question: '🎸 Did you practice guitar today?', options: [['✅ Yes', '❌ No']] },
  { key: 'ateSweets', question: '🍬 Did you eat sweets today?', options: [['✅ Yes', '❌ No']] },
  { key: 'morningRoutine', question: '🌅 How did your morning go?', options: [['✅ Perfect morning', '📱 Opened Slack first'], ['📺 Scrolled socials', '🛏️ Snoozed/lazy start'], ['Other']] },
  { key: 'plannedTomorrow', question: '📋 Did you plan stuff for tomorrow?', options: [['✅ Yes', '❌ No']] },
];

const BOOLEAN_KEYS = new Set(['practicedGuitar', 'plannedTomorrow', 'ateSweets']);

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

let dailyActivities = loadJson(ACTIVITIES_FILE, []);
let state = loadJson(STATE_FILE, {
  botPollingOffset: 0,
  conversations: {},
  dailyNagState: { date: null, completed: false, nagCount: 0 },
});

function persistActivities() {
  saveJson(ACTIVITIES_FILE, dailyActivities);
}

function persistState() {
  saveJson(STATE_FILE, state);
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── Date helpers (IST) ────────────────────────────────
function istNow() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
}

function todayDateIST() {
  return istNow().toISOString().split('T')[0];
}

function formatDateNice(dateStr) {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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

function getRandomMotivation() {
  const item = MOTIVATIONAL_POOL[Math.floor(Math.random() * MOTIVATIONAL_POOL.length)];
  return typeof item === 'function' ? item() : item;
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
  const monDate = new Date(monStr + 'T00:00:00+05:30');
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
  const gymDays = week.filter((a) => a.gymTime && !/no/i.test(a.gymTime)).length;
  const sportDays = week.filter((a) => a.sportPlayed && !/^❌|^no/i.test(a.sportPlayed)).length;
  return { gymDays, sportDays, weekCount: week.length };
}

function weekProgressLine() {
  const { gymDays, sportDays } = weekStats();
  const gymStatus = gymDays >= 4 ? '✅' : gymDays >= 2 ? '⚠️' : '💀';
  const sportStatus = sportDays >= 2 ? '✅' : sportDays >= 1 ? '⚠️' : '💀';
  return `This week: ${gymDays}/4 gym days ${gymStatus} | ${sportDays}/2 sport days ${sportStatus}`;
}

function isTodayLogged() {
  const today = todayDateIST();
  if (dailyActivities.find((a) => a.date === today)) return true;
  if (state.dailyNagState.date === today && state.dailyNagState.completed) return true;
  return false;
}

function markNagComplete() {
  state.dailyNagState.completed = true;
  persistState();
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

async function sendMessage(chatId, text, extra = {}) {
  await tgPost('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', ...extra });
}

async function answerCallback(callbackQueryId) {
  try {
    await tgPost('answerCallbackQuery', { callback_query_id: callbackQueryId });
  } catch { /* ignore */ }
}

function flattenOptions(options) {
  const flat = [];
  for (const row of options) {
    for (const text of row) flat.push(text);
  }
  return flat;
}

function buildInlineKeyboard(stepIndex, options) {
  let optIdx = 0;
  return {
    reply_markup: {
      inline_keyboard: options.map((row) =>
        row.map((text) => {
          const cb = `t:${stepIndex}:${optIdx}`;
          optIdx++;
          return { text, callback_data: cb };
        })
      ),
    },
  };
}

function answerFromCallback(stepIndex, optIndex) {
  const step = TRACKING_STEPS[stepIndex];
  if (!step) return null;
  const flat = flattenOptions(step.options);
  return flat[optIndex] ?? null;
}

async function sendStep(chatId, stepIndex) {
  const step = TRACKING_STEPS[stepIndex];
  await sendMessage(chatId, step.question, buildInlineKeyboard(stepIndex, step.options));
}

async function startTracking(chatId) {
  const date = todayDateIST();
  state.conversations[String(chatId)] = { step: 0, answers: {}, date };
  persistState();
  const intro =
    `${currentThemeLine()}\n\n` +
    `📋 *Daily Tracker — ${formatDateNice(date)}*\n\n` +
    `Let's go through your day, one question at a time.\n\n` +
    `🌐 Web: ${PAGES_URL}`;
  await sendMessage(chatId, intro);
  await new Promise((r) => setTimeout(r, 400));
  await sendStep(chatId, 0);
}

async function processAnswer(chatId, answerText) {
  const key = String(chatId);
  const convo = state.conversations[key];
  if (!convo) return;

  const currentStep = TRACKING_STEPS[convo.step];

  if (convo.awaitingFreeText === 'morningRoutine') {
    convo.answers.morningRoutine = answerText;
    convo.awaitingFreeText = null;
    convo.step++;
  } else if (currentStep.key === 'morningRoutine' && /other/i.test(answerText)) {
    convo.awaitingFreeText = 'morningRoutine';
    await sendMessage(chatId, '✍️ Type what you did this morning:');
    persistState();
    return;
  } else if (BOOLEAN_KEYS.has(currentStep.key)) {
    convo.answers[currentStep.key] = /yes|✅/i.test(answerText);
    convo.step++;
  } else if (currentStep.key === 'gymTime' && /no|❌/i.test(answerText)) {
    convo.answers.gymTime = 'No';
    convo.step++;
  } else if (currentStep.key === 'sportPlayed' && /no|❌/i.test(answerText)) {
    convo.answers.sportPlayed = 'No';
    convo.step++;
  } else {
    convo.answers[currentStep.key] = answerText;
    convo.step++;
  }

  if (convo.step < TRACKING_STEPS.length) {
    persistState();
    await sendStep(chatId, convo.step);
    return;
  }

  const i = dailyActivities.findIndex((a) => a.date === convo.date);
  const existing = i !== -1 ? dailyActivities[i] : null;
  const saved = {
    id: existing ? existing.id : generateId(),
    date: convo.date,
    sleepTime: convo.answers.sleepTime || '',
    wakeUpTime: convo.answers.wakeUpTime || '',
    laptopDropTime: convo.answers.laptopDropTime || '',
    gymTime: convo.answers.gymTime || '',
    sportPlayed: convo.answers.sportPlayed || '',
    practicedGuitar: convo.answers.practicedGuitar || false,
    ateSweets: convo.answers.ateSweets || false,
    morningRoutine: convo.answers.morningRoutine || '',
    plannedTomorrow: convo.answers.plannedTomorrow || false,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (i !== -1) dailyActivities[i] = saved;
  else dailyActivities.push(saved);
  persistActivities();

  const guitar = saved.practicedGuitar ? '✅ Yes' : '❌ No';
  const sweets = saved.ateSweets ? '✅ Yes' : '❌ No';
  const sport = saved.sportPlayed && saved.sportPlayed !== 'No' ? saved.sportPlayed : '❌ No';

  const summary =
    `✅ *Activity saved for ${formatDateNice(saved.date)}!*\n\n` +
    `🛏️ Sleep: ${saved.sleepTime}\n` +
    `⏰ Wake up: ${saved.wakeUpTime}\n` +
    `💻 Laptop drop: ${saved.laptopDropTime}\n` +
    `🏋️ Gym: ${saved.gymTime}\n` +
    `🏃 Sport: ${sport}\n` +
    `🎸 Guitar: ${guitar}\n` +
    `🍬 Sweets: ${sweets}\n` +
    `🌅 Morning: ${saved.morningRoutine || '-'}\n` +
    `📋 Planned tomorrow: ${saved.plannedTomorrow ? '✅ Yes' : '❌ No'}\n\n` +
    `📊 ${weekProgressLine()}\n\n` +
    `Type *history* to view past entries.`;

  await sendMessage(chatId, summary);
  delete state.conversations[key];
  markNagComplete();
}

async function handleBotMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const textLower = text.toLowerCase();

  if (text === '/start') {
    await sendMessage(
      chatId,
      '👋 Hey! I\'m your *Personal Tracker Bot* (cloud edition).\n\n' +
        '• *log* — Log today\'s activities\n' +
        '• *history* — View last 7 days\n' +
        '• *week* — This week\'s gym/sport stats\n' +
        '• *cancel* — Cancel current tracking\n\n' +
        `🌐 Web tracker: ${PAGES_URL}\n\n` +
        '⏰ Daily 8 AM IST prompt + hourly nags until you log (runs on GitHub, not your laptop).'
    );
    return;
  }

  if (textLower === 'log' || text === '/track') {
    await startTracking(chatId);
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
      const sport = a.sportPlayed && a.sportPlayed !== 'No' ? a.sportPlayed : '❌';
      historyMsg += `\n📅 *${formatDateNice(a.date)}*\n`;
      historyMsg += `  🛏️ ${a.sleepTime || '-'} | ⏰ ${a.wakeUpTime || '-'}\n`;
      historyMsg += `  🏋️ ${a.gymTime || '-'} | 🏃 ${sport}\n`;
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
    await processAnswer(chatId, text);
  } else {
    await sendMessage(chatId, 'Type *log* to track today\'s activities.');
  }
}

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const raw = query.data || '';
  await answerCallback(query.id);

  let answerText = null;
  const m = raw.match(/^t:(\d+):(\d+)$/);
  if (m) {
    answerText = answerFromCallback(parseInt(m[1], 10), parseInt(m[2], 10));
  } else if (raw.startsWith('track_')) {
    answerText = raw.replace(/^track_/, '');
  }

  if (!answerText) {
    await sendMessage(chatId, 'Unknown button. Type *log* to start again.');
    return;
  }

  const key = String(chatId);
  if (!state.conversations[key]) {
    await sendMessage(
      chatId,
      '⏳ That prompt expired (cloud bot syncs every ~2 min). Type *log* to start again, or wait a moment and tap again.'
    );
    return;
  }
  await processAnswer(chatId, answerText);
}

// ── Scheduled jobs ────────────────────────────────────
async function sendTelegramToUser(message) {
  if (!CHAT_ID) return;
  await sendMessage(parseInt(CHAT_ID, 10), message);
}

async function sendSundayReport() {
  const weekSet = new Set(currentWeekDates());
  const week = dailyActivities.filter((a) => weekSet.has(a.date));
  const gymDays = week.filter((a) => a.gymTime && !/no/i.test(a.gymTime)).length;
  const sportDays = week.filter((a) => a.sportPlayed && !/^❌|^no/i.test(a.sportPlayed)).length;
  const sweetsCount = week.filter((a) => a.ateSweets).length;
  const perfectMornings = week.filter((a) => /perfect/i.test(a.morningRoutine)).length;
  const guitarStreak = computeGuitarStreak();

  let verdict;
  if (gymDays >= 4 && sportDays >= 2) verdict = 'Solid week. Keep this energy. 🔥';
  else if (gymDays >= 3) verdict = 'Decent — but you missed the target. Tighten up next week. ⚠️';
  else verdict = 'Weak week. No more excuses. Reset Monday. 💀';

  await sendTelegramToUser(
    `📊 *Weekly Report*\n\n` +
      `🏋️ Gym: ${gymDays}/4 days\n` +
      `🏃 Sports: ${sportDays}/2 days\n` +
      `🎸 Guitar streak: ${guitarStreak} days\n` +
      `🍬 Sweets: ${sweetsCount} days\n` +
      `🌅 Perfect mornings: ${perfectMornings}/7\n\n` +
      verdict
  );
}

async function sendMidweekCheck() {
  const { gymDays } = weekStats();
  if (gymDays < 2) {
    await sendTelegramToUser(
      `💀 It's Wednesday and you've only hit the gym ${gymDays} time${gymDays === 1 ? '' : 's'}. You need ${4 - gymDays} more this week. Stop slacking.`
    );
  }
}

async function sendFridayPush() {
  const { gymDays, sportDays } = weekStats();
  if (gymDays < 3) {
    await sendTelegramToUser(
      `🚨 Friday alert. Gym days this week: ${gymDays}/4. Sports: ${sportDays}/2. Weekend is your last chance. Don't blow it.`
    );
  }
}

async function sendRandomMidday() {
  const ist = istNow();
  const start = new Date(Date.UTC(ist.getUTCFullYear(), 0, 1));
  const weekOfYear = Math.floor((ist.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const chosenDow = (weekOfYear % 5) + 1;
  const todayDow = ist.getUTCDay();
  if (todayDow !== chosenDow) return;
  await sendTelegramToUser(`💭 ${getRandomMotivation()}`);
}

async function runDailyPrompt() {
  const today = todayDateIST();
  state.dailyNagState = { date: today, completed: false, nagCount: 1 };
  persistState();
  await startTracking(parseInt(CHAT_ID, 10));
}

async function runHourlyNag() {
  if (isTodayLogged()) return;
  state.dailyNagState.nagCount = (state.dailyNagState.nagCount || 0) + 1;
  persistState();
  const hour = state.dailyNagState.nagCount;
  const nagMessages = [
    `⏰ Reminder #${hour}: Log your day. Type *log* or tap through the buttons above.`,
    `👀 Still waiting on today's log...`,
    `${currentThemeLine()}\n\nYou haven't logged today. Type *log*.`,
    `🔔 Hey. The tracker is waiting. Type *log*.`,
    `💀 ${hour} reminders in. Log. Your. Day.`,
    `📋 ${PAGES_URL}\n\nType *log* here or use the web form.`,
    `${getRandomMotivation()}\n\n...and log your day. Type *log*.`,
  ];
  await sendTelegramToUser(nagMessages[Math.floor(Math.random() * nagMessages.length)]);
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
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required');
    process.exit(1);
  }
  ensureDataDir();

  switch (mode) {
    case 'poll':
      await pollBot();
      console.log('Bot poll complete');
      break;
    case 'poll-burst':
      await pollBurst();
      console.log('Bot poll burst complete');
      break;
    case 'daily-prompt':
      await runDailyPrompt();
      await pollBurst();
      console.log('Daily 8 AM prompt sent');
      break;
    case 'hourly-nag':
      await runHourlyNag();
      await pollBurst();
      console.log('Hourly nag sent (if needed)');
      break;
    case 'midweek':
      await sendMidweekCheck();
      break;
    case 'friday':
      await sendFridayPush();
      break;
    case 'sunday':
      await sendSundayReport();
      break;
    case 'midday':
      await sendRandomMidday();
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
