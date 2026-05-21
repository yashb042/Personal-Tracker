import React, { useState, useEffect } from 'react';
import { getNotificationSettings, saveNotificationSettings, exportAllData, importAllData } from '../storage';
import { getGithubPat, setGithubPat } from '../githubSync';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState({
    enabled: false,
    time: '09:00',
    method: 'telegram',
    message: 'Good morning! Don\'t forget to log your activities today! 🌟'
  });
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [githubPat, setGithubPatState] = useState('');

  useEffect(() => {
    setSettings(getNotificationSettings());
    setGithubPatState(getGithubPat());
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    saveNotificationSettings(settings);
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully! ✅');
    }, 200);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        importAllData(data);
        setSettings(getNotificationSettings());
        setImportStatus({ success: true, message: 'Data imported successfully! Refresh the page to see changes.' });
      } catch {
        setImportStatus({ success: false, message: 'Invalid file format.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
          <p className="settings-description" style={{ color: '#22c55e', fontSize: '0.85rem' }}>
            ✅ Reminders run on GitHub Actions (laptop off). Tap <strong>Open Tracker</strong> in Telegram for instant logging.
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
                    value="telegram"
                    onChange={() => setSettings({ ...settings, method: 'telegram' })}
                    required
                  >
                    <option value="telegram">Telegram</option>
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
            </div>
          </form>
        </div>

        <div className="settings-card">
          <h3>🔑 Instant save from Telegram (required once)</h3>
          <p className="settings-description">
            Create a <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noreferrer">fine-grained GitHub token</a> with
            <strong> Contents: Read and write</strong> on repo <code>Personal-Tracker</code> only.
            Stored in this browser only — enables instant save when you use the Telegram Web App.
          </p>
          <div className="input-group">
            <label>GitHub token</label>
            <input
              type="password"
              value={githubPat}
              onChange={(e) => setGithubPatState(e.target.value)}
              placeholder="github_pat_..."
              autoComplete="off"
            />
          </div>
          <div className="button-group">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setGithubPat(githubPat);
                alert('GitHub token saved in this browser.');
              }}
            >
              Save token
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3>💾 Data Backup</h3>
          <p className="settings-description">
            Your data is stored in this browser's localStorage. Export it to keep a backup or transfer to another device.
          </p>

          <div className="button-group">
            <button className="btn btn-primary" onClick={handleExport}>
              📥 Export Data
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              📤 Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {importStatus && (
            <div className={`alert ${importStatus.success ? 'alert-success' : 'alert-error'}`}>
              {importStatus.message}
            </div>
          )}
        </div>

        <div className="settings-card">
          <h3>ℹ️ About</h3>
          <div className="about-content">
            <p><strong>Personal Tracker</strong> v4.0.0 — GitHub only</p>
            <p>Reminders via GitHub Actions. Instant logging via Telegram Web App on GitHub Pages.</p>
            <div className="feature-list">
              <div className="feature-item">✅ Open Tracker in Telegram (instant)</div>
              <div className="feature-item">✅ Laptop can be off</div>
              <div className="feature-item">✅ 8 AM + hourly reminders</div>
              <div className="feature-item">✅ GitHub token → instant cloud save</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
