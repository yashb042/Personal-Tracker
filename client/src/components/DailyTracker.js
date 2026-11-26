import React, { useState, useEffect, useCallback } from 'react';
import { getActivities, saveActivityWithCloudSync, syncActivitiesFromCloud } from '../storage';
import { defaultActivity, gymOrSportsValue } from '../activityFields';
import './DailyTracker.css';

const QUESTIONS = [
  {
    key: 'kegel',
    label: 'Did you do Kegels?',
    icon: '🔁',
    type: 'chips',
    options: [['Once', 'Twice', 'No']],
  },
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
    key: 'gymOrSports',
    label: 'Gym or sports today?',
    icon: '🏋️',
    type: 'yesno',
  },
  {
    key: 'practicedGuitar',
    label: 'Practice guitar?',
    icon: '🎸',
    type: 'yesno',
  },
  {
    key: 'plannedTomorrow',
    label: 'Plan for tomorrow?',
    icon: '📋',
    type: 'yesno',
  },
];

function normalizeForm(activity) {
  const form = defaultActivity(activity.date);
  for (const { key } of QUESTIONS) {
    const value = key === 'gymOrSports' ? gymOrSportsValue(activity) : activity[key];
    if (value != null && value !== '') form[key] = value;
  }
  return form;
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

function displayValue(value) {
  if (!value && value !== false) return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function DailyTracker() {
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [activities, setActivities] = useState([]);
  const [formData, setFormData] = useState(() => defaultActivity(today));
  const [saved, setSaved] = useState(false);
  const [todayExists, setTodayExists] = useState(false);
  const [view, setView] = useState('today');
  const [cloudSync, setCloudSync] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const isTelegramWebApp = typeof window !== 'undefined' && !!window.Telegram?.WebApp;

  const loadFromStorage = useCallback(() => {
    const all = getActivities();
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    setActivities(sorted);

    const todayActivity = sorted.find((a) => a.date === today);
    setTodayExists(Boolean(todayActivity));
    setFormData(todayActivity ? normalizeForm(todayActivity) : defaultActivity(today));
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
    const { cloud } = await saveActivityWithCloudSync(formData);
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
              timeZone: 'UTC',
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
                      timeZone: 'UTC',
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="popup-items">
                    {QUESTIONS.map((q) => {
                      const val = displayValue(
                        q.key === 'gymOrSports' ? gymOrSportsValue(activity) : activity[q.key]
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
