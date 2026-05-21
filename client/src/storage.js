// Static storage for GitHub Pages + optional instant GitHub API sync (Telegram Web App).

import { pushActivitiesToGithub, fetchActivitiesFromGithub, getGithubPat } from './githubSync';

const REMOTE_ACTIVITIES_URL =
  'https://raw.githubusercontent.com/yashb042/Personal-Tracker/master/data/activities.json';

const STORAGE_KEYS = {
  notes: 'pt_notes',
  labels: 'pt_labels',
  activities: 'pt_activities',
  settings: 'pt_notification_settings',
};

function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

// ── Notes ─────────────────────────────────────────────
export function getNotes() {
  return load(STORAGE_KEYS.notes, []);
}

export function createNote({ title, content, labelIds }) {
  const notes = getNotes();
  const note = {
    id: generateId(),
    title,
    content,
    labelIds: labelIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.push(note);
  save(STORAGE_KEYS.notes, notes);
  return note;
}

export function updateNote(id, { title, content, labelIds }) {
  const notes = getNotes();
  const i = notes.findIndex((n) => n.id === id);
  if (i === -1) return null;
  notes[i] = {
    ...notes[i],
    title,
    content,
    labelIds: labelIds || [],
    updatedAt: new Date().toISOString(),
  };
  save(STORAGE_KEYS.notes, notes);
  return notes[i];
}

export function deleteNote(id) {
  const notes = getNotes().filter((n) => n.id !== id);
  save(STORAGE_KEYS.notes, notes);
}

// ── Labels ────────────────────────────────────────────
export function getLabels() {
  return load(STORAGE_KEYS.labels, []);
}

export function createLabel({ name, color }) {
  const labels = getLabels();
  const label = {
    id: generateId(),
    name,
    color,
    createdAt: new Date().toISOString(),
  };
  labels.push(label);
  save(STORAGE_KEYS.labels, labels);
  return label;
}

export function updateLabel(id, { name, color }) {
  const labels = getLabels();
  const i = labels.findIndex((l) => l.id === id);
  if (i === -1) return null;
  labels[i] = { ...labels[i], name, color };
  save(STORAGE_KEYS.labels, labels);
  return labels[i];
}

export function deleteLabel(id) {
  // Remove label from all notes that reference it
  const notes = getNotes().map((n) => ({
    ...n,
    labelIds: (n.labelIds || []).filter((lid) => lid !== id),
  }));
  save(STORAGE_KEYS.notes, notes);

  const labels = getLabels().filter((l) => l.id !== id);
  save(STORAGE_KEYS.labels, labels);
}

// ── Activities ────────────────────────────────────────
export function getActivities() {
  return load(STORAGE_KEYS.activities, []);
}

function normalizeMorningValue(value) {
  if (!value) return '';
  const v = String(value);
  if (/perfect/i.test(v)) return 'Perfect morning';
  if (/slack/i.test(v)) return 'Opened Slack first';
  if (/scroll|social/i.test(v)) return 'Scrolled socials';
  if (/snooz|lazy|bad/i.test(v) || value === true) return 'Snoozed / lazy start';
  return v.replace(/✅|📱|📺|🛏️/g, '').trim() || v;
}

function normalizeActivity(a) {
  if (!a) return a;
  const out = { ...a };
  out.morningRoutine = normalizeMorningValue(
    out.morningRoutine || (out.fuckedMorning ? 'Snoozed / lazy start' : '')
  );
  delete out.fuckedMorning;
  return out;
}

/** Load latest activities from GitHub into localStorage. */
export async function syncActivitiesFromCloud() {
  const pat = getGithubPat();
  if (pat) {
    const api = await fetchActivitiesFromGithub(pat);
    if (api.ok) {
      const normalized = api.activities.map(normalizeActivity);
      save(STORAGE_KEYS.activities, normalized);
      return { synced: true, count: normalized.length, source: 'api' };
    }
  }

  const local = getActivities();
  try {
    const res = await fetch(`${REMOTE_ACTIVITIES_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { synced: false, count: local.length };
    const remote = await res.json();
    if (!Array.isArray(remote)) return { synced: false, count: local.length };

    const normalized = remote.map(normalizeActivity);
    save(STORAGE_KEYS.activities, normalized);
    return { synced: true, count: normalized.length, source: 'cdn' };
  } catch {
    return { synced: false, count: local.length };
  }
}

export function saveActivity(data) {
  const activities = getActivities();
  const existing = activities.findIndex((a) => a.date === data.date);
  const { fuckedMorning, ...rest } = data;
  const entry = {
    ...(existing !== -1 ? activities[existing] : {}),
    ...rest,
    morningRoutine: normalizeMorningValue(rest.morningRoutine ?? (fuckedMorning ? 'Snoozed / lazy start' : '')),
    id: existing !== -1 ? activities[existing].id : generateId(),
    updatedAt: new Date().toISOString(),
  };
  delete entry.fuckedMorning;
  if (existing !== -1) {
    activities[existing] = entry;
  } else {
    activities.push(entry);
  }
  save(STORAGE_KEYS.activities, activities);
  return entry;
}

/** Save locally, push to GitHub, then reload from API so UI matches repo. */
export async function saveActivityWithCloudSync(data) {
  const normalized = normalizeActivity(data);
  const entry = saveActivity(normalized);
  const activities = getActivities();
  const cloud = await pushActivitiesToGithub(activities);

  if (cloud.ok && getGithubPat()) {
    const fresh = await fetchActivitiesFromGithub();
    if (fresh.ok) {
      save(STORAGE_KEYS.activities, fresh.activities.map(normalizeActivity));
    }
  }

  return { entry: getActivities().find((a) => a.date === normalized.date) || entry, cloud };
}

// ── Notification Settings ─────────────────────────────
const DEFAULT_SETTINGS = {
  enabled: false,
  time: '09:00',
  method: 'telegram',
  message: "Good morning! Don't forget to log your activities today! 🌟",
};

export function getNotificationSettings() {
  return load(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveNotificationSettings(settings) {
  save(STORAGE_KEYS.settings, settings);
  return settings;
}

// ── Data Export / Import (bonus for static version) ───
export function exportAllData() {
  return {
    notes: getNotes(),
    labels: getLabels(),
    activities: getActivities(),
    settings: getNotificationSettings(),
    exportedAt: new Date().toISOString(),
  };
}

export function importAllData(data) {
  if (data.notes) save(STORAGE_KEYS.notes, data.notes);
  if (data.labels) save(STORAGE_KEYS.labels, data.labels);
  if (data.activities) save(STORAGE_KEYS.activities, data.activities);
  if (data.settings) save(STORAGE_KEYS.settings, data.settings);
}
