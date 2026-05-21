const REPO = 'yashb042/Personal-Tracker';
const BRANCH = 'master';
const ACTIVITIES_PATH = 'data/activities.json';
const BOT_STATE_PATH = 'data/bot-state.json';

export function getGithubPat() {
  try {
    return localStorage.getItem('pt_github_pat') || '';
  } catch {
    return '';
  }
}

export function setGithubPat(pat) {
  localStorage.setItem('pt_github_pat', pat || '');
}

function todayDateIST() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function apiHeaders(pat) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function getFileSha(path, headers) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, { headers });
  if (res.ok) {
    const meta = await res.json();
    return meta.sha;
  }
  if (res.status === 404) return null;
  throw new Error(`read_failed:${res.status}`);
}

async function putFile(path, content, message, headers) {
  const sha = await getFileSha(path, headers);
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const body = {
    message,
    content: toBase64Utf8(content),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `write_failed:${res.status}`);
  }
}

export async function fetchActivitiesFromGithub(pat) {
  const token = pat || getGithubPat();
  if (!token) return { ok: false, reason: 'no_pat', activities: [] };

  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${ACTIVITIES_PATH}?ref=${BRANCH}`;
    const res = await fetch(url, { headers: apiHeaders(token) });
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, activities: [] };
    const meta = await res.json();
    const json = JSON.parse(atob(meta.content.replace(/\s/g, '')));
    const activities = Array.isArray(json) ? json : [];
    return { ok: true, activities };
  } catch (e) {
    return { ok: false, reason: 'fetch_error', activities: [] };
  }
}

async function markTodayLoggedInBotState(headers) {
  let state = {
    botPollingOffset: 0,
    conversations: {},
    dailyNagState: { date: null, completed: false, nagCount: 0 },
  };
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${BOT_STATE_PATH}?ref=${BRANCH}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const meta = await res.json();
      state = JSON.parse(atob(meta.content.replace(/\s/g, '')));
    }
  } catch { /* use default */ }
  const today = todayDateIST();
  state.dailyNagState = { date: today, completed: true, nagCount: 0 };
  await putFile(
    BOT_STATE_PATH,
    JSON.stringify(state, null, 2) + '\n',
    'chore: mark daily log complete from tracker app',
    headers
  );
}

export async function pushActivitiesToGithub(activities) {
  const pat = getGithubPat();
  if (!pat) return { ok: false, reason: 'no_pat' };

  const headers = apiHeaders(pat);

  try {
    await putFile(
      ACTIVITIES_PATH,
      JSON.stringify(activities, null, 2) + '\n',
      'chore: update activities from tracker app',
      headers
    );
    await markTodayLoggedInBotState(headers);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message || 'write_failed' };
  }
}
