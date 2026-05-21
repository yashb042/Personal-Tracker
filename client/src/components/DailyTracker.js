import React, { useState, useEffect, useCallback } from 'react';
import { getActivities, saveActivityWithCloudSync, syncActivitiesFromCloud } from '../storage';
import './DailyTracker.css';

const QUESTIONS = [
  {
    key: 'sleepTime',
    label: 'When did you sleep?',
    icon: '😴',
    type: 'chips',
    options: [
      ['9 PM', '9:30 PM', '10 PM', '10:30 PM'],
      ['11 PM', '11:30 PM', '12 AM', '12:30 AM'],
      ['1 AM', 'After 1 AM'],
    ],
  },
  {
    key: 'wakeUpTime',
    label: 'When did you wake up?',
    icon: '🌅',
    type: 'chips',
    options: [
      ['5 AM', '5:30 AM', '6 AM', '6:30 AM'],
      ['7 AM', '7:30 AM', '8 AM', '8:30 AM'],
      ['9 AM', 'After 9 AM'],
    ],
  },
  {
    key: 'laptopDropTime',
    label: 'Laptop drop time?',
    icon: '💻',
    type: 'chips',
    options: [
      ['9 PM', '9:30 PM', '10 PM', '10:30 PM'],
      ['11 PM', '11:30 PM', '12 AM', '12:30 AM'],
      ['1 AM', 'After 1 AM'],
    ],
  },
  {
    key: 'gymTime',
    label: 'Gym today?',
    icon: '🏋️',
    type: 'chips',
    options: [
      ['6 AM', '7 AM', '8 AM'],
      ['5 PM', '6 PM', '7 PM'],
      ['Other time', '❌ No gym today'],
    ],
  },
  {
    key: 'sportPlayed',
    label: 'Sport today?',
    icon: '🏃',
    type: 'chips',
    options: [
      ['⚽ Football', '🏏 Cricket', '🏸 Badminton'],
      ['🏊 Swimming', '🏃 Running', 'Other sport'],
      ['❌ No sport'],
    ],
  },
  {
    key: 'practicedGuitar',
    label: 'Practice guitar?',
    icon: '🎸',
    type: 'yesno',
  },
  {
    key: 'ateSweets',
    label: 'Eat sweets?',
    icon: '🍬',
    type: 'yesno',
  },
  {
    key: 'morningRoutine',
    label: 'Morning',
    icon: '🌅',
    type: 'chips',
    options: [
      ['Perfect morning', 'Opened Slack first'],
      ['Scrolled socials', 'Snoozed / lazy start'],
    ],
  },
  {
    key: 'plannedTomorrow',
    label: 'Plan for tomorrow?',
    icon: '📋',
    type: 'yesno',
  },
];

const EMPTY_FORM = (date) => ({
  date,
  sleepTime: '',
  wakeUpTime: '',
  laptopDropTime: '',
  gymTime: '',
  sportPlayed: '',
  practicedGuitar: false,
  ateSweets: false,
  morningRoutine: '',
  plannedTomorrow: false,
});

function normalizeMorningValue(value) {
  if (!value) return '';
  const v = String(value);
  if (/perfect/i.test(v)) return 'Perfect morning';
  if (/slack/i.test(v)) return 'Opened Slack first';
  if (/scroll|social/i.test(v)) return 'Scrolled socials';
  if (/snooz|lazy|bad/i.test(v) || value === true) return 'Snoozed / lazy start';
  return v.replace(/✅|📱|📺|🛏️/g, '').trim() || v;
}

function normalizeForm(activity) {
  if (!activity) return null;
  return {
    date: activity.date,
    sleepTime: activity.sleepTime || '',
    wakeUpTime: activity.wakeUpTime || '',
    laptopDropTime: activity.laptopDropTime || '',
    gymTime: activity.gymTime || '',
    sportPlayed: activity.sportPlayed || '',
    practicedGuitar: !!activity.practicedGuitar,
    ateSweets: !!activity.ateSweets,
    morningRoutine: normalizeMorningValue(
      activity.morningRoutine || (activity.fuckedMorning ? 'Snoozed / lazy start' : '')
    ),
    plannedTomorrow: !!activity.plannedTomorrow,
  };
}

function ChipOptions({ options, value, onChange }) {
  const rows = options || [];
  return (
    <div className="chip-grid">
      {rows.flat().map((opt) => (
        <button
          key={opt}
          type="button"
          className={`chip-btn ${value === opt ? 'selected' : ''}`}
          onClick={() => onChange(value === opt ? '' : opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function YesNoChips({ value, onChange }) {
  return (
    <div className="chip-grid chip-grid-compact">
      <button
        type="button"
        className={`chip-btn ${value === true ? 'selected' : ''}`}
        onClick={() => onChange(true)}
      >
        ✅ Yes
      </button>
      <button
        type="button"
        className={`chip-btn ${value === false ? 'selected' : ''}`}
        onClick={() => onChange(false)}
      >
        ❌ No
      </button>
    </div>
  );
}

function displayValue(key, value) {
  if (!value && value !== false) return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'gymTime' && /no/i.test(value)) return 'No gym';
  if (key === 'sportPlayed' && /no/i.test(value)) return 'No sport';
  return String(value);
}

function DailyTracker() {
  const today = new Date().toISOString().split('T')[0];
  const [activities, setActivities] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM(today));
  const [saved, setSaved] = useState(false);
  const [todayExists, setTodayExists] = useState(false);
  const [view, setView] = useState('today');
  const [cloudSync, setCloudSync] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const isTelegramWebApp = typeof window !== 'undefined' && !!window.Telegram?.WebApp;

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const loadFromStorage = useCallback(() => {
    const all = getActivities();
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    setActivities(sorted);

    const todayActivity = sorted.find((a) => a.date === today);
    const yesterdayActivity = sorted.find((a) => a.date === getYesterday());

    if (todayActivity) {
      setTodayExists(true);
      setFormData(normalizeForm(todayActivity));
    } else if (yesterdayActivity) {
      const y = normalizeForm(yesterdayActivity);
      setFormData({
        ...EMPTY_FORM(today),
        sleepTime: y.sleepTime,
        wakeUpTime: y.wakeUpTime,
        laptopDropTime: y.laptopDropTime,
        gymTime: '',
        sportPlayed: '',
        practicedGuitar: y.practicedGuitar,
        ateSweets: false,
        morningRoutine: '',
        plannedTomorrow: false,
      });
    } else {
      setTodayExists(false);
      setFormData(EMPTY_FORM(today));
    }
  }, [today]);

  const refreshFromCloud = useCallback(async () => {
    setSyncing(true);
    const r = await syncActivitiesFromCloud();
    loadFromStorage();
    setCloudSync(r.synced ? `synced-${r.source || 'cloud'}` : 'offline');
    setSyncing(false);
    return r;
  }, [loadFromStorage]);

  useEffect(() => {
    refreshFromCloud();
  }, [refreshFromCloud]);

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    const payload = {
      ...formData,
      morningRoutine: normalizeMorningValue(formData.morningRoutine),
    };
    delete payload.fuckedMorning;
    const { cloud } = await saveActivityWithCloudSync(payload);
    loadFromStorage();
    setSaved(true);
    setTodayExists(true);

    if (cloud.ok) {
      setSaveStatus('saved-cloud');
      if (isTelegramWebApp && window.Telegram?.WebApp?.close) {
        setTimeout(() => window.Telegram.WebApp.close(), 800);
      }
    } else if (cloud.reason === 'no_pat') {
      setSaveStatus('need-pat');
    } else {
      setSaveStatus(`failed:${cloud.reason || 'unknown'}`);
    }
    setTimeout(() => setSaved(false), 2500);
  };

  const canSave = QUESTIONS.every((q) => {
    if (q.type === 'yesno') return true;
    return !!formData[q.key];
  });

  return (
    <div className="tracker-container">
      <div className="tracker-header">
        <h2>Daily Check-in</h2>
        <div className="header-actions">
          <button
            type="button"
            className="toggle-btn refresh-btn"
            onClick={refreshFromCloud}
            disabled={syncing}
          >
            {syncing ? '…' : '↻'} Sync
          </button>
          <div className="view-toggle">
            <button
              type="button"
              className={`toggle-btn ${view === 'today' ? 'active' : ''}`}
              onClick={() => setView('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`toggle-btn ${view === 'history' ? 'active' : ''}`}
              onClick={() => {
                setView('history');
                refreshFromCloud();
              }}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {saveStatus === 'saved-cloud' && (
        <p className="status-banner success">Saved to GitHub — all devices will see this after Sync.</p>
      )}
      {saveStatus?.startsWith('failed:') && (
        <p className="status-banner error">Cloud save failed ({saveStatus.replace('failed:', '')}). Check token in Settings.</p>
      )}
      {saveStatus === 'need-pat' && (
        <p className="status-banner warn">Saved on this device only. Add GitHub token in Settings for cloud sync.</p>
      )}
      {cloudSync?.startsWith('synced') && saveStatus !== 'saved-cloud' && (
        <p className="status-banner muted">Loaded from GitHub ({cloudSync.replace('synced-', '')})</p>
      )}

      {view === 'today' ? (
        <div className="checkin-card">
          <div className="checkin-date">
            {new Date(today).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          {saved && <div className="save-toast">Saved!</div>}

          <form onSubmit={handleSubmit} className="checkin-form">
            {QUESTIONS.map((q) => (
              <div
                key={q.key}
                className={`question-row ${q.type === 'chips' ? 'question-row-stacked' : ''}`}
              >
                <div className="question-label">
                  <span className="question-icon">{q.icon}</span>
                  <span>{q.label}</span>
                </div>
                <div className="question-input">
                  {q.type === 'chips' && (
                    <ChipOptions
                      options={q.options}
                      value={formData[q.key]}
                      onChange={(v) => setField(q.key, v)}
                    />
                  )}
                  {q.type === 'yesno' && (
                    <YesNoChips
                      value={formData[q.key]}
                      onChange={(v) => setField(q.key, v)}
                    />
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={!canSave || saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving…' : todayExists ? 'Update' : 'Save'}
            </button>
          </form>

          <p className="prefill-hint">Tap one option per row. Sleep & wake use quick picks like Telegram.</p>
        </div>
      ) : (
        <div className="history-container">
          <h3>Activity History</h3>
          {activities.length > 0 ? (
            <div className="history-grid">
              {activities.map((activity) => (
                <div key={activity.id || activity.date} className="history-popup fade-in">
                  <div className="popup-date">
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="popup-items">
                    {QUESTIONS.map((q) => {
                      const raw =
                        q.key === 'morningRoutine'
                          ? activity.morningRoutine || (activity.fuckedMorning ? 'Snoozed / lazy start' : '')
                          : activity[q.key];
                      const val = displayValue(
                        q.key,
                        q.key === 'morningRoutine' ? normalizeMorningValue(raw) : raw
                      );
                      if (!val) return null;
                      return (
                        <div key={q.key} className="popup-item">
                          <span className="popup-icon">{q.icon}</span>
                          <span className="popup-value">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4>No history yet</h4>
              <p>Log today, then tap Sync.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DailyTracker;
