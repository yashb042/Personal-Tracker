import { fetchActivitiesFromGithub, getGithubPat, setGithubPat } from './githubSync';

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
