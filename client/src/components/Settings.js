import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState({
    enabled: false,
    time: '09:00',
    method: 'telegram',
    message: 'Good morning! Don\'t forget to log your activities today! 🌟'
  });
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/notification-settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/api/notification-settings', settings);
      alert('Settings saved successfully! ✅');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      await axios.post('/api/test-notification', {
        method: settings.method,
        message: 'Test notification from Personal Tracker! 📱'
      });
      setTestResult({ success: true, message: 'Test notification sent!' });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestResult({ success: false, message: 'Failed to send notification. Check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <h3>📲 Notification Settings</h3>
          <p className="settings-description">
            Configure daily reminders to help you stay on track with your goals.
          </p>

          <form onSubmit={handleSave}>
            <div className="input-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
                <span className="toggle-text">Enable Daily Notifications</span>
              </label>
            </div>

            {settings.enabled && (
              <>
                <div className="input-group">
                  <label>Notification Time</label>
                  <input
                    type="time"
                    value={settings.time}
                    onChange={(e) => setSettings({ ...settings, time: e.target.value })}
                    required
                  />
                  <small>Choose the time you want to receive daily reminders</small>
                </div>

                <div className="input-group">
                  <label>Notification Method</label>
                  <select
                    value={settings.method}
                    onChange={(e) => setSettings({ ...settings, method: e.target.value })}
                    required
                  >
                    <option value="telegram">Telegram</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Custom Message</label>
                  <textarea
                    value={settings.message}
                    onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                    required
                    rows="3"
                    placeholder="Enter your custom notification message..."
                  />
                </div>
              </>
            )}

            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '💾 Saving...' : '💾 Save Settings'}
              </button>
              {settings.enabled && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleTestNotification}
                  disabled={loading}
                >
                  🧪 Test Notification
                </button>
              )}
            </div>

            {testResult && (
              <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
                {testResult.message}
              </div>
            )}
          </form>
        </div>

        <div className="settings-card">
          <h3>📱 Setup Instructions</h3>

          <div className="setup-section">
            <h4>Telegram Setup</h4>
            <ol>
              <li>Open Telegram and search for <strong>@BotFather</strong></li>
              <li>Send <code>/newbot</code> and follow the instructions</li>
              <li>Copy the bot token you receive</li>
              <li>Search for <strong>@userinfobot</strong> to get your Chat ID</li>
              <li>Add these to your <code>.env</code> file:
                <pre>
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
                </pre>
              </li>
              <li>Start a chat with your bot by clicking the link BotFather provides</li>
            </ol>
          </div>

          <div className="setup-section">
            <h4>WhatsApp Setup</h4>
            <ol>
              <li>Sign up for a WhatsApp Business API provider (e.g., Twilio, MessageBird)</li>
              <li>Get your API key and phone number</li>
              <li>Add these to your <code>.env</code> file:
                <pre>
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE_NUMBER=your_phone_number
                </pre>
              </li>
            </ol>
            <p className="note">
              <strong>Note:</strong> WhatsApp Business API typically requires a business account
              and may have associated costs.
            </p>
          </div>
        </div>

        <div className="settings-card">
          <h3>ℹ️ About</h3>
          <div className="about-content">
            <p><strong>Personal Tracker</strong> v1.0.0</p>
            <p>A comprehensive personal tracking application to manage notes, labels, and daily activities.</p>
            <div className="feature-list">
              <div className="feature-item">✅ Notes with labels</div>
              <div className="feature-item">✅ Label organization</div>
              <div className="feature-item">✅ Daily activity tracking</div>
              <div className="feature-item">✅ Smart notifications</div>
              <div className="feature-item">✅ Progress statistics</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
