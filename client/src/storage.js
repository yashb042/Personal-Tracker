// localStorage-based storage layer — replaces the Express API backend
// so the app can run as a fully static site (GitHub Pages, etc.)

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

export function saveActivity(data) {
  const activities = getActivities();
  const existing = activities.findIndex((a) => a.date === data.date);
  const entry = {
    ...(existing !== -1 ? activities[existing] : {}),
    ...data,
    id: existing !== -1 ? activities[existing].id : generateId(),
    updatedAt: new Date().toISOString(),
  };
  if (existing !== -1) {
    activities[existing] = entry;
  } else {
    activities.push(entry);
  }
  save(STORAGE_KEYS.activities, activities);
  return entry;
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
