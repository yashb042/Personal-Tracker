const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// In-memory storage (in production, use a database)
let notes = [];
let labels = [];
let dailyActivities = [];
let notificationSettings = {
  enabled: false,
  time: '09:00',
  method: 'telegram', // 'telegram' or 'whatsapp'
  message: 'Good morning! Don\'t forget to log your activities today! 🌟'
};

// Generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// API Routes

// Notes endpoints
app.get('/api/notes', (req, res) => {
  res.json(notes);
});

app.post('/api/notes', (req, res) => {
  const { title, content, labelIds } = req.body;
  const note = {
    id: generateId(),
    title,
    content,
    labelIds: labelIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  notes.push(note);
  res.status(201).json(note);
});

app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, labelIds } = req.body;
  const noteIndex = notes.findIndex(n => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  notes[noteIndex] = {
    ...notes[noteIndex],
    title,
    content,
    labelIds: labelIds || [],
    updatedAt: new Date().toISOString()
  };

  res.json(notes[noteIndex]);
});

app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const noteIndex = notes.findIndex(n => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  notes.splice(noteIndex, 1);
  res.status(204).send();
});

// Labels endpoints
app.get('/api/labels', (req, res) => {
  res.json(labels);
});

app.post('/api/labels', (req, res) => {
  const { name, color } = req.body;
  const label = {
    id: generateId(),
    name,
    color: color || '#' + Math.floor(Math.random()*16777215).toString(16),
    createdAt: new Date().toISOString()
  };
  labels.push(label);
  res.status(201).json(label);
});

app.put('/api/labels/:id', (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  const labelIndex = labels.findIndex(l => l.id === id);

  if (labelIndex === -1) {
    return res.status(404).json({ error: 'Label not found' });
  }

  labels[labelIndex] = {
    ...labels[labelIndex],
    name,
    color
  };

  res.json(labels[labelIndex]);
});

app.delete('/api/labels/:id', (req, res) => {
  const { id } = req.params;
  const labelIndex = labels.findIndex(l => l.id === id);

  if (labelIndex === -1) {
    return res.status(404).json({ error: 'Label not found' });
  }

  // Remove label from all notes
  notes = notes.map(note => ({
    ...note,
    labelIds: note.labelIds.filter(labelId => labelId !== id)
  }));

  labels.splice(labelIndex, 1);
  res.status(204).send();
});

// Daily activities endpoints
app.get('/api/activities', (req, res) => {
  res.json(dailyActivities);
});

app.post('/api/activities', (req, res) => {
  const { date, wakeUpTime, wentToGym, outsideFoodEaten, notes: activityNotes } = req.body;

  // Check if activity for this date already exists
  const existingIndex = dailyActivities.findIndex(a => a.date === date);

  const activity = {
    id: existingIndex !== -1 ? dailyActivities[existingIndex].id : generateId(),
    date,
    wakeUpTime,
    wentToGym,
    outsideFoodEaten,
    notes: activityNotes || '',
    createdAt: existingIndex !== -1 ? dailyActivities[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    dailyActivities[existingIndex] = activity;
  } else {
    dailyActivities.push(activity);
  }

  res.status(201).json(activity);
});

app.get('/api/activities/:date', (req, res) => {
  const { date } = req.params;
  const activity = dailyActivities.find(a => a.date === date);

  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  res.json(activity);
});

// Notification settings endpoints
app.get('/api/notification-settings', (req, res) => {
  res.json(notificationSettings);
});

app.put('/api/notification-settings', (req, res) => {
  notificationSettings = {
    ...notificationSettings,
    ...req.body
  };

  // Reschedule notifications
  scheduleNotifications();

  res.json(notificationSettings);
});

// Notification functions
async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('Telegram credentials not configured');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message
    });
    console.log('Telegram message sent successfully');
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
  }
}

async function sendWhatsAppMessage(message) {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;

  if (!apiKey || !phoneNumber) {
    console.log('WhatsApp credentials not configured');
    return;
  }

  // This is a placeholder - you'll need to use a WhatsApp Business API provider
  console.log('WhatsApp message would be sent:', message);
}

function scheduleNotifications() {
  // Clear existing cron jobs
  cron.getTasks().forEach(task => task.stop());

  if (!notificationSettings.enabled) {
    return;
  }

  const [hour, minute] = notificationSettings.time.split(':');

  // Schedule daily notification
  cron.schedule(`${minute} ${hour} * * *`, async () => {
    console.log('Sending scheduled notification...');

    if (notificationSettings.method === 'telegram') {
      await sendTelegramMessage(notificationSettings.message);
    } else if (notificationSettings.method === 'whatsapp') {
      await sendWhatsAppMessage(notificationSettings.message);
    }
  });

  console.log(`Notifications scheduled for ${notificationSettings.time}`);
}

// Test notification endpoint
app.post('/api/test-notification', async (req, res) => {
  const { method, message } = req.body;

  try {
    if (method === 'telegram') {
      await sendTelegramMessage(message || 'Test notification from Personal Tracker!');
    } else if (method === 'whatsapp') {
      await sendWhatsAppMessage(message || 'Test notification from Personal Tracker!');
    }
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Initialize notifications
scheduleNotifications();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

