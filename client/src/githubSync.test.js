import { TextEncoder } from 'util';
import { fetchActivitiesFromGithub, getGithubPat, pushActivitiesToGithub, setGithubPat } from './githubSync';

global.TextEncoder = TextEncoder;

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

test('trims stored GitHub tokens', () => {
  setGithubPat('  github_pat_test  \n');

  expect(getGithubPat()).toBe('github_pat_test');
});

test('loads activities through the raw contents API', async () => {
  const activities = [{ date: '2026-07-28', sportPlayed: '❌ No sport' }];
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => activities,
  });

  const result = await fetchActivitiesFromGithub('github_pat_test');

  expect(result).toEqual({ ok: true, activities });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/contents/data/activities.json'),
    expect.objectContaining({
      cache: 'no-store',
      headers: expect.objectContaining({
        Accept: 'application/vnd.github.raw+json',
      }),
    })
  );
});

test('saves activities without rewriting the scheduler state', async () => {
  setGithubPat('github_pat_test');
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'current' }) })
    .mockResolvedValueOnce({ ok: true });

  const result = await pushActivitiesToGithub([{ date: '2026-11-26', practicedGuitar: true }]);

  expect(result).toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenLastCalledWith(
    expect.stringContaining('/contents/data/activities.json'),
    expect.objectContaining({ method: 'PUT' })
  );
});
