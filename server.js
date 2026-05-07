const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
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
  const {
    date, sleepTime, wakeUpTime, laptopDropTime, gymTime, sportPlayed,
    practicedGuitar, ateSweets, morningRoutine, plannedTomorrow,
  } = req.body;

  const i = dailyActivities.findIndex(a => a.date === date);
  const activity = {
    id: i !== -1 ? dailyActivities[i].id : generateId(),
    date,
    sleepTime: sleepTime || '',
    wakeUpTime: wakeUpTime || '',
    laptopDropTime: laptopDropTime || '',
    gymTime: gymTime || '',
    sportPlayed: sportPlayed || '',
    practicedGuitar: practicedGuitar || false,
    ateSweets: ateSweets || false,
    morningRoutine: morningRoutine || '',
    plannedTomorrow: plannedTomorrow || false,
    createdAt: i !== -1 ? dailyActivities[i].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (i !== -1) dailyActivities[i] = activity;
  else dailyActivities.push(activity);
  saveFile(ACTIVITIES_FILE, dailyActivities);

  // Stop hourly nagging if today's entry was submitted
  if (typeof markNagComplete === 'function' && date === todayDateIST()) {
    markNagComplete();
  }

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
const MOTIVATIONAL_POOL = [
  // Harsh
  "You paid for that gym membership. Use it or lose it.",
  "Excuses don't burn calories. Move.",
  "Skipping today is stealing from tomorrow's you.",
  "Comfort is a slow death. Get up.",
  "You don't get the body of someone who 'didn't feel like it'.",
  "Stop scrolling. Start sweating.",
  "Soft choices today, soft body tomorrow.",
  // Funny
  "Your muscles are filing a missing person report.",
  "Your dumbbells are gathering dust and judging you.",
  "Even your couch is asking for a day off from you.",
  "Your gym shoes haven't seen sunlight in days. Sad.",
  "Your protein shake is single and looking for a workout.",
  "Plot twist: the gym actually exists when you go.",
  // Stats / time
  () => `You have ${daysUntilTarget()} days till July 31. That's ${Math.floor(daysUntilTarget() * 4 / 7)} more gym sessions if you go 4x/week. Don't waste them.`,
  () => `${daysUntilTarget()} days left. Each one you skip is a rep your future self has to do twice.`,
  () => `If you skip today, you've used ${(((daysUntilTarget()) / 365) * 100).toFixed(0)}% less of your runway than yesterday.`,
  "30 minutes. That's it. You spend more time on Instagram.",
  // Philosophical
  "Discipline is choosing between what you want now and what you want most.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Motivation gets you started. Habit keeps you going.",
  "What you do today echoes through your next decade.",
  // Competitive
  "Someone out there is training while you're on the couch. Catch up.",
  "Your competition just finished their second set. What about you?",
  "Every day you skip, someone else is gaining ground.",
  "There's a version of you out there who didn't quit. Be him.",
  // Identity
  "You are what you repeatedly do. Right now, what are you?",
  "Show up enough times and 'I'm a guy who trains' becomes true.",
  "Champions show up on the days they don't feel like it. That's literally the difference.",
  // Brutal honesty
  "You said this year would be different. It's halfway over. Prove it.",
  "Nobody's going to do this for you. Get up.",
  "You're not tired. You're undisciplined. There's a difference.",
  "The gym doesn't care about your mood. Go anyway.",
  "Pretty soon 'one day' becomes 'never'.",
];

function getRandomMotivation() {
  const item = MOTIVATIONAL_POOL[Math.floor(Math.random() * MOTIVATIONAL_POOL.length)];
  return typeof item === 'function' ? item() : item;
}

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
const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
let botPollingOffset = 0;

const conversations = new Map();

const TRACKING_STEPS = [
  {
    key: 'sleepTime',
    question: '🛏️ What time did you sleep last night?',
    type: 'buttons',
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
    type: 'buttons',
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
    type: 'buttons',
    options: [
      ['5 PM', '5:30 PM', '6 PM'],
      ['6:30 PM', '7 PM', '7:30 PM'],
      ['8 PM', '9 PM', '10 PM'],
      ['After 10 PM'],
    ],
  },
  {
    key: 'gymTime',
    question: '🏋️ Did you go to the gym? If yes, what time?',
    type: 'buttons',
    options: [
      ['6 AM', '7 AM', '8 AM'],
      ['5 PM', '6 PM', '7 PM'],
      ['Other time'],
      ['❌ No gym today'],
    ],
  },
  {
    key: 'sportPlayed',
    question: '🏃 Did you play any sport today?',
    type: 'buttons',
    options: [
      ['⚽ Football', '🏏 Cricket'],
      ['🏸 Badminton', '🏊 Swimming'],
      ['🏃 Running', 'Other sport'],
      ['❌ No sport'],
    ],
  },
  {
    key: 'practicedGuitar',
    question: '🎸 Did you practice guitar today?',
    type: 'buttons',
    options: [['✅ Yes', '❌ No']],
  },
  {
    key: 'ateSweets',
    question: '🍬 Did you eat sweets today?',
    type: 'buttons',
    options: [['✅ Yes', '❌ No']],
  },
  {
    key: 'morningRoutine',
    question: '🌅 How did your morning go?',
    type: 'buttons',
    options: [
      ['✅ Perfect morning', '📱 Opened Slack first'],
      ['📺 Scrolled socials', '🛏️ Snoozed/lazy start'],
      ['Other'],
    ],
  },
  {
    key: 'plannedTomorrow',
    question: '📋 Did you plan stuff for tomorrow?',
    type: 'buttons',
    options: [['✅ Yes', '❌ No']],
  },
];

const BOOLEAN_KEYS = new Set(['practicedGuitar', 'plannedTomorrow', 'ateSweets']);

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
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function buildInlineKeyboard(options) {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: options.map(row => row.map(text => ({ text, callback_data: `track_${text}` }))),
    }),
  };
}

async function sendStep(chatId, stepIndex) {
  const step = TRACKING_STEPS[stepIndex];
  if (step.type === 'buttons') {
    await botSend(chatId, step.question, buildInlineKeyboard(step.options));
  } else {
    await botSend(chatId, step.question);
  }
}

async function startTracking(chatId) {
  const date = todayDateIST();
  conversations.set(chatId, { step: 0, answers: {}, date });
  const intro =
    `${currentThemeLine()}\n\n` +
    `📋 *Daily Tracker — ${formatDateNice(date)}*\n\n` +
    `Let's go through your day, one question at a time.`;
  await botSend(chatId, intro);
  await new Promise(r => setTimeout(r, 500));
  await sendStep(chatId, 0);
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
  const week = dailyActivities.filter(a => weekSet.has(a.date));
  const gymDays = week.filter(a => a.gymTime && !/no/i.test(a.gymTime)).length;
  const sportDays = week.filter(a => a.sportPlayed && !/^❌|^no/i.test(a.sportPlayed)).length;
  return { gymDays, sportDays, weekCount: week.length };
}

function weekProgressLine() {
  const { gymDays, sportDays } = weekStats();
  const gymStatus = gymDays >= 4 ? '✅' : gymDays >= 2 ? '⚠️' : '💀';
  const sportStatus = sportDays >= 2 ? '✅' : sportDays >= 1 ? '⚠️' : '💀';
  return `This week: ${gymDays}/4 gym days ${gymStatus} | ${sportDays}/2 sport days ${sportStatus}`;
}

async function processAnswer(chatId, answerText) {
  const convo = conversations.get(chatId);
  if (!convo) return;

  const currentStep = TRACKING_STEPS[convo.step];

  // Handle "Other" follow-up for morningRoutine
  if (convo.awaitingFreeText === 'morningRoutine') {
    convo.answers.morningRoutine = answerText;
    convo.awaitingFreeText = null;
    convo.step++;
    if (convo.step < TRACKING_STEPS.length) {
      await sendStep(chatId, convo.step);
      return;
    }
    // fall through to save
  } else if (currentStep.key === 'morningRoutine' && /other/i.test(answerText)) {
    convo.awaitingFreeText = 'morningRoutine';
    await botSend(chatId, '✍️ Type what you did this morning:');
    return;
  } else if (BOOLEAN_KEYS.has(currentStep.key)) {
    convo.answers[currentStep.key] = /yes|✅/i.test(answerText);
    convo.step++;
  } else if (currentStep.key === 'gymTime' && /no|❌/i.test(answerText)) {
    convo.answers[currentStep.key] = 'No';
    convo.step++;
  } else if (currentStep.key === 'sportPlayed' && /no|❌/i.test(answerText)) {
    convo.answers[currentStep.key] = 'No';
    convo.step++;
  } else {
    convo.answers[currentStep.key] = answerText;
    convo.step++;
  }

  if (convo.step < TRACKING_STEPS.length) {
    await sendStep(chatId, convo.step);
    return;
  }

  const i = dailyActivities.findIndex(a => a.date === convo.date);
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
  saveFile(ACTIVITIES_FILE, dailyActivities);

  const guitar = saved.practicedGuitar ? '✅ Yes' : '❌ No';
  const sweets = saved.ateSweets ? '✅ Yes' : '❌ No';
  const morning = saved.morningRoutine || '-';
  const planned = saved.plannedTomorrow ? '✅ Yes' : '❌ No';
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
    `🌅 Morning: ${morning}\n` +
    `📋 Planned tomorrow: ${planned}\n\n` +
    `📊 ${weekProgressLine()}\n\n` +
    `Type *history* to view past entries.`;

  await botSend(chatId, summary);
  conversations.delete(chatId);

  // Stop hourly nagging — today is logged
  markNagComplete();
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
      '• *week* — This week\'s gym/sport stats\n' +
      '• *cancel* — Cancel current tracking\n\n' +
      'I\'ll ping you every day at 8 AM IST to log (and keep nagging hourly till you do).'
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
      const guitar = a.practicedGuitar ? '✅' : '❌';
      const sweets = a.ateSweets ? '✅' : '❌';
      const morning = a.morningRoutine || '-';
      const planned = a.plannedTomorrow ? '✅' : '❌';
      const sport = a.sportPlayed && a.sportPlayed !== 'No' ? a.sportPlayed : '❌';
      historyMsg += `\n📅 *${formatDateNice(a.date)}*\n`;
      historyMsg += `  🛏️ Sleep: ${a.sleepTime || '-'}\n`;
      historyMsg += `  ⏰ Wake: ${a.wakeUpTime || '-'}\n`;
      historyMsg += `  💻 Laptop: ${a.laptopDropTime || '-'}\n`;
      historyMsg += `  🏋️ Gym: ${a.gymTime || '-'}\n`;
      historyMsg += `  🏃 Sport: ${sport}\n`;
      historyMsg += `  🎸 Guitar: ${guitar}\n`;
      historyMsg += `  🍬 Sweets: ${sweets}\n`;
      historyMsg += `  🌅 Morning: ${morning}\n`;
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
  const data = (query.data || '').replace(/^track_/, '');
  await answerCallback(query.id);
  const convo = conversations.get(chatId);
  if (!convo) return;
  await processAnswer(chatId, data);
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
  const weekSet = new Set(currentWeekDates());
  const week = dailyActivities.filter(a => weekSet.has(a.date));
  const gymDays = week.filter(a => a.gymTime && !/no/i.test(a.gymTime)).length;
  const sportDays = week.filter(a => a.sportPlayed && !/^❌|^no/i.test(a.sportPlayed)).length;
  const sweetsCount = week.filter(a => a.ateSweets).length;
  const perfectMornings = week.filter(a => /perfect/i.test(a.morningRoutine)).length;
  const guitarStreak = computeGuitarStreak();

  let verdict;
  if (gymDays >= 4 && sportDays >= 2) verdict = "Solid week. Keep this energy. 🔥";
  else if (gymDays >= 3) verdict = "Decent — but you missed the target. Tighten up next week. ⚠️";
  else verdict = "Weak week. No more excuses. Reset Monday. 💀";

  const msg =
    `📊 *Weekly Report*\n\n` +
    `🏋️ Gym: ${gymDays}/4 days\n` +
    `🏃 Sports: ${sportDays}/2 days\n` +
    `🎸 Guitar streak: ${guitarStreak} days\n` +
    `🍬 Sweets: ${sweetsCount} days\n` +
    `🌅 Perfect mornings: ${perfectMornings}/7\n\n` +
    `${verdict}`;
  await sendTelegramMessage(msg);
}

// =============================================
// SMART REMINDERS
// =============================================
async function sendMidweekCheck() {
  if (!CHAT_ID) return;
  const { gymDays } = weekStats();
  if (gymDays < 2) {
    const msg = `💀 It's Wednesday and you've only hit the gym ${gymDays} time${gymDays === 1 ? '' : 's'}. You need ${4 - gymDays} more this week. Stop slacking.`;
    await sendTelegramMessage(msg);
  }
}

async function sendFridayPush() {
  if (!CHAT_ID) return;
  const { gymDays, sportDays } = weekStats();
  if (gymDays < 3) {
    const msg = `🚨 Friday alert. Gym days this week: ${gymDays}/4. Sports: ${sportDays}/2. Weekend is your last chance. Don't blow it.`;
    await sendTelegramMessage(msg);
  }
}

async function sendRandomMidday() {
  if (!CHAT_ID) return;
  // Pick a deterministic day for this week (Mon=1..Fri=5) based on week-of-year so it varies but is reproducible
  const ist = istNow();
  const start = new Date(Date.UTC(ist.getUTCFullYear(), 0, 1));
  const weekOfYear = Math.floor((ist.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const chosenDow = (weekOfYear % 5) + 1; // 1..5
  const todayDow = ist.getUTCDay();
  if (todayDow !== chosenDow) return;
  await sendTelegramMessage(`💭 ${getRandomMotivation()}`);
}

// =============================================
// CRON SCHEDULES (UTC; IST = UTC+5:30)
// =============================================

// Nag state — tracks whether today's log has been completed
let dailyNagState = {
  date: null,       // YYYY-MM-DD that's being nagged for
  completed: false,  // true once tracking is done for this date
  nagCount: 0,       // how many nag messages sent today
};

function markNagComplete() {
  dailyNagState.completed = true;
  console.log(`✅ Daily nag marked complete for ${dailyNagState.date}`);
}

function isTodayLogged() {
  const today = todayDateIST();
  // Check if activity exists for today
  if (dailyActivities.find(a => a.date === today)) return true;
  // Check nag state
  if (dailyNagState.date === today && dailyNagState.completed) return true;
  return false;
}

// Daily 8 AM IST = 02:30 UTC — first prompt
cron.schedule('30 2 * * *', async () => {
  if (BOT_TOKEN && CHAT_ID) {
    const today = todayDateIST();
    dailyNagState = { date: today, completed: false, nagCount: 1 };
    console.log('⏰ 8 AM IST auto-prompt triggered');
    await startTracking(parseInt(CHAT_ID));
  }
});

// Hourly follow-ups: 9 AM, 10 AM, 11 AM, 12 PM, 1 PM, ... up to 10 PM IST
// = 03:30, 04:30, 05:30, 06:30, 07:30, ... 16:30 UTC
cron.schedule('30 3-16 * * *', async () => {
  if (!BOT_TOKEN || !CHAT_ID) return;
  if (isTodayLogged()) return;
  
  dailyNagState.nagCount++;
  const hour = dailyNagState.nagCount;
  
  // Vary the message style
  const nagMessages = [
    `⏰ Reminder #${hour}: Log your day. Type *log*.`,
    `👀 Still waiting on today's log...`,
    `${currentThemeLine()}\n\nYou haven't logged today. Type *log*.`,
    `🔔 Hey. The tracker is waiting. Just type *log*.`,
    `💀 ${hour} hours since first reminder. Log. Your. Day.`,
    `📋 Quick reminder — type *log* to track today.`,
    `${getRandomMotivation()}\n\n...and log your day. Type *log*.`,
  ];
  const msg = nagMessages[Math.floor(Math.random() * nagMessages.length)];
  await sendTelegramMessage(msg);
  console.log(`🔔 Hourly nag #${hour} sent`);
});

// Wednesday 8 PM IST = 14:30 UTC Wed
cron.schedule('30 14 * * 3', async () => {
  console.log('⏰ Wednesday midweek check');
  await sendMidweekCheck();
});

// Friday 8 PM IST = 14:30 UTC Fri
cron.schedule('30 14 * * 5', async () => {
  console.log('⏰ Friday push');
  await sendFridayPush();
});

// Sunday 10:30 PM IST = 17:00 UTC Sun
cron.schedule('0 17 * * 0', async () => {
  console.log('⏰ Sunday weekly report');
  await sendSundayReport();
});

// Random midday motivation: daily at 1 PM IST = 7:30 UTC, but only fires on chosen weekday
cron.schedule('30 7 * * *', async () => {
  await sendRandomMidday();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🎯 Theme: ${currentThemeLine()}`);
  console.log(`💾 Data dir: ${DATA_DIR}`);
  console.log(`📊 Loaded: ${notes.length} notes, ${labels.length} labels, ${dailyActivities.length} activities`);
  if (BOT_TOKEN) {
    console.log('🤖 Telegram bot polling started...');
    console.log('⏰ Daily 8 AM IST + hourly nags + smart reminders active');
    pollBot();
  } else {
    console.log('⚠️ No TELEGRAM_BOT_TOKEN set, bot polling disabled');
  }
});
