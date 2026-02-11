# Git Workflow for Personal Tracker
```
npm start
npm run build
```bash
4. Run in production:

```
npm run dev
```bash
3. Run in development:

2. Create `.env` file with your credentials

```
cd client && npm install && cd ..
npm install
```bash
1. Install dependencies:

## Running Locally

3. Deploy automatically on push
2. Add environment variables
1. Connect your GitHub repo
### Option 3: Railway

4. Start command: `npm start`
3. Build command: `npm install && cd client && npm install && npm run build`
2. Select "Web Service"
1. Connect your GitHub repo
### Option 2: Render

```
git push heroku main
heroku create personal-tracker-app
```bash
### Option 1: Heroku

## Deployment Options

Add environment variables in the dashboard under Settings > Environment Variables
### For Vercel/Netlify:

```
heroku config:set WHATSAPP_PHONE_NUMBER=your_phone_number
heroku config:set WHATSAPP_API_KEY=your_api_key
heroku config:set TELEGRAM_CHAT_ID=your_chat_id
heroku config:set TELEGRAM_BOT_TOKEN=your_token
```bash
### For Heroku:

Before deploying, make sure to set up environment variables in your hosting platform.

## Environment Variables

```
git push -u origin main
git remote add origin https://github.com/YOUR_USERNAME/personal-tracker.git
git branch -M main
```bash
3. Link and push:

- Don't initialize with README (we already have one)
- Create a new repository named "personal-tracker"
- Go to https://github.com/new
2. Create GitHub repository:

```
git commit -m "Initial commit: Personal Tracker app"
git add .
git init
```bash
1. Initialize git repository:

## Initial Setup


