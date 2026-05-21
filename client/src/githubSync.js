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
  return btoa(unescape(encodeURIComponent(str)));
}

async function getFileSha(path, headers) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, { headers });
  if (res.ok) {
    const meta = await res.json();
    return meta.sha;
  }
  if (res.status === 404) return null;
  throw new Error('read_failed');
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
  if (!res.ok) throw new Error('write_failed');
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
      state = JSON.parse(atob(meta.content.replace(/\n/g, '')));
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

  const headers = {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    await putFile(
      ACTIVITIES_PATH,
      JSON.stringify(activities, null, 2) + '\n',
      'chore: update activities from tracker app',
      headers
    );
    await markTodayLoggedInBotState(headers);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'write_failed' };
  }
}
