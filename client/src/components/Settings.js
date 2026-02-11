import React, { useState, useEffect } from 'react';
export default Settings;

}
  );
    </div>
      </div>
        </div>
          </div>
            </div>
              <div className="feature-item">✅ Progress statistics</div>
              <div className="feature-item">✅ Smart notifications</div>
              <div className="feature-item">✅ Daily activity tracking</div>
              <div className="feature-item">✅ Label organization</div>
              <div className="feature-item">✅ Notes with labels</div>
            <div className="feature-list">
            <p>A comprehensive personal tracking application to manage notes, labels, and daily activities.</p>
            <p><strong>Personal Tracker</strong> v1.0.0</p>
          <div className="about-content">
          <h3>ℹ️ About</h3>
        <div className="settings-card">

        </div>
          </div>
            </p>
              and may have associated costs.
              <strong>Note:</strong> WhatsApp Business API typically requires a business account
            <p className="note">
            </ol>
              </li>
                </pre>
WHATSAPP_PHONE_NUMBER=your_phone_number
WHATSAPP_API_KEY=your_api_key
                <pre>
              <li>Add these to your <code>.env</code> file:
              <li>Get your API key and phone number</li>
              <li>Sign up for a WhatsApp Business API provider (e.g., Twilio, MessageBird)</li>
            <ol>
            <h4>WhatsApp Setup</h4>
          <div className="setup-section">

          </div>
            </ol>
              <li>Start a chat with your bot by clicking the link BotFather provides</li>
              </li>
                </pre>
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_BOT_TOKEN=your_bot_token
                <pre>
              <li>Add these to your <code>.env</code> file:
              <li>Search for <strong>@userinfobot</strong> to get your Chat ID</li>
              <li>Copy the bot token you receive</li>
              <li>Send <code>/newbot</code> and follow the instructions</li>
              <li>Open Telegram and search for <strong>@BotFather</strong></li>
            <ol>
            <h4>Telegram Setup</h4>
          <div className="setup-section">

          <h3>📱 Setup Instructions</h3>
        <div className="settings-card">

        </div>
          </form>
            )}
              </div>
                {testResult.message}
              <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
            {testResult && (

            </div>
              )}
                </button>
                  🧪 Test Notification
                >
                  disabled={loading}
                  onClick={handleTestNotification}
                  className="btn btn-secondary"
                  type="button"
                <button
              {settings.enabled && (
              </button>
                {loading ? '💾 Saving...' : '💾 Save Settings'}
              <button type="submit" className="btn btn-primary" disabled={loading}>
            <div className="button-group">

            )}
              </>
                </div>
                  />
                    placeholder="Enter your custom notification message..."
                    rows="3"
                    required
                    onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                    value={settings.message}
                  <textarea
                  <label>Custom Message</label>
                <div className="input-group">

                </div>
                  </select>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                  >
                    required
                    onChange={(e) => setSettings({ ...settings, method: e.target.value })}
                    value={settings.method}
                  <select
                  <label>Notification Method</label>
                <div className="input-group">

                </div>
                  <small>Choose the time you want to receive daily reminders</small>
                  />
                    required
                    onChange={(e) => setSettings({ ...settings, time: e.target.value })}
                    value={settings.time}
                    type="time"
                  <input
                  <label>Notification Time</label>
                <div className="input-group">
              <>
            {settings.enabled && (

            </div>
              </label>
                <span className="toggle-text">Enable Daily Notifications</span>
                />
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  checked={settings.enabled}
                  type="checkbox"
                <input
              <label className="toggle-label">
            <div className="input-group">
          <form onSubmit={handleSave}>

          </p>
            Configure daily reminders to help you stay on track with your goals.
          <p className="settings-description">
          <h3>📲 Notification Settings</h3>
        <div className="settings-card">
      <div className="settings-content">

      </div>
        <h2>⚙️ Settings</h2>
      <div className="settings-header">
    <div className="settings-container">
  return (

  };
    }
      setLoading(false);
    } finally {
      setTestResult({ success: false, message: 'Failed to send notification. Check your credentials.' });
      console.error('Error sending test notification:', error);
    } catch (error) {
      setTestResult({ success: true, message: 'Test notification sent!' });
      });
        message: 'Test notification from Personal Tracker! 📱'
        method: settings.method,
      await axios.post('/api/test-notification', {
    try {
    setTestResult(null);
    setLoading(true);
  const handleTestNotification = async () => {

  };
    }
      setLoading(false);
    } finally {
      alert('Error saving settings');
      console.error('Error saving settings:', error);
    } catch (error) {
      alert('Settings saved successfully! ✅');
      await axios.put('/api/notification-settings', settings);
    try {
    setLoading(true);
    e.preventDefault();
  const handleSave = async (e) => {

  };
    }
      console.error('Error fetching settings:', error);
    } catch (error) {
      setSettings(response.data);
      const response = await axios.get('/api/notification-settings');
    try {
  const fetchSettings = async () => {

  }, []);
    fetchSettings();
  useEffect(() => {

  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  });
    message: 'Good morning! Don\'t forget to log your activities today! 🌟'
    method: 'telegram',
    time: '09:00',
    enabled: false,
  const [settings, setSettings] = useState({
function Settings() {

import './Settings.css';
import axios from 'axios';

