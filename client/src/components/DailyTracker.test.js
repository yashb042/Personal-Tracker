import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import DailyTracker from './DailyTracker';
import { getActivities, saveActivityWithCloudSync, syncActivitiesFromCloud } from '../storage';

jest.mock('../storage', () => ({
  getActivities: jest.fn(),
  saveActivityWithCloudSync: jest.fn(),
  syncActivitiesFromCloud: jest.fn(),
}));

let container;
let root;

function istDate(offsetDays = 0) {
  return new Date(Date.now() + (5.5 + offsetDays * 24) * 3600000).toISOString().slice(0, 10);
}

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  saveActivityWithCloudSync.mockResolvedValue({ cloud: { ok: false, reason: 'no_pat' } });
  syncActivitiesFromCloud.mockResolvedValue({ synced: false });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

function selectedAnswers() {
  return Object.fromEntries(
    [...container.querySelectorAll('.question-row')].map((row) => [
      row.querySelector('.question-label span:nth-child(2)').textContent,
      row.querySelector('.selected')?.textContent.trim(),
    ])
  );
}

async function render(records) {
  getActivities.mockReturnValue(records);
  await act(async () => root.render(<DailyTracker />));
}

test('a new day uses its own defaults even when yesterday has different answers', async () => {
  await render([{ date: istDate(-1), sleepTime: '9 PM', practicedGuitar: false }]);
  expect(selectedAnswers()).toEqual({
    'Did you do Kegels?': 'No',
    'When did you sleep?': '11 PM',
    'When did you wake up?': '6:30 AM',
    'Laptop drop time?': '10 PM',
    'Gym or sports today?': '✅ Yes',
    'Practice guitar?': '✅ Yes',
    'Plan for tomorrow?': '❌ No',
  });

  const twice = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Twice');
  await act(async () => twice.click());
  await act(async () => container.querySelector('button[type="submit"]').click());
  expect(saveActivityWithCloudSync).toHaveBeenCalledWith({
    date: istDate(),
    kegel: 'Twice',
    sleepTime: '11 PM',
    wakeUpTime: '6:30 AM',
    laptopDropTime: '10 PM',
    gymOrSports: true,
    practicedGuitar: true,
    plannedTomorrow: false,
  });
});

test('today’s saved answers take precedence over defaults', async () => {
  await render([{
    date: istDate(),
    kegel: 'Once',
    sleepTime: '12 AM',
    wakeUpTime: '8 AM',
    laptopDropTime: '11 PM',
    gymOrSports: false,
    practicedGuitar: false,
    plannedTomorrow: true,
  }]);

  expect(selectedAnswers()).toEqual({
    'Did you do Kegels?': 'Once',
    'When did you sleep?': '12 AM',
    'When did you wake up?': '8 AM',
    'Laptop drop time?': '11 PM',
    'Gym or sports today?': '❌ No',
    'Practice guitar?': '❌ No',
    'Plan for tomorrow?': '✅ Yes',
  });
});
