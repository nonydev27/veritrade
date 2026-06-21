# VeriTrade — Deployment Guide

This guide takes you step by step from running on your laptop to a live app on the internet
that real users can access. Each section builds on the previous one.

---

## Understanding What "Deploy" Means

Right now the backend runs on **your laptop**. Only devices on your WiFi can reach it.
"Deploying" means moving it to a **server on the internet** that runs 24/7 and has a public URL.

```
Before deploy:  Mobile app → http://192.168.1.45:5000   (only your WiFi)
After deploy:   Mobile app → https://veritrade.up.railway.app  (anywhere on earth)
```

---

## Part 1 — Deploy the Backend

### Option A: Railway (Recommended — Free, No Credit Card)

Railway is the easiest way to host a Node.js app for free.

**Step 1 — Push your code to GitHub**

If you haven't already:
```bash
cd ~/Desktop/veritrade
git init
git add .
git commit -m "Initial commit"
```
Then create a repository on [github.com](https://github.com) and follow the instructions to push.

**Step 2 — Deploy on Railway**

1. Go to [railway.app](https://railway.app) and click **Login with GitHub**
2. Click **New Project → Deploy from GitHub Repo**
3. Select your repository
4. Click **Add variables** and set:

```
JWT_SECRET   = make_this_a_long_random_string_like_this_abc123xyz789
PORT         = 5000
```

5. Under **Settings → Root Directory**, set it to `backend`
6. Railway detects Node.js automatically and runs `npm start`
7. In the **Deployments** tab, click your deployment → copy the public URL

It looks like: `https://veritrade-production-abc1.up.railway.app`

**Step 3 — Test it**

Open your browser and go to `https://your-railway-url.up.railway.app/` — you should see:
```
VeriTrade API Running
```

---

### Option B: Render (Also Free)

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
4. Add environment variables: `JWT_SECRET`, `PORT=5000`
5. Click **Create Web Service**

Render gives you a URL like `https://veritrade.onrender.com`

> ⚠️ Note: Render's free tier **spins down after 15 minutes of inactivity**. First request after
> sleep takes ~30 seconds. This is fine for testing, but for production use Railway or a paid plan.

---

### Option C: VPS (DigitalOcean / Hetzner — $4–6/month)

For more control, rent a small Linux server.

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone your project
git clone https://github.com/yourname/veritrade.git
cd veritrade/backend
npm install

# 4. Create .env
nano .env
# Add: JWT_SECRET=your_secret_here

# 5. Install PM2 (keeps the app running forever, even after reboot)
npm install -g pm2
pm2 start src/server.js --name veritrade-api
pm2 save
pm2 startup    # follow the command it prints

# 6. Allow traffic on port 5000
sudo ufw allow 5000

# Your API is now at: http://your-server-ip:5000
```

---

## Part 2 — Add a Real Database (PostgreSQL)

The local JSON files work fine for development but are not suitable for production
(they would be wiped when Railway redeploys your app). Switch to PostgreSQL.

### With Railway (easiest)

1. Inside your Railway project, click **+ New → Database → Add PostgreSQL**
2. Railway automatically injects `DATABASE_URL` into your app's environment
3. Open a terminal connected to Railway and run the schema:

```bash
# Or use the Railway CLI
npm install -g @railway/cli
railway login
railway run psql $DATABASE_URL -f database/init.sql
```

4. Your backend will automatically use PostgreSQL because `DATABASE_URL` is now set.

### With Supabase (free hosted PostgreSQL)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection String → URI** and copy it
3. Add it to your server environment as `DATABASE_URL`
4. Go to the **SQL Editor** in Supabase, paste the contents of `database/init.sql`, and run it

---

## Part 3 — Update the Mobile App URL

Once the backend is live, open `mobile/services/api.ts` and replace the local IP:

```ts
// Before (local dev):
const BASE_URL = 'http://100.66.247.137:5000/api';

// After (production):
const BASE_URL = 'https://your-railway-url.up.railway.app/api';
```

---

## Part 4 — Build the Mobile App

### Option A: Expo Go (Testing Only)

```bash
cd mobile
npx expo start
```

Anyone can scan the QR code with the **Expo Go** app. Good for testing with friends.
Not suitable for publishing to app stores.

### Option B: Build an APK (Share directly — Android only)

An APK is a file you can send via WhatsApp and install directly on any Android phone.

```bash
# Install EAS (Expo Application Services)
npm install -g eas-cli

# Login to your Expo account (create one free at expo.dev)
eas login

# Configure (run once)
cd mobile
eas build:configure

# Build the APK
eas build --platform android --profile preview
```

After ~10 minutes, EAS gives you a download link for the `.apk` file.

### Option C: Publish to Google Play Store

1. Create a Google Play developer account at [play.google.com/console](https://play.google.com/console) — $25 one-time fee
2. Build a release version:
   ```bash
   eas build --platform android --profile production
   ```
3. Download the `.aab` file EAS produces
4. In Google Play Console → Create app → upload the `.aab`
5. Fill in store listing (description, screenshots, privacy policy)
6. Submit for review (~3 days)

### Option D: Publish to Apple App Store

1. Pay Apple's $99/year developer fee at [developer.apple.com](https://developer.apple.com)
2. Build for iOS:
   ```bash
   eas build --platform ios --profile production
   ```
3. Submit via EAS:
   ```bash
   eas submit --platform ios
   ```
4. Apple reviews in 1–3 days

---

## Part 5 — Real USSD with Africa's Talking

To make real users able to dial `*384*1#` on any phone:

**Step 1 — Create an account**

Register at [africastalking.com](https://africastalking.com). They have a sandbox (free testing)
and live mode.

**Step 2 — Create a USSD service**

In your Africa's Talking dashboard:
1. Go to **USSD → Create Channel**
2. Choose your country
3. They assign you a shortcode like `*384*123#`
4. Set **Callback URL** to your deployed backend:
   ```
   https://your-backend.railway.app/api/ussd
   ```

**Step 3 — Understand the request format**

Africa's Talking sends a POST request to your callback URL every time someone dials:

```json
{
  "sessionId": "ATid_abc123",
  "serviceCode": "*384*123#",
  "phoneNumber": "+254700000001",
  "text": "1"
}
```

Your current USSD service already handles `{ phone, text }` — it just needs a small wrapper
to read Africa's Talking's field names. Update `backend/src/routes/ussd.routes.js`:

```js
router.post('/', async (req, res) => {
  const phone = req.body.phone || req.body.phoneNumber;
  const text  = req.body.text  || '';
  const result = await handleUssd(phone, text);
  // Africa's Talking expects plain text response starting with CON or END
  const prefix = result.reply.includes('Status') || result.reply.includes('Created') ? 'END ' : 'CON ';
  res.set('Content-Type', 'text/plain');
  res.send(prefix + result.reply);
});
```

- `CON` = continue (show more options)
- `END` = end session (final message)

---

## Part 6 — Security Checklist Before Going Live

Go through this before real users touch your app:

- [ ] **Change JWT_SECRET** to a long random string (minimum 32 characters)
  ```
  JWT_SECRET=xK9#mP2$qL8@nR5&wT1^vY4*hJ7%bN0!
  ```
- [ ] **Enable HTTPS** — Railway and Render do this automatically. On a VPS, use Certbot + Nginx.
- [ ] **Add rate limiting** — prevents someone from spamming login attempts:
  ```bash
  npm install express-rate-limit
  ```
  ```js
  const rateLimit = require('express-rate-limit');
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
  ```
- [ ] **Add input validation** — use `joi` to validate all request bodies
- [ ] **Add security headers** — install `helmet`:
  ```bash
  npm install helmet
  ```
  ```js
  const helmet = require('helmet');
  app.use(helmet());
  ```
- [ ] **Remove test credentials** from `local_data/users.json` before production
- [ ] **Set up database backups** on Supabase (automatic) or Railway (manual export)
- [ ] **Never commit `.env`** to GitHub — it's already in `.gitignore` ✓

---

## Quick Reference

### Local Development Commands

```bash
# Backend (Terminal 1)
cd ~/Desktop/veritrade/backend
npm run dev                    # starts with nodemon (auto-reload)

# Mobile (Terminal 2)
cd ~/Desktop/veritrade/mobile
npx expo start                 # press 'r' to reload, 'a' for Android emulator
```

### Useful Curl Commands (Test Backend Without App)

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"0711111111","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0594737677","password":"123456789"}'

# Create escrow (replace TOKEN with your JWT)
curl -X POST http://localhost:5000/api/escrow/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"item":"MacBook Pro","amount":150000,"seller_phone":"0711111111"}'

# List transactions
curl http://localhost:5000/api/escrow/list \
  -H "Authorization: Bearer TOKEN"

# Test USSD
curl -X POST http://localhost:5000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{"phone":"0594737677","text":""}'
```

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `JWT_SECRET` | ✅ Yes | Signs auth tokens | `xK9mP2qL8nR5wT1` |
| `PORT` | No | Server port (default: 5000) | `5000` |
| `DATABASE_URL` | No | PostgreSQL URI (uses JSON files if missing) | `postgresql://...` |
| `MOOLRE_API_KEY` | No | Payment gateway key | `pk_live_...` |
