# Personal Tracker

A comprehensive personal tracking application to manage notes, labels, and daily activities with notification support.

## Features

- 📝 **Notes Management**: Create, edit, and organize notes with labels
- 🏷️ **Label System**: Categorize notes with custom labels and view them by category
- 🏋️ **Daily Activity Tracking**: Log wake-up time, gym visits, and food intake
- 🔔 **Notifications**: Daily reminders via WhatsApp/Telegram
- 🎨 **Modern UI**: Clean, responsive interface with smooth animations

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/personal-tracker.git
cd personal-tracker
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory:
```env
PORT=5001
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER=your_phone_number
```

### Running Locally

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Deployment to GitHub Pages

1. Update the `homepage` field in `client/package.json` with your GitHub Pages URL
2. Build and deploy:
```bash
cd client
npm run build
npm run deploy
```

## Deployment to Heroku

1. Create a Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set TELEGRAM_CHAT_ID=your_chat_id
```

3. Deploy:
```bash
git push heroku main
```

## Usage

### Notes
- Create notes with titles and content
- Assign one or multiple labels to notes
- Search and filter notes

### Labels
- View all notes organized by labels
- Click on a label to see all associated notes

### Daily Tracker
- Log your wake-up time
- Track gym attendance
- Record outside food consumption
- View your tracking history

### Notifications
- Configure daily reminders in settings
- Receive notifications via Telegram or WhatsApp

## Technologies Used

- **Frontend**: React, CSS3, Modern JavaScript
- **Backend**: Node.js, Express
- **Notifications**: Telegram Bot API, WhatsApp Business API
- **Scheduling**: node-cron

## License

MIT

