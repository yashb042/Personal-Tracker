# Personal Tracker - Quick Start Guide 🚀

## What You Have Created

A complete **Personal Tracker Web Application** with:

### ✨ Features
- **📝 Notes Management**: Create, edit, delete notes with rich labeling
- **🏷️ Labels System**: Organize notes by categories with custom colors
- **📊 Daily Activity Tracker**: Log wake-up time, gym visits, food intake
- **🔔 Smart Notifications**: Daily reminders via Telegram/WhatsApp
- **📈 Progress Statistics**: View streaks, weekly stats, and trends
- **🎨 Modern UI**: Clean, responsive design with smooth animations

### 🛠️ Tech Stack
- **Frontend**: React, React Router, Modern CSS3
- **Backend**: Node.js, Express.js
- **Notifications**: Telegram Bot API, WhatsApp Business API
- **Scheduling**: node-cron for automated reminders

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install --legacy-peer-deps
cd ..
```

Or use the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5001

# Telegram Configuration (Recommended)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# WhatsApp Configuration (Optional)
WHATSAPP_API_KEY=your_api_key_here
WHATSAPP_PHONE_NUMBER=your_phone_here
```

#### Setting up Telegram Bot:
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the instructions
3. Copy the bot token you receive
4. Search for `@userinfobot` to get your Chat ID
5. Add the token and chat ID to your `.env` file
6. Start a chat with your bot (click the link from BotFather)

### Step 3: Run the Application

#### Development Mode (with hot reload):
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5001`
- Frontend dev server on `http://localhost:3000`

#### Production Mode:
```bash
# Build the frontend
cd client && npm run build && cd ..

# Start the server
npm start
```

Open `http://localhost:3000` in your browser!

---

## 📁 Project Structure

```
Personal Tracker/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Notes.js      # Notes management
│   │   │   ├── Labels.js     # Labels organization
│   │   │   ├── DailyTracker.js # Activity tracking
│   │   │   └── Settings.js   # App settings
│   │   ├── App.js            # Main app component
│   │   ├── App.css           # Global styles
│   │   └── index.js          # React entry point
│   └── package.json
├── server.js                  # Express backend server
├── package.json              # Backend dependencies
├── .env                      # Environment variables (create this!)
├── .env.example             # Environment template
├── README.md                # Project documentation
├── DEPLOYMENT.md            # Deployment instructions
└── setup.sh                 # Setup script

```

---

## 🎯 How to Use

### Notes Section 📝
1. Click "New Note" to create a note
2. Add title, content, and assign labels
3. Search notes or filter by label
4. Edit or delete notes as needed

### Labels Section 🏷️
1. Create labels with custom names and colors
2. Click on a label to view all associated notes
3. Manage and organize your label system

### Daily Tracker 📊
1. Log today's activities:
   - Wake-up time
   - Gym attendance
   - Outside food consumption
   - Additional notes
2. View your progress:
   - Current streak
   - Weekly gym attendance
   - Clean eating days
   - Average wake-up time
3. Check history to see past logs

### Settings ⚙️
1. Enable daily notifications
2. Set reminder time
3. Choose notification method (Telegram/WhatsApp)
4. Customize reminder message
5. Test notifications before enabling

---

## 🌐 Deploying to GitHub

### Step 1: Create GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Personal Tracker app"

# Create repo on GitHub, then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/personal-tracker.git
git push -u origin main
```

### Step 2: Deploy Options

#### Option A: Heroku
```bash
heroku create your-app-name
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set TELEGRAM_CHAT_ID=your_chat_id
git push heroku main
```

#### Option B: Render
1. Connect your GitHub repo
2. Select "Web Service"
3. Build command: `npm install && cd client && npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables in dashboard

#### Option C: Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

#### Option D: Vercel (Frontend only)
```bash
cd client
npm run build
# Deploy build folder to Vercel
```

---

## 🎨 Customization

### Changing Colors
Edit `client/src/index.css` to change the color scheme:

```css
:root {
  --primary-color: #6366f1;  /* Change this */
  --secondary-color: #8b5cf6; /* And this */
  /* ... */
}
```

### Adding Features
- Backend API: Add routes in `server.js`
- Frontend: Create new components in `client/src/components/`

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# For client
cd client
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Notifications Not Working
1. Check `.env` file has correct credentials
2. Test notification from Settings page
3. Verify bot token is active (Telegram)
4. Ensure you've started a chat with your bot

---

## 📱 Mobile Responsive

The app is fully responsive and works great on:
- 📱 Phones (iOS & Android)
- 📱 Tablets
- 💻 Desktops
- 🖥️ Large screens

---

## 🔒 Data Storage

Currently uses **in-memory storage**. Data resets on server restart.

### To Add Persistence:
1. Install a database (MongoDB, PostgreSQL, etc.)
2. Replace the in-memory arrays with database calls
3. Update `server.js` to use database operations

Example databases to consider:
- **MongoDB**: Great for quick prototyping
- **PostgreSQL**: Robust relational database
- **SQLite**: Simple file-based database
- **Firebase**: Real-time cloud database

---

## 🎉 You're All Set!

Your Personal Tracker is ready to use! Start tracking your notes, activities, and building better habits.

### Next Steps:
1. ✅ Run `npm run dev` to start the app
2. ✅ Create your first note
3. ✅ Add some labels
4. ✅ Log today's activities
5. ✅ Set up notifications
6. ✅ Deploy to GitHub and share!

---

## 📞 Support

For issues or questions:
- Check `README.md` for detailed information
- Review `DEPLOYMENT.md` for deployment help
- Check GitHub Issues (if you've pushed to GitHub)

---

**Happy Tracking! 🎯📊✨**

