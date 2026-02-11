const express = require('express');
});
  console.log(`Server running on port ${PORT}`);
app.listen(PORT, () => {

scheduleNotifications();
// Initialize notifications

});
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
app.get('*', (req, res) => {
// Serve React app

});
  }
    res.status(500).json({ error: 'Failed to send notification' });
  } catch (error) {
    res.json({ success: true, message: 'Notification sent' });
    }
      await sendWhatsAppMessage(message || 'Test notification from Personal Tracker!');
    } else if (method === 'whatsapp') {
      await sendTelegramMessage(message || 'Test notification from Personal Tracker!');
    if (method === 'telegram') {
  try {

  const { method, message } = req.body;
app.post('/api/test-notification', async (req, res) => {
// Test notification endpoint

}
  console.log(`Notifications scheduled for ${notificationSettings.time}`);

  });
    }
      await sendWhatsAppMessage(notificationSettings.message);
    } else if (notificationSettings.method === 'whatsapp') {
      await sendTelegramMessage(notificationSettings.message);
    if (notificationSettings.method === 'telegram') {

    console.log('Sending scheduled notification...');
  cron.schedule(`${minute} ${hour} * * *`, async () => {
  // Schedule daily notification

  const [hour, minute] = notificationSettings.time.split(':');

  }
    return;
  if (!notificationSettings.enabled) {

  cron.getTasks().forEach(task => task.stop());
  // Clear existing cron jobs
function scheduleNotifications() {

}
  console.log('WhatsApp message would be sent:', message);
  // This is a placeholder - you'll need to use a WhatsApp Business API provider

  }
    return;
    console.log('WhatsApp credentials not configured');
  if (!apiKey || !phoneNumber) {

  const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
  const apiKey = process.env.WHATSAPP_API_KEY;
async function sendWhatsAppMessage(message) {

}
  }
    console.error('Error sending Telegram message:', error.message);
  } catch (error) {
    console.log('Telegram message sent successfully');
    });
      text: message
      chat_id: chatId,
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
  try {

  }
    return;
    console.log('Telegram credentials not configured');
  if (!token || !chatId) {

  const chatId = process.env.TELEGRAM_CHAT_ID;
  const token = process.env.TELEGRAM_BOT_TOKEN;
async function sendTelegramMessage(message) {
// Notification functions

});
  res.json(notificationSettings);

  scheduleNotifications();
  // Reschedule notifications

  };
    ...req.body
    ...notificationSettings,
  notificationSettings = {
app.put('/api/notification-settings', (req, res) => {

});
  res.json(notificationSettings);
app.get('/api/notification-settings', (req, res) => {
// Notification settings endpoints

});
  res.json(activity);

  }
    return res.status(404).json({ error: 'Activity not found' });
  if (!activity) {

  const activity = dailyActivities.find(a => a.date === date);
  const { date } = req.params;
app.get('/api/activities/:date', (req, res) => {

});
  res.status(201).json(activity);

  }
    dailyActivities.push(activity);
  } else {
    dailyActivities[existingIndex] = activity;
  if (existingIndex !== -1) {

  };
    updatedAt: new Date().toISOString()
    createdAt: existingIndex !== -1 ? dailyActivities[existingIndex].createdAt : new Date().toISOString(),
    notes: activityNotes || '',
    outsideFoodEaten,
    wentToGym,
    wakeUpTime,
    date,
    id: existingIndex !== -1 ? dailyActivities[existingIndex].id : generateId(),
  const activity = {

  const existingIndex = dailyActivities.findIndex(a => a.date === date);
  // Check if activity for this date already exists

  const { date, wakeUpTime, wentToGym, outsideFoodEaten, notes: activityNotes } = req.body;
app.post('/api/activities', (req, res) => {

});
  res.json(dailyActivities);
app.get('/api/activities', (req, res) => {
// Daily activities endpoints

});
  res.status(204).send();
  labels.splice(labelIndex, 1);

  }));
    labelIds: note.labelIds.filter(labelId => labelId !== id)
    ...note,
  notes = notes.map(note => ({
  // Remove label from all notes

  }
    return res.status(404).json({ error: 'Label not found' });
  if (labelIndex === -1) {

  const labelIndex = labels.findIndex(l => l.id === id);
  const { id } = req.params;
app.delete('/api/labels/:id', (req, res) => {

});
  res.json(labels[labelIndex]);

  };
    color
    name,
    ...labels[labelIndex],
  labels[labelIndex] = {

  }
    return res.status(404).json({ error: 'Label not found' });
  if (labelIndex === -1) {

  const labelIndex = labels.findIndex(l => l.id === id);
  const { name, color } = req.body;
  const { id } = req.params;
app.put('/api/labels/:id', (req, res) => {

});
  res.status(201).json(label);
  labels.push(label);
  };
    createdAt: new Date().toISOString()
    color: color || '#' + Math.floor(Math.random()*16777215).toString(16),
    name,
    id: generateId(),
  const label = {
  const { name, color } = req.body;
app.post('/api/labels', (req, res) => {

});
  res.json(labels);
app.get('/api/labels', (req, res) => {
// Labels endpoints

});
  res.status(204).send();
  notes.splice(noteIndex, 1);

  }
    return res.status(404).json({ error: 'Note not found' });
  if (noteIndex === -1) {

  const noteIndex = notes.findIndex(n => n.id === id);
  const { id } = req.params;
app.delete('/api/notes/:id', (req, res) => {

});
  res.json(notes[noteIndex]);

  };
    updatedAt: new Date().toISOString()
    labelIds: labelIds || [],
    content,
    title,
    ...notes[noteIndex],
  notes[noteIndex] = {

  }
    return res.status(404).json({ error: 'Note not found' });
  if (noteIndex === -1) {

  const noteIndex = notes.findIndex(n => n.id === id);
  const { title, content, labelIds } = req.body;
  const { id } = req.params;
app.put('/api/notes/:id', (req, res) => {

});
  res.status(201).json(note);
  notes.push(note);
  };
    updatedAt: new Date().toISOString()
    createdAt: new Date().toISOString(),
    labelIds: labelIds || [],
    content,
    title,
    id: generateId(),
  const note = {
  const { title, content, labelIds } = req.body;
app.post('/api/notes', (req, res) => {

});
  res.json(notes);
app.get('/api/notes', (req, res) => {
// Notes endpoints

// API Routes

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
// Generate unique IDs

};
  message: 'Good morning! Don\'t forget to log your activities today! 🌟'
  method: 'telegram', // 'telegram' or 'whatsapp'
  time: '09:00',
  enabled: false,
let notificationSettings = {
let dailyActivities = [];
let labels = [];
let notes = [];
// In-memory storage (in production, use a database)

app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());
app.use(cors());
// Middleware

const PORT = process.env.PORT || 5000;
const app = express();

require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

