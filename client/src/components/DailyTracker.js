import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './DailyTracker.css';

function DailyTracker() {
  const [activities, setActivities] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sleepTime: '',
    wakeUpTime: '',
    laptopDropTime: '',
    gymTime: '',
    practicedGuitar: false,
  });
  const [saved, setSaved] = useState(false);
  const [todayExists, setTodayExists] = useState(false);
  const [view, setView] = useState('today');

  const fieldRefs = useRef([]);

  const today = new Date().toISOString().split('T')[0];

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const fetchActivities = useCallback(async () => {
    try {
      const response = await axios.get('/api/activities');
      const sorted = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setActivities(sorted);

      const todayActivity = sorted.find(a => a.date === today);
      const yesterdayActivity = sorted.find(a => a.date === getYesterday());

      if (todayActivity) {
        setTodayExists(true);
        setFormData({
          date: today,
          sleepTime: todayActivity.sleepTime || '',
          wakeUpTime: todayActivity.wakeUpTime || '',
          laptopDropTime: todayActivity.laptopDropTime || '',
          gymTime: todayActivity.gymTime || '',
          practicedGuitar: todayActivity.practicedGuitar || false,
        });
      } else if (yesterdayActivity) {
        // Prefill from yesterday
        setFormData({
          date: today,
          sleepTime: yesterdayActivity.sleepTime || '',
          wakeUpTime: yesterdayActivity.wakeUpTime || '',
          laptopDropTime: yesterdayActivity.laptopDropTime || '',
          gymTime: yesterdayActivity.gymTime || '',
          practicedGuitar: yesterdayActivity.practicedGuitar || false,
        });
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, [today]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Focus first field on mount
  useEffect(() => {
    if (view === 'today' && fieldRefs.current[0]) {
      fieldRefs.current[0].focus();
    }
  }, [view]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index < fieldRefs.current.length - 1) {
        fieldRefs.current[index + 1]?.focus();
      } else {
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/activities', formData);
      setSaved(true);
      setTodayExists(true);
      fetchActivities();
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const questions = [
    { key: 'sleepTime', label: 'When did you sleep?', icon: '😴', type: 'time' },
    { key: 'wakeUpTime', label: 'When did you wake up?', icon: '🌅', type: 'time' },
    { key: 'laptopDropTime', label: 'What time did you drop laptop?', icon: '💻', type: 'time' },
    { key: 'gymTime', label: 'What time did you go to gym?', icon: '🏋️', type: 'time' },
    { key: 'practicedGuitar', label: 'Did you practice guitar?', icon: '🎸', type: 'boolean' },
  ];

  const formatTime12 = (time24) => {
    if (!time24) return '--:--';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="tracker-container">
      <div className="tracker-header">
        <h2>Daily Check-in</h2>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'today' ? 'active' : ''}`}
            onClick={() => setView('today')}
          >
            Today
          </button>
          <button
            className={`toggle-btn ${view === 'history' ? 'active' : ''}`}
            onClick={() => setView('history')}
          >
            History
          </button>
        </div>
      </div>

      {view === 'today' ? (
        <div className="checkin-card">
          <div className="checkin-date">
            {new Date(today).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </div>

          {saved && (
            <div className="save-toast">Saved!</div>
          )}

          <form onSubmit={handleSubmit} className="checkin-form">
            {questions.map((q, index) => (
              <div key={q.key} className="question-row">
                <div className="question-label">
                  <span className="question-icon">{q.icon}</span>
                  <span>{q.label}</span>
                </div>
                <div className="question-input">
                  {q.type === 'time' ? (
                    <input
                      ref={el => fieldRefs.current[index] = el}
                      type="time"
                      value={formData[q.key]}
                      onChange={(e) => setFormData({ ...formData, [q.key]: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="time-input"
                      tabIndex={index + 1}
                    />
                  ) : (
                    <div className="toggle-switch-wrapper">
                      <button
                        ref={el => fieldRefs.current[index] = el}
                        type="button"
                        className={`toggle-pill ${formData[q.key] ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, [q.key]: !formData[q.key] })}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            if (e.key === ' ') {
                              setFormData({ ...formData, [q.key]: !formData[q.key] });
                            } else {
                              handleKeyDown(e, index);
                            }
                          }
                        }}
                        tabIndex={index + 1}
                        role="switch"
                        aria-checked={formData[q.key]}
                      >
                        <span className="pill-label">{formData[q.key] ? 'Yes' : 'No'}</span>
                        <span className="pill-thumb" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary btn-submit" tabIndex={questions.length + 1}>
              {todayExists ? 'Update' : 'Save'}
            </button>
          </form>

          <p className="prefill-hint">
            Values prefilled from yesterday. Tab through and update.
          </p>
        </div>
      ) : (
        <div className="history-container">
          <h3>Activity History</h3>
          {activities.length > 0 ? (
            <div className="history-grid">
              {activities.map(activity => (
                <div key={activity.id} className="history-popup fade-in">
                  <div className="popup-date">
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })}
                  </div>
                  <div className="popup-items">
                    {activity.sleepTime && (
                      <div className="popup-item">
                        <span className="popup-icon">😴</span>
                        <span className="popup-value">{formatTime12(activity.sleepTime)}</span>
                      </div>
                    )}
                    {activity.wakeUpTime && (
                      <div className="popup-item">
                        <span className="popup-icon">🌅</span>
                        <span className="popup-value">{formatTime12(activity.wakeUpTime)}</span>
                      </div>
                    )}
                    {activity.laptopDropTime && (
                      <div className="popup-item">
                        <span className="popup-icon">💻</span>
                        <span className="popup-value">{formatTime12(activity.laptopDropTime)}</span>
                      </div>
                    )}
                    {activity.gymTime && (
                      <div className="popup-item">
                        <span className="popup-icon">🏋️</span>
                        <span className="popup-value">{formatTime12(activity.gymTime)}</span>
                      </div>
                    )}
                    {activity.practicedGuitar && (
                      <div className="popup-item popup-item-guitar">
                        <span className="popup-icon">🎸</span>
                        <span className="popup-value">Yes</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4>No history yet</h4>
              <p>Start logging to see your daily patterns.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DailyTracker;
