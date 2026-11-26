const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
const { defaultActivity, gymOrSportsValue } = require('./client/src/activityFields');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// =============================================
// PERSISTENT JSON STORAGE
// =============================================
const DATA_DIR = path.join(__dirname, 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const LABELS_FILE = path.join(DATA_DIR, 'labels.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const BOT_STATE_FILE = path.join(DATA_DIR, 'bot-state.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function loadFile(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Failed to load ${file}:`, e.message);
    return fallback;
  }
}

function saveFile(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Failed to save ${file}:`, e.message);
  }
}

function loadDB() {
  return {
    notes: loadFile(NOTES_FILE, []),
    labels: loadFile(LABELS_FILE, []),
    activities: loadFile(ACTIVITIES_FILE, []),
  };
}

function saveDB() {
  saveFile(NOTES_FILE, notes);
  saveFile(LABELS_FILE, labels);
  saveFile(ACTIVITIES_FILE, dailyActivities);
}

const _db = loadDB();
let notes = _db.notes;
let labels = _db.labels;
let dailyActivities = _db.activities;

let notificationSettings = {
  enabled: true,
  time: '22:00',
  method: 'telegram',
  message: 'Hey! Have you logged your daily tracker yet?',
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// =============================================
// NOTES
// =============================================
app.get('/api/notes', (req, res) => res.json(notes));

app.post('/api/notes', (req, res) => {
  const { title, content, labelIds } = req.body;
  const note = {
    id: generateId(),
    title,
    content,
    labelIds: labelIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.push(note);
  saveFile(NOTES_FILE, notes);
  res.status(201).json(note);
});

app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, labelIds } = req.body;
  const i = notes.findIndex(n => n.id === id);
  if (i === -1) return res.status(404).json({ error: 'Note not found' });
  notes[i] = { ...notes[i], title, content, labelIds: labelIds || [], updatedAt: new Date().toISOString() };
  saveFile(NOTES_FILE, notes);
  res.json(notes[i]);
});

app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const i = notes.findIndex(n => n.id === id);
  if (i === -1) return res.status(404).json({ error: 'Note not found' });
  notes.splice(i, 1);
  saveFile(NOTES_FILE, notes);
  res.status(204).send();
});

// =============================================
// LABELS
// =============================================
app.get('/api/labels', (req, res) => res.json(labels));

app.post('/api/labels', (req, res) => {
  const { name, color } = req.body;
  const label = {
    id: generateId(),
    name,
    color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
    createdAt: new Date().toISOString(),
  };
  labels.push(label);
  saveFile(LABELS_FILE, labels);
  res.status(201).json(label);
});

app.put('/api/labels/:id', (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  const i = labels.findIndex(l => l.id === id);
  if (i === -1) return res.status(404).json({ error: 'Label not found' });
  labels[i] = { ...labels[i], name, color };
  saveFile(LABELS_FILE, labels);
  res.json(labels[i]);
});

app.delete('/api/labels/:id', (req, res) => {
  const { id } = req.params;
  const i = labels.findIndex(l => l.id === id);
  if (i === -1) return res.status(404).json({ error: 'Label not found' });
  notes = notes.map(n => ({ ...n, labelIds: n.labelIds.filter(lid => lid !== id) }));
  labels.splice(i, 1);
  saveFile(NOTES_FILE, notes);
  saveFile(LABELS_FILE, labels);
  res.status(204).send();
});

// =============================================
// DAILY ACTIVITIES
// =============================================
app.get('/api/activities', (req, res) => res.json(dailyActivities));

app.post('/api/activities', (req, res) => {
  const { date } = req.body;
  const i = dailyActivities.findIndex(a => a.date === date);
  const existing = dailyActivities[i];
  const fields = ['kegel', 'sleepTime', 'wakeUpTime', 'laptopDropTime', 'gymOrSports',
    'practicedGuitar', 'plannedTomorrow', 'gymTime', 'sportPlayed', 'ateSweets', 'morningRoutine'];
  const answers = Object.fromEntries(
    fields.filter(key => Object.hasOwn(req.body, key)).map(key => [key, req.body[key]])
  );
  const activity = {
    ...existing,
    ...answers,
    id: existing?.id ?? generateId(),
    date,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (i !== -1) dailyActivities[i] = activity;
  else dailyActivities.push(activity);
  saveFile(ACTIVITIES_FILE, dailyActivities);

  res.status(201).json(activity);
});

app.get('/api/activities/:date', (req, res) => {
  const a = dailyActivities.find(x => x.date === req.params.date);
  if (!a) return res.status(404).json({ error: 'Activity not found' });
  res.json(a);
});

// =============================================
// NOTIFICATION SETTINGS
// =============================================
app.get('/api/notification-settings', (req, res) => res.json(notificationSettings));

app.put('/api/notification-settings', (req, res) => {
  notificationSettings = { ...notificationSettings, ...req.body };
  res.json(notificationSettings);
});

// =============================================
// MOTIVATIONAL THEME ROTATION
// =============================================
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

const TARGET_DATE = new Date('2026-07-31T23:59:59+05:30');

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

// =============================================
// MOTIVATIONAL POOL — 30+ unique messages
// =============================================
// =============================================
// TELEGRAM
// =============================================
async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log('Telegram credentials not configured');
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }, { proxy: false });
    console.log('Telegram message sent');
  } catch (e) {
    console.error('Telegram send error:', e.message);
  }
}

app.post('/api/test-notification', async (req, res) => {
  const themed = `${currentThemeLine()}\n\n${req.body.message || 'Test from Personal Tracker!'}`;
  try {
    await sendTelegramMessage(themed);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send' });
  }
});

app.get('/api/theme', (req, res) => {
  res.json({ daysUntilJulyEnd: daysUntilTarget(), theme: currentThemeLine() });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// =============================================
// TELEGRAM BOT - Conversational Polling
// =============================================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const LOCAL_REMINDERS_ENABLED = process.env.TRACKER_LOCAL_REMINDERS === 'true';
const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
let botPollingOffset = 0;

const conversations = new Map();

const TRACKING_STEPS = [
  {
    key: 'kegel',
    question: '🔁 Did you do Kegels?',
    options: [['Once', 'Twice', 'No']],
  },
  {
    key: 'sleepTime',
    question: '🛏️ What time did you sleep last night?',
    options: [
      ['9 PM', '9:30 PM', '10 PM'],
      ['10:30 PM', '11 PM', '11:30 PM'],
      ['12 AM', '12:30 AM', '1 AM'],
      ['After 1 AM'],
    ],
  },
  {
    key: 'wakeUpTime',
    question: '⏰ What time did you wake up today?',
    options: [
      ['5 AM', '5:30 AM', '6 AM'],
      ['6:30 AM', '7 AM', '7:30 AM'],
      ['8 AM', '8:30 AM', '9 AM'],
      ['After 9 AM'],
    ],
  },
  {
    key: 'laptopDropTime',
    question: '💻 What time did you stop working / close your laptop?',
    options: [
      ['5 PM', '5:30 PM', '6 PM'],
      ['6:30 PM', '7 PM', '7:30 PM'],
      ['8 PM', '9 PM', '10 PM'],
      ['After 10 PM'],
    ],
  },
  {
    key: 'gymOrSports',
    question: '🏋️ Gym or sports today?',
    options: [['✅ Yes', '❌ No']],
  },
  {
    key: 'practicedGuitar',
    question: '🎸 Did you practice guitar today?',
    options: [['✅ Yes', '❌ No']],
  },
  {
    key: 'plannedTomorrow',
    question: '📋 Did you plan stuff for tomorrow?',
    options: [['✅ Yes', '❌ No']],
  },
];

const BOOLEAN_KEYS = new Set(['gymOrSports', 'practicedGuitar', 'plannedTomorrow']);

async function botSend(chatId, text, extra = {}) {
  try {
    await axios.post(`${BOT_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...extra,
    }, { proxy: false });
  } catch (e) {
    console.error('Bot send error:', e.message);
  }
}

async function answerCallback(callbackQueryId) {
  try {
    await axios.post(`${BOT_API}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
    }, { proxy: false });
  } catch (e) { /* ignore */ }
}

function todayDateIST() {
  const ist = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().split('T')[0];
}

function formatDateNice(dateStr) {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function sendStep(chatId, stepIndex, answers) {
  const step = TRACKING_STEPS[stepIndex];
  const selected = typeof answers[step.key] === 'boolean'
    ? answers[step.key] ? '✅ Yes' : '❌ No'
    : answers[step.key];
  const inline_keyboard = step.options.map(row => row.map(option => ({
    text: option === selected && step.key !== 'plannedTomorrow' ? `${option} (default)` : option,
    callback_data: `track:${stepIndex}:${option}`,
  })));
  await botSend(chatId, step.question, { reply_markup: JSON.stringify({ inline_keyboard }) });
}

async function startTracking(chatId) {
  const date = todayDateIST();
  const answers = defaultActivity(date);
  conversations.set(chatId, { step: 0, answers, date });
  const intro =
    `${currentThemeLine()}\n\n` +
    `📋 *Daily Tracker — ${formatDateNice(date)}*\n\n` +
    `Let's go through your day, one question at a time.`;
  await botSend(chatId, intro);
  await new Promise(r => setTimeout(r, 500));
  await sendStep(chatId, 0, answers);
}

// =============================================
// WEEK HELPERS — Mon to Sun (IST)
// =============================================
function istNow() {
  return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
}

function startOfWeekIST() {
  const ist = istNow();
  const day = ist.getUTCDay(); // 0=Sun .. 6=Sat (we treat as IST since we offset)
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
  const week = dailyActivities.filter(a => weekSet.has(a.date));
  return week.filter(gymOrSportsValue).length;
}

function weekProgressLine() {
  const activeDays = weekStats();
  const status = activeDays >= 4 ? '✅' : activeDays >= 2 ? '⚠️' : '💀';
  return `This week: ${activeDays}/4 gym or sports days ${status}`;
}

async function processAnswer(chatId, answerText) {
  const convo = conversations.get(chatId);
  if (!convo) return;

  const currentStep = TRACKING_STEPS[convo.step];

  const { key } = currentStep;
  if (BOOLEAN_KEYS.has(key)) {
    convo.answers[key] = /yes|✅/i.test(answerText);
  } else if (key === 'kegel') {
    const option = currentStep.options.flat().find(value => value.toLowerCase() === answerText.toLowerCase());
    if (!option) {
      await sendStep(chatId, convo.step, convo.answers);
      return;
    }
    convo.answers[key] = option;
  } else {
    convo.answers[key] = answerText;
  }
  convo.step++;

  if (convo.step < TRACKING_STEPS.length) {
    await sendStep(chatId, convo.step, convo.answers);
    return;
  }

  const i = dailyActivities.findIndex(a => a.date === convo.date);
  const existing = i !== -1 ? dailyActivities[i] : null;

  const saved = {
    ...existing,
    ...convo.answers,
    id: existing ? existing.id : generateId(),
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (i !== -1) dailyActivities[i] = saved;
  else dailyActivities.push(saved);
  saveFile(ACTIVITIES_FILE, dailyActivities);

  const guitar = saved.practicedGuitar ? '✅ Yes' : '❌ No';
  const planned = saved.plannedTomorrow ? '✅ Yes' : '❌ No';

  const summary =
    `✅ *Activity saved for ${formatDateNice(saved.date)}!*\n\n` +
    `🔁 Kegels: ${saved.kegel}\n` +
    `🛏️ Sleep: ${saved.sleepTime}\n` +
    `⏰ Wake up: ${saved.wakeUpTime}\n` +
    `💻 Laptop drop: ${saved.laptopDropTime}\n` +
    `🏋️ Gym or sports: ${saved.gymOrSports ? '✅ Yes' : '❌ No'}\n` +
    `🎸 Guitar: ${guitar}\n` +
    `📋 Planned tomorrow: ${planned}\n\n` +
    `📊 ${weekProgressLine()}\n\n` +
    `Type *history* to view past entries.`;

  await botSend(chatId, summary);
  conversations.delete(chatId);
}

async function handleBotMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const textLower = text.toLowerCase();

  if (text === '/start') {
    await botSend(chatId,
      '👋 Hey! I\'m your *Personal Tracker Bot*.\n\n' +
      'Just type:\n' +
      '• *log* — Log today\'s activities\n' +
      '• *history* — View last 7 days\n' +
      '• *week* — This week\'s gym or sports stats\n' +
      '• *cancel* — Cancel current tracking\n\n' +
      (LOCAL_REMINDERS_ENABLED ? 'I’ll send one reminder at 8 AM IST each day.' : '')
    );
    return;
  }

  if (textLower === 'log' || text === '/track') {
    await startTracking(chatId);
    return;
  }

  if (textLower === 'week' || text === '/week') {
    await botSend(chatId, `📊 ${weekProgressLine()}`);
    return;
  }

  if (textLower === 'history' || text === '/history') {
    const sorted = [...dailyActivities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    if (sorted.length === 0) {
      await botSend(chatId, '📭 No tracking data yet. Type *log* to start!');
      return;
    }
    let historyMsg = '📊 *Last 7 days:*\n';
    for (const a of sorted) {
      const active = gymOrSportsValue(a);
      const guitar = a.practicedGuitar ? '✅' : '❌';
      const planned = a.plannedTomorrow ? '✅' : '❌';
      historyMsg += `\n📅 *${formatDateNice(a.date)}*\n`;
      historyMsg += `  🔁 Kegels: ${a.kegel || '-'}\n`;
      historyMsg += `  🛏️ Sleep: ${a.sleepTime || '-'}\n`;
      historyMsg += `  ⏰ Wake: ${a.wakeUpTime || '-'}\n`;
      historyMsg += `  💻 Laptop: ${a.laptopDropTime || '-'}\n`;
      historyMsg += `  🏋️ Gym or sports: ${active === undefined ? '–' : active ? 'Yes' : 'No'}\n`;
      historyMsg += `  🎸 Guitar: ${guitar}\n`;
      historyMsg += `  📋 Planned: ${planned}\n`;
    }
    historyMsg += `\n${weekProgressLine()}`;
    await botSend(chatId, historyMsg);
    return;
  }

  if (textLower === 'cancel' || text === '/cancel') {
    if (conversations.has(chatId)) {
      conversations.delete(chatId);
      await botSend(chatId, '❌ Tracking cancelled.');
    } else {
      await botSend(chatId, 'Nothing to cancel.');
    }
    return;
  }

  const convo = conversations.get(chatId);
  if (convo) {
    await processAnswer(chatId, text);
  } else {
    await botSend(chatId, 'Type *log* to track today\'s activities.');
  }
}

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const answer = (query.data || '').match(/^track:(\d+):(.+)$/);
  await answerCallback(query.id);
  const convo = conversations.get(chatId);
  if (!convo || !answer || Number(answer[1]) !== convo.step) return;
  await processAnswer(chatId, answer[2]);
}

async function pollBot() {
  if (!BOT_TOKEN) return;
  try {
    const res = await axios.get(`${BOT_API}/getUpdates`, {
      params: { offset: botPollingOffset, timeout: 30 },
      timeout: 35000,
      proxy: false,
    });
    const updates = res.data.result || [];
    for (const update of updates) {
      botPollingOffset = update.update_id + 1;
      if (update.message) await handleBotMessage(update.message);
      else if (update.callback_query) await handleCallbackQuery(update.callback_query);
    }
  } catch (e) {
    console.error('Bot polling error:', e.message);
    await new Promise(r => setTimeout(r, 3000));
  }
  setImmediate(pollBot);
}

// =============================================
// STREAK HELPERS
// =============================================
function computeGuitarStreak() {
  const byDate = new Map(dailyActivities.map(a => [a.date, a]));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const check = new Date(Date.now() + (5.5 * 60 * 60 * 1000) - i * 24 * 60 * 60 * 1000);
    const ds = check.toISOString().split('T')[0];
    const a = byDate.get(ds);
    if (a && a.practicedGuitar) streak++;
    else break;
  }
  return streak;
}

// =============================================
// SUNDAY WEEKLY REPORT — clean & simple
// =============================================
async function sendSundayReport() {
  if (!CHAT_ID) return;
  const activeDays = weekStats();
  const guitarStreak = computeGuitarStreak();

  let verdict;
  if (activeDays >= 4) verdict = "Solid week. Keep this energy. 🔥";
  else if (activeDays >= 3) verdict = "Decent — but you missed the target. Tighten up next week. ⚠️";
  else verdict = "Weak week. No more excuses. Reset Monday. 💀";

  const msg =
    `📊 *Weekly Report*\n\n` +
    `🏋️ Gym or sports: ${activeDays}/4 days\n` +
    `🎸 Guitar streak: ${guitarStreak} days\n\n` +
    `${verdict}`;
  await sendTelegramMessage(msg);
}

// GitHub Actions handles production reminders. Standalone servers can opt in.
if (LOCAL_REMINDERS_ENABLED && BOT_TOKEN && CHAT_ID) {
  cron.schedule('30 2 * * *', async () => {
    const today = todayDateIST();
    const state = loadFile(BOT_STATE_FILE, {});
    if (state.dailyPromptDate === today || dailyActivities.some(a => a.date === today)) return;

    try {
      state.dailyPromptDate = today;
      fs.writeFileSync(BOT_STATE_FILE, JSON.stringify(state, null, 2) + '\n');
      await sendTelegramMessage('📋 Daily Tracker — type *log* to record today’s activities.');
    } catch (error) {
      console.error('Failed to claim daily tracker prompt:', error.message);
    }
  }, { timezone: 'Etc/UTC' });

  cron.schedule('0 17 * * 0', sendSundayReport, { timezone: 'Etc/UTC' });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🎯 Theme: ${currentThemeLine()}`);
  console.log(`💾 Data dir: ${DATA_DIR}`);
  console.log(`📊 Loaded: ${notes.length} notes, ${labels.length} labels, ${dailyActivities.length} activities`);
  if (BOT_TOKEN) {
    console.log('🤖 Telegram bot polling started...');
    if (LOCAL_REMINDERS_ENABLED && CHAT_ID) console.log('⏰ Daily 8 AM IST reminder active');
    pollBot();
  } else {
    console.log('⚠️ No TELEGRAM_BOT_TOKEN set, bot polling disabled');
  }
});
