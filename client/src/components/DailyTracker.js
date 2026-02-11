import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DailyTracker.css';

function DailyTracker() {
  const [activities, setActivities] = useState([]);
  const [todayActivity, setTodayActivity] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    wakeUpTime: '',
    wentToGym: false,
    outsideFoodEaten: false,
    notes: ''
  });
  const [view, setView] = useState('today'); // 'today' or 'history'

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const activity = activities.find(a => a.date === today);
    if (activity) {
      setTodayActivity(activity);
      setFormData({
        date: activity.date,
        wakeUpTime: activity.wakeUpTime || '',
        wentToGym: activity.wentToGym || false,
        outsideFoodEaten: activity.outsideFoodEaten || false,
        notes: activity.notes || ''
      });
    } else {
      setTodayActivity(null);
    }
  }, [activities]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/api/activities');
      setActivities(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/activities', formData);
      fetchActivities();
      alert('Activity logged successfully! 🎉');
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error saving activity');
    }
  };

  const getStreak = () => {
    let streak = 0;
    const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

    for (let i = 0; i < sortedActivities.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (sortedActivities[i]?.date === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getStats = () => {
    const last7Days = activities.slice(0, 7);
    const gymDays = last7Days.filter(a => a.wentToGym).length;
    const cleanDays = last7Days.filter(a => !a.outsideFoodEaten).length;
    const avgWakeTime = calculateAverageWakeTime(last7Days);

    return { gymDays, cleanDays, avgWakeTime };
  };

  const calculateAverageWakeTime = (activities) => {
    const validTimes = activities.filter(a => a.wakeUpTime);
    if (validTimes.length === 0) return 'N/A';

    const totalMinutes = validTimes.reduce((sum, a) => {
      const [hours, minutes] = a.wakeUpTime.split(':').map(Number);
      return sum + (hours * 60 + minutes);
    }, 0);

    const avgMinutes = totalMinutes / validTimes.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const stats = getStats();
  const streak = getStreak();

  return (
    <div className="tracker-container">
      <div className="tracker-header">
        <h2>📊 Daily Tracker</h2>
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
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <h3>{streak}</h3>
                <p>Day Streak</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏋️</div>
              <div className="stat-info">
                <h3>{stats.gymDays}/7</h3>
                <p>Gym This Week</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🥗</div>
              <div className="stat-info">
                <h3>{stats.cleanDays}/7</h3>
                <p>Clean Eating</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>{stats.avgWakeTime}</h3>
                <p>Avg Wake Time</p>
              </div>
            </div>
          </div>

          <div className="tracker-form-card">
            <h3>Log Today's Activities</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Wake Up Time</label>
                  <input
                    type="time"
                    value={formData.wakeUpTime}
                    onChange={(e) => setFormData({ ...formData, wakeUpTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.wentToGym}
                    onChange={(e) => setFormData({ ...formData, wentToGym: e.target.checked })}
                  />
                  <span className="checkbox-label">
                    <span className="checkbox-icon">🏋️</span>
                    Went to Gym
                  </span>
                </label>

                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.outsideFoodEaten}
                    onChange={(e) => setFormData({ ...formData, outsideFoodEaten: e.target.checked })}
                  />
                  <span className="checkbox-label">
                    <span className="checkbox-icon">🍔</span>
                    Ate Outside Food
                  </span>
                </label>
              </div>

              <div className="input-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes for today..."
                  rows="3"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                {todayActivity ? '📝 Update Today\'s Log' : '✅ Log Activity'}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="history-container">
          <h3>Activity History</h3>
          {activities.length > 0 ? (
            <div className="history-list">
              {activities.map(activity => (
                <div key={activity.id} className="history-card fade-in">
                  <div className="history-header">
                    <h4>{new Date(activity.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</h4>
                    <div className="history-badges">
                      {activity.wakeUpTime && (
                        <span className="badge badge-time">
                          ⏰ {activity.wakeUpTime}
                        </span>
                      )}
                      {activity.wentToGym && (
                        <span className="badge badge-gym">
                          🏋️ Gym
                        </span>
                      )}
                      {activity.outsideFoodEaten && (
                        <span className="badge badge-food">
                          🍔 Outside Food
                        </span>
                      )}
                    </div>
                  </div>
                  {activity.notes && (
                    <div className="history-notes">
                      <p>{activity.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4>No activity history yet</h4>
              <p>Start logging your daily activities to see your progress!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DailyTracker;
