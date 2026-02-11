import React, { useState, useEffect } from 'react';
export default DailyTracker;

}
  );
    </div>
      )}
        </div>
          )}
            </div>
              <p>Start logging your daily activities to see your progress!</p>
              <h4>No activity history yet</h4>
            <div className="empty-state">
          ) : (
            </div>
              ))}
                </div>
                  )}
                    </div>
                      <p>{activity.notes}</p>
                    <div className="history-notes">
                  {activity.notes && (
                  </div>
                    </div>
                      )}
                        </span>
                          🍔 Outside Food
                        <span className="badge badge-food">
                      {activity.outsideFoodEaten && (
                      )}
                        </span>
                          🏋️ Gym
                        <span className="badge badge-gym">
                      {activity.wentToGym && (
                      )}
                        </span>
                          ⏰ {activity.wakeUpTime}
                        <span className="badge badge-time">
                      {activity.wakeUpTime && (
                    <div className="history-badges">
                    })}</h4>
                      day: 'numeric'
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long',
                    <h4>{new Date(activity.date).toLocaleDateString('en-US', {
                  <div className="history-header">
                <div key={activity.id} className="history-card fade-in">
              {activities.map(activity => (
            <div className="history-list">
          {activities.length > 0 ? (
          <h3>Activity History</h3>
        <div className="history-container">
      ) : (
        </>
          </div>
            </form>
              </button>
                {todayActivity ? '📝 Update Today\'s Log' : '✅ Log Activity'}
              <button type="submit" className="btn btn-primary btn-block">

              </div>
                />
                  rows="3"
                  placeholder="Any additional notes for today..."
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  value={formData.notes}
                <textarea
                <label>Notes</label>
              <div className="input-group">

              </div>
                </label>
                  </span>
                    Ate Outside Food
                    <span className="checkbox-icon">🍔</span>
                  <span className="checkbox-label">
                  />
                    onChange={(e) => setFormData({ ...formData, outsideFoodEaten: e.target.checked })}
                    checked={formData.outsideFoodEaten}
                    type="checkbox"
                  <input
                <label className="checkbox-container">

                </label>
                  </span>
                    Went to Gym
                    <span className="checkbox-icon">🏋️</span>
                  <span className="checkbox-label">
                  />
                    onChange={(e) => setFormData({ ...formData, wentToGym: e.target.checked })}
                    checked={formData.wentToGym}
                    type="checkbox"
                  <input
                <label className="checkbox-container">
              <div className="checkbox-group">

              </div>
                </div>
                  />
                    onChange={(e) => setFormData({ ...formData, wakeUpTime: e.target.value })}
                    value={formData.wakeUpTime}
                    type="time"
                  <input
                  <label>Wake Up Time</label>
                <div className="input-group">
                </div>
                  />
                    required
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    value={formData.date}
                    type="date"
                  <input
                  <label>Date</label>
                <div className="input-group">
              <div className="form-row">
            <form onSubmit={handleSubmit}>
            <h3>Log Today's Activities</h3>
          <div className="tracker-form-card">

          </div>
            </div>
              </div>
                <p>Avg Wake Time</p>
                <h3>{stats.avgWakeTime}</h3>
              <div className="stat-info">
              <div className="stat-icon">⏰</div>
            <div className="stat-card">
            </div>
              </div>
                <p>Clean Eating</p>
                <h3>{stats.cleanDays}/7</h3>
              <div className="stat-info">
              <div className="stat-icon">🥗</div>
            <div className="stat-card">
            </div>
              </div>
                <p>Gym This Week</p>
                <h3>{stats.gymDays}/7</h3>
              <div className="stat-info">
              <div className="stat-icon">🏋️</div>
            <div className="stat-card">
            </div>
              </div>
                <p>Day Streak</p>
                <h3>{streak}</h3>
              <div className="stat-info">
              <div className="stat-icon">🔥</div>
            <div className="stat-card">
          <div className="stats-grid">
        <>
      {view === 'today' ? (

      </div>
        </div>
          </button>
            History
          >
            onClick={() => setView('history')}
            className={`toggle-btn ${view === 'history' ? 'active' : ''}`}
          <button
          </button>
            Today
          >
            onClick={() => setView('today')}
            className={`toggle-btn ${view === 'today' ? 'active' : ''}`}
          <button
        <div className="view-toggle">
        <h2>📊 Daily Tracker</h2>
      <div className="tracker-header">
    <div className="tracker-container">
  return (

  const streak = getStreak();
  const stats = getStats();

  };
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const minutes = Math.round(avgMinutes % 60);
    const hours = Math.floor(avgMinutes / 60);
    const avgMinutes = totalMinutes / validTimes.length;

    }, 0);
      return sum + (hours * 60 + minutes);
      const [hours, minutes] = a.wakeUpTime.split(':').map(Number);
    const totalMinutes = validTimes.reduce((sum, a) => {

    if (validTimes.length === 0) return 'N/A';
    const validTimes = activities.filter(a => a.wakeUpTime);
  const calculateAverageWakeTime = (activities) => {

  };
    return { gymDays, cleanDays, avgWakeTime };

    const avgWakeTime = calculateAverageWakeTime(last7Days);
    const cleanDays = last7Days.filter(a => !a.outsideFoodEaten).length;
    const gymDays = last7Days.filter(a => a.wentToGym).length;
    const last7Days = activities.slice(0, 7);
  const getStats = () => {

  };
    return streak;

    }
      }
        break;
      } else {
        streak++;
      if (sortedActivities[i]?.date === expectedDateStr) {

      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDate = new Date();
    for (let i = 0; i < sortedActivities.length; i++) {

    const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
  const getStreak = () => {

  };
    }
      alert('Error saving activity');
      console.error('Error saving activity:', error);
    } catch (error) {
      alert('Activity logged successfully! 🎉');
      fetchActivities();
      await axios.post('/api/activities', formData);
    try {
    e.preventDefault();
  const handleSubmit = async (e) => {

  };
    }
      console.error('Error fetching activities:', error);
    } catch (error) {
      setActivities(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      const response = await axios.get('/api/activities');
    try {
  const fetchActivities = async () => {

  }, [activities]);
    }
      setTodayActivity(null);
    } else {
      });
        notes: activity.notes || ''
        outsideFoodEaten: activity.outsideFoodEaten || false,
        wentToGym: activity.wentToGym || false,
        wakeUpTime: activity.wakeUpTime || '',
        date: activity.date,
      setFormData({
      setTodayActivity(activity);
    if (activity) {
    const activity = activities.find(a => a.date === today);
    const today = new Date().toISOString().split('T')[0];
  useEffect(() => {

  }, []);
    fetchActivities();
  useEffect(() => {

  const [view, setView] = useState('today'); // 'today' or 'history'
  });
    notes: ''
    outsideFoodEaten: false,
    wentToGym: false,
    wakeUpTime: '',
    date: new Date().toISOString().split('T')[0],
  const [formData, setFormData] = useState({
  const [todayActivity, setTodayActivity] = useState(null);
  const [activities, setActivities] = useState([]);
function DailyTracker() {

import './DailyTracker.css';
import axios from 'axios';

