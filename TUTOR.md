# VeriTrade — Complete Beginner's Guide

Read this top to bottom. By the end you will understand every file, every concept, and how
everything connects. No experience assumed.

---

## 1. What Is VeriTrade?

VeriTrade is an **escrow platform**. Before understanding the code, understand the problem it solves.

### The Problem

Imagine you want to buy a phone from a stranger online.

- If you pay first → they can disappear with your money.
- If they send first → you can disappear without paying.

Neither side trusts the other. This is why millions of online trades go wrong every day.

### The Solution — Escrow

An **escrow** is a trusted middleman that holds the money:

```
Buyer pays → Escrow holds money → Seller delivers → Buyer confirms → Escrow releases money to Seller
```

Nobody loses. If something goes wrong, a dispute is raised and an admin reviews it.

VeriTrade is that middleman. It works as a **mobile app** and also as a **USSD service** (so even
people with basic phones can use it).

---

## 2. Project Structure — The Big Picture

```
veritrade/
│
├── backend/                ← The SERVER (Node.js)
│   ├── src/
│   │   ├── server.js           ← Entry point, starts the API
│   │   ├── routes/             ← URL definitions (what URLs exist)
│   │   ├── controllers/        ← Business logic (what those URLs do)
│   │   ├── services/           ← USSD engine
│   │   ├── middleware/         ← Token checker (guards protected routes)
│   │   └── config/
│   │       ├── database.js     ← PostgreSQL connection (production)
│   │       └── local_store.js  ← JSON file storage (development)
│   ├── local_data/         ← Auto-created JSON files (your "database" in dev)
│   │   ├── users.json
│   │   ├── transactions.json
│   │   └── disputes.json
│   ├── .env                ← Secret config values (never commit this)
│   └── package.json        ← Dependencies and scripts
│
├── mobile/                 ← The MOBILE APP (React Native / Expo)
│   ├── app/                ← Every file here = one screen
│   │   ├── _layout.tsx         ← Root layout, handles first-open redirect
│   │   ├── onboarding.tsx      ← 3-slide intro (shown once ever)
│   │   ├── login.tsx           ← Login screen
│   │   ├── register.tsx        ← Registration screen
│   │   └── (tabs)/             ← The 5 bottom-tab screens
│   │       ├── _layout.tsx         ← Tab bar configuration
│   │       ├── index.tsx           ← Home / Dashboard
│   │       ├── transactions.tsx    ← All trades
│   │       ├── create-escrow.tsx   ← New escrow form
│   │       ├── explore.tsx         ← USSD simulator
│   │       └── profile.tsx         ← User profile
│   ├── constants/theme.ts  ← Brand colors (blue + orange)
│   ├── hooks/useAuth.ts    ← Manages login state across the app
│   ├── services/api.ts     ← HTTP client (talks to the backend)
│   └── app.json            ← Expo app configuration
│
├── database/init.sql       ← PostgreSQL schema (tables)
├── TUTOR.md                ← This file
└── DEPLOYMENT.md           ← How to go live
```

---

## 3. Key Concepts You Must Know

### What is a Server / API?

The **backend** is a program that runs on a computer (eventually on the internet) and waits for
requests. The mobile app sends it messages like "log this user in" or "create an escrow" and the
server responds with data.

These messages are called **HTTP requests**. The specific URLs are called **API endpoints**.

Example:
```
Mobile app sends:  POST /api/auth/login   { phone: "0594737677", password: "123456789" }
Server responds:   { token: "eyJ...", user: { id: 1, name: "Default User" } }
```

### What is a JWT Token?

After you log in, the server gives you a **token** — a long string of characters. Think of it like
a wristband at a concert. You show it at the door (attach it to every request) to prove you are
logged in. You don't have to enter your password again.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token expires after 7 days. After that you must log in again.

### What is React Native / Expo?

**React Native** lets you write JavaScript/TypeScript code that runs as a real mobile app on both
iOS and Android. You write it once, it runs on both.

**Expo** is a toolchain on top of React Native that makes it easier to start, build, and test.
When you run `npx expo start` it creates a development server and lets you scan a QR code with
the **Expo Go** app on your phone to preview the app instantly.

### What is File-Based Routing?

Expo Router works like a website. The file path becomes the screen path:

```
app/login.tsx              → screen at /login
app/(tabs)/index.tsx       → screen at / (the default tab)
app/(tabs)/transactions.tsx → screen at /transactions
```

You never manually register screens. Just create a file and it exists.

---

## 4. The Backend — File by File

### `backend/src/server.js` — The Entry Point

This is the first file Node.js runs. It:
1. Creates an Express app
2. Attaches middleware (CORS so the mobile app can talk to it, JSON parser)
3. Registers all the routes
4. Starts listening on port 5000

```
GET  /                     → "VeriTrade API Running" (health check)
POST /api/auth/...         → auth routes
POST /api/escrow/...       → escrow routes
POST /api/ussd             → USSD routes
POST /api/moolre/webhook   → payment webhook
```

### `backend/src/routes/` — URL Definitions

Routes just map a URL + HTTP method to a controller function. They don't contain logic.

```js
// escrow.routes.js
router.post('/create', auth, createEscrow);
//           ↑ URL    ↑ middleware  ↑ controller function
```

The `auth` in the middle is the JWT middleware — it checks your token before allowing the request
through. If no token or invalid token → 401 Unauthorized.

### `backend/src/middleware/auth.middleware.js` — The Gatekeeper

Every protected route passes through here first:

1. Reads the `Authorization` header
2. Strips the `Bearer ` prefix to get the raw token
3. Verifies the token using `JWT_SECRET`
4. If valid → attaches the user info to the request and continues
5. If invalid or missing → returns 401 immediately

### `backend/src/controllers/auth.controller.js` — Register & Login

**Register:**
1. Reads `name`, `phone`, `password` from the request body
2. Hashes the password with `bcrypt` (one-way encryption — the original password is never stored)
3. Saves the user to `local_data/users.json`
4. Creates a JWT token and returns it

**Login:**
1. Finds the user by phone number
2. Compares the submitted password against the stored hash using `bcrypt.compare()`
3. If they match → creates and returns a JWT token
4. If not → returns "invalid credentials"

### `backend/src/controllers/escrow.controller.js` — The Core Logic

| Function | What it does |
|----------|-------------|
| `createEscrow` | Creates a transaction with a random 6-digit code, status = PENDING |
| `listTransactions` | Returns all transactions for the logged-in user |
| `pay` | Changes status from PENDING → PAID (funds are "locked") |
| `confirm` | Changes status from PAID → COMPLETED (seller gets paid) |
| `dispute` | Changes status to DISPUTED, creates a dispute record |
| `cancel` | Changes status from PENDING → CANCELLED |

The `transaction_code` is a random 6-digit number like `483921`. This is what you share with your
seller to identify the trade.

### `backend/src/services/ussd.service.js` — The USSD Engine

USSD is a session-based protocol. Every time a user sends a message, the server must remember
where they are in the menu. This is done with a `Map` (in-memory dictionary keyed by phone number).

```
sessions = {
  "+254700000001": { step: "CREATE_ITEM", data: {} },
  "+254700000002": { step: "MENU", data: {} }
}
```

When a message arrives:
1. Look up the session for that phone
2. Based on `step`, know what the user is answering
3. Return the next prompt
4. Update the step

The 6 menu options:
```
1 → Create Escrow   (3 steps: item → amount → seller phone)
2 → Pay             (1 step: enter code)
3 → Confirm         (1 step: enter code)
4 → Check Status    (1 step: enter code)
5 → Dispute         (2 steps: code → reason)
6 → Cancel          (1 step: enter code)
```

### `backend/src/config/local_store.js` — The Dev Database

Instead of requiring PostgreSQL to be installed, this file reads and writes plain JSON files.
Functions:

| Function | What it does |
|----------|-------------|
| `addUser(...)` | Pushes a new user to `users.json` |
| `findUserByPhone(phone)` | Searches `users.json` by phone |
| `addTransaction(...)` | Pushes a new transaction to `transactions.json` |
| `findTransactionByCode(code)` | Searches by 6-digit code |
| `listTransactionsForUser(id)` | Filters transactions by buyer or seller ID |
| `updateTransactionStatus(id, status)` | Updates the status field |
| `addDispute(...)` | Pushes a dispute to `disputes.json` |

### `backend/.env` — Secret Configuration

```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/veritrade_db
JWT_SECRET=change_this
```

- `PORT` — which port the server listens on
- `DATABASE_URL` — if this looks like a real PostgreSQL URL, the app uses PostgreSQL. Otherwise it falls back to local JSON files.
- `JWT_SECRET` — the key used to sign tokens. **Change this before going live.**

---

## 5. The Mobile App — File by File

### `mobile/constants/theme.ts` — Brand Colors

All colors are defined once here. Every screen imports from this file.

```ts
Brand.primary   = '#1A56DB'  // Deep blue — headers, buttons, active states
Brand.accent    = '#F97316'  // Vivid orange — create button, highlights
Brand.success   = '#22C55E'  // Green — completed transactions
Brand.error     = '#EF4444'  // Red — disputes, errors
```

`Colors.light` and `Colors.dark` define background, card, border, text for each mode.

### `mobile/services/api.ts` — The HTTP Client

This file creates an **Axios** instance (Axios is a library for making HTTP requests).

```ts
const BASE_URL = 'http://100.66.247.137:5000/api';
```

The **interceptor** automatically attaches your JWT token to every request:
```ts
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

So when you call `api.get('/escrow/list')` from any screen, the token goes along automatically.
You don't have to think about it.

### `mobile/hooks/useAuth.ts` — Auth State

A **hook** in React is a function that manages state (remembered data). `useAuth` tracks:

- `token` — the JWT string (or null if not logged in)
- `user` — the logged-in user's info (name, phone, role)

It exposes three functions you can call from any screen:

```ts
const { user, login, register, logout } = useAuth();

await login('0594737677', '123456789');   // calls POST /api/auth/login
await register('John', '07...', 'pass'); // calls POST /api/auth/register
await logout();                           // clears token from storage
```

Both `token` and `user` are saved to **AsyncStorage** — a key-value store on the device —
so they persist even when the app is closed.

### `mobile/app/_layout.tsx` — The Root Layout

This runs once when the app opens. It checks:

1. Has the user completed onboarding? (`AsyncStorage.getItem('hasOnboarded')`)
   - No → redirect to `/onboarding`
2. Does a JWT token exist? (`AsyncStorage.getItem('token')`)
   - No → redirect to `/login`
3. Both exist → the normal tab screens load

This is the "bouncer" of the app.

### `mobile/app/onboarding.tsx` — 3-Slide Intro

Shown **once ever** the first time someone opens the app. Uses a horizontal `FlatList` as a
swiper. Three slides:

1. 🔒 Trade Without Fear
2. 📦 Simple Escrow
3. 📱 Works on Any Phone

When finished, writes `hasOnboarded = "true"` to AsyncStorage so it never shows again, then
redirects to `/login`.

### `mobile/app/login.tsx` — Login Screen

- Blue header with the VeriTrade logo
- White card form below
- Error message shown in red if login fails
- On success → redirects to `/(tabs)` (the main app)

### `mobile/app/register.tsx` — Register Screen

Same style as login, plus:
- **Role picker** — tap BUYER or SELLER (sends this to the server on register)
- Password length validation (min 6 characters)

### `mobile/app/(tabs)/_layout.tsx` — Tab Bar

Defines the 5 tabs and their appearance:

| Position | Tab | Icon |
|----------|-----|------|
| 1 | Home | 🏠 |
| 2 | Activity | 📋 |
| **3 (center)** | **Create** | **➕ (floating orange circle)** |
| 4 | USSD | 📱 |
| 5 | Profile | 👤 |

The center button is styled differently — it floats above the tab bar with a shadow.

### `mobile/app/(tabs)/index.tsx` — Home Dashboard

Loads when the app opens. Shows:

- **Greeting** with the user's first name
- **3 stat cards** — Total trades, Active trades, Completed trades (fetched from `/api/escrow/list`)
- **Quick action buttons** — New Escrow, My Trades, USSD Info
- **Recent transactions** — the last 3 (with status color badges)

Pull down to refresh.

### `mobile/app/(tabs)/create-escrow.tsx` — New Escrow

Form with:
- Item/service description
- Amount in KES
- Seller's phone number

On submit → calls `POST /api/escrow/create`. On success, shows a big green card with the
**transaction code** to share with the seller.

### `mobile/app/(tabs)/transactions.tsx` — All Trades

Shows every transaction. Key features:

- **Filter pills** — tap ALL / PENDING / PAID / COMPLETED / DISPUTED to filter
- **Per-card action buttons** that appear based on status:
  - PENDING → "💳 Mark as Paid"
  - PAID → "✅ Confirm Delivery" + "⚠️ Dispute"

Pull down to refresh.

### `mobile/app/(tabs)/explore.tsx` — USSD Simulator

Two sections:

1. **Info** — shows the real dial code `*384*1#` and lists all 6 menu options
2. **Live Simulator** — a chat-style interface where you enter your phone number and then
   send menu option numbers exactly like a real USSD session. Uses `POST /api/ussd`.

### `mobile/app/(tabs)/profile.tsx` — Profile

Shows the logged-in user's name, phone, role badge, and KYC status.
Menu items link to notifications, security, support, USSD info, and terms.
Logout button with a confirmation alert.

---

## 6. Transaction Lifecycle

Every escrow transaction goes through these stages:

```
┌─────────┐
│ PENDING │  ← Created. Waiting for buyer to pay.
└────┬────┘
     │  buyer pays
     ▼
┌──────┐
│ PAID │     ← Funds locked. Waiting for seller to deliver.
└──┬───┘
   │  buyer confirms delivery
   ▼
┌───────────┐
│ COMPLETED │  ← Seller receives funds. Trade done. ✅
└───────────┘

From PENDING or PAID:
   → DISPUTED   ← Something went wrong, admin reviews
   
From PENDING only:
   → CANCELLED  ← Trade called off before payment
```

---

## 7. How USSD Works (Deep Dive)

USSD stands for **Unstructured Supplementary Service Data**. It's a protocol built into every
SIM card. When you dial `*384*1#` on any phone:

1. Your phone sends a request to your mobile network (Safaricom, MTN, etc.)
2. The network forwards it to a server you registered (VeriTrade's backend)
3. Your server responds with a text menu
4. The user picks an option and the cycle continues

**Why it matters:** It works on a ₵20 Nokia from 2005. No smartphone, no internet, no app needed.
This is huge in markets where smartphones are not universal.

The request your server receives looks like:
```json
{ "phone": "+254700000001", "text": "1*iPhone 13*45000" }
```

`text` is everything the user has typed, joined with `*`. Your USSD service splits this and
figures out where in the conversation the user is.

In development, the **USSD tab simulator** lets you test this flow exactly as if you were on a
real phone.

---

## 8. How the Code All Connects

Here is the full flow for "Buyer creates an escrow":

```
1. User fills form in create-escrow.tsx
2. Taps "Lock Funds in Escrow"
3. api.ts sends:  POST /api/escrow/create  { item, amount, seller_phone }
   (token is attached automatically by the interceptor)
4. server.js receives the request at /api/escrow/create
5. auth.middleware.js checks the token ✓
6. escrow.controller.js → createEscrow() runs:
   a. Validates item, amount, seller_phone
   b. Generates random 6-digit code
   c. Looks up seller in local_data/users.json
   d. Saves transaction to local_data/transactions.json
   e. Returns { transactionCode: "483921", transaction: {...} }
7. create-escrow.tsx receives the response
8. Shows the success card with the transaction code
```

---

## 9. Running the Project

### First Time Setup

```bash
# Terminal 1 — Backend
cd ~/Desktop/veritrade/backend
npm install
npm run dev
# You should see: "Server started on 5000"

# Terminal 2 — Mobile
cd ~/Desktop/veritrade/mobile
npm install
npx expo start
# Scan QR code with Expo Go on your phone
```

### Default Login

| Phone | Password |
|-------|----------|
| 0594737677 | 123456789 |

### Checking Your IP

If login says "Network Error" or "Invalid credentials" when the password is right, your IP is
wrong. Run this in the terminal:

```bash
ip addr show | grep "inet " | grep -v 127
```

Copy the `192.168.x.x` or `100.x.x.x` number and paste it into
`mobile/services/api.ts` as:
```ts
const BASE_URL = 'http://YOUR_IP_HERE:5000/api';
```

Then press `r` in the Expo terminal to reload.

---

## 10. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Network request failed" | Wrong IP in api.ts | Update BASE_URL with your machine's IP |
| "invalid credentials" | Backend not running | Start with `npm run dev` in backend/ |
| "seller not found" | Seller not registered | Register seller first, then create escrow |
| Blank white screen | Expo cache | Run `npx expo start --clear` |
| "missing token" | Not logged in | The root layout should have redirected to login — check `_layout.tsx` |
| Port 5000 in use | Another process | Kill it: `kill $(lsof -t -i:5000)` or change PORT in `.env` |

---

## 11. What Each Dependency Does

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| `express` | The web framework — handles HTTP requests |
| `cors` | Allows the mobile app (different origin) to talk to the server |
| `dotenv` | Loads `.env` file into `process.env` |
| `bcrypt` | Hashes passwords — never store plain text passwords |
| `jsonwebtoken` | Creates and verifies JWT tokens |
| `pg` | PostgreSQL client (used in production) |
| `nodemon` | Dev tool — restarts server automatically when you save a file |

### Mobile (`mobile/package.json`)

| Package | Purpose |
|---------|---------|
| `expo` | The Expo SDK — core toolchain |
| `expo-router` | File-based navigation (each file = a screen) |
| `react-native` | The cross-platform mobile framework |
| `axios` | HTTP client for talking to the backend |
| `@react-native-async-storage/async-storage` | Persistent key-value storage on device |

---

## 12. Next Steps (After You Understand This)

Once you're comfortable with the codebase, here is the natural progression:

1. **Add input validation** on the backend (use the `joi` or `zod` library)
2. **Connect a real database** (PostgreSQL on Supabase — it's free)
3. **Add real payments** (integrate Africa's Talking payment or Flutterwave)
4. **Add push notifications** (Expo Notifications) when a trade status changes
5. **KYC verification** — require ID upload before allowing transactions above a threshold
6. **Admin dashboard** — a web interface to review disputes
7. **Deploy** — follow `DEPLOYMENT.md`

---

## 13. Moolre — Real Mobile Money Payments (Ghana)

Right now when a buyer "pays", the app just changes a status field. In production, you want
**real money** moving through Ghana's mobile money networks (MTN MoMo, Vodafone Cash, AirtelTigo Money).

That's where **Moolre** comes in.

### What is Moolre?

Moolre is a Ghanaian payment gateway that lets your app collect money from any MoMo wallet
with a simple API call. Instead of building integrations with MTN, Vodafone, and AirtelTigo
separately, Moolre gives you one API that works with all of them.

Website: [moolre.com](https://moolre.com)

---

### How It Fits Into VeriTrade

```
Buyer taps "Pay" in the app
  ↓
App calls  POST /api/moolre/pay  { transactionCode, phone, network }
  ↓
Backend calls Moolre API → Moolre sends a MoMo prompt to buyer's phone
  ↓
Buyer enters PIN on their phone to approve
  ↓
Moolre sends a webhook to  POST /api/moolre/webhook
  ↓
Backend verifies the webhook signature (HMAC-SHA256)
  ↓
Transaction status changes from PENDING → PAID  ✅
```

The buyer never leaves the app. The MoMo PIN prompt appears on their phone automatically.

---

### The Three Backend Files

#### `backend/src/services/moolre.service.js`

Contains the low-level API calls:

| Function | What it does |
|----------|-------------|
| `initiateCollection(params)` | Sends a payment request to Moolre. Moolre then prompts the customer's phone. |
| `checkStatus(reference)` | Polls Moolre for the current payment status of a transaction. |
| `verifyWebhookSignature(body, sig)` | Checks that an incoming webhook is genuinely from Moolre (not a fake request). Uses HMAC-SHA256. |

#### `backend/src/controllers/moolre.controller.js`

Contains the route handlers:

| Handler | Route | What it does |
|---------|-------|-------------|
| `initiatePay` | `POST /api/moolre/pay` | Looks up the transaction, calls Moolre to request payment from the buyer's MoMo. |
| `status` | `GET /api/moolre/status/:reference` | Returns the current payment status from Moolre. |
| `webhook` | `POST /api/moolre/webhook` | Called automatically by Moolre when payment is confirmed. Updates transaction to PAID. |

#### `backend/src/routes/moolre.routes.js`

Registers the URLs. The `/webhook` route has **no JWT auth** — it's called by Moolre's servers,
not the mobile app. Instead it uses the HMAC signature to verify authenticity.

---

### Environment Variables Required

Add these to `backend/.env`:

```env
MOOLRE_API_KEY=your_api_key_from_moolre_dashboard
MOOLRE_URL=https://api.moolre.com/v1
MOOLRE_WEBHOOK_SECRET=your_webhook_secret_from_moolre_dashboard
APP_BASE_URL=https://your-deployed-backend-url.railway.app
```

- `MOOLRE_API_KEY` — from your Moolre dashboard after signing up
- `MOOLRE_WEBHOOK_SECRET` — used to verify webhook signatures (prevents fake webhooks)
- `APP_BASE_URL` — your live backend URL, so Moolre knows where to send the webhook

---

### Getting Your API Keys

1. Sign up at [moolre.com](https://moolre.com)
2. Go to **Dashboard → API Keys**
3. Copy your **API Key** → paste into `MOOLRE_API_KEY`
4. Go to **Webhooks → Create Webhook**
5. Set URL: `https://your-backend.railway.app/api/moolre/webhook`
6. Copy the **Webhook Secret** → paste into `MOOLRE_WEBHOOK_SECRET`

---

### What Happens With the `initiatePay` Request

When the mobile app calls `POST /api/moolre/pay`:

```json
{
  "transactionCode": "483921",
  "phone": "0244000001",
  "network": "MTN"
}
```

The backend builds this payload and sends it to Moolre:

```json
{
  "phone": "0244000001",
  "amount": 450.00,
  "currency": "GHS",
  "reference": "483921",
  "narration": "VeriTrade Escrow: iPhone 15",
  "network": "MTN",
  "callback_url": "https://your-backend.railway.app/api/moolre/webhook"
}
```

The customer's phone receives a MoMo prompt like:
```
MTN Mobile Money
Pay GHS 450.00 to VeriTrade Escrow: iPhone 15
Enter PIN to confirm
```

---

### The Webhook — Most Important Part

After the customer enters their PIN, Moolre sends a POST to your webhook URL:

```json
{
  "reference": "483921",
  "status": "SUCCESS",
  "amount": 450.00,
  "phone": "0244000001",
  "network": "MTN",
  "timestamp": "2026-06-22T00:30:00Z"
}
```

Your backend:
1. Reads the `x-moolre-signature` header
2. Runs HMAC-SHA256 on the raw request body using your `MOOLRE_WEBHOOK_SECRET`
3. Compares — if they match, the webhook is genuine
4. Updates the transaction to `PAID`

If the signature doesn't match, the request is rejected with a 400 error. This protects you
from someone sending fake "payment confirmed" messages to your webhook.

---

### Testing Without Real Money

Moolre provides a **sandbox environment** for testing. Use sandbox credentials from your
dashboard and set:

```env
MOOLRE_URL=https://sandbox.moolre.com/v1
```

In sandbox mode, no real money moves. You can simulate successful and failed payments.

---

### Mobile App Integration (Future)

To wire the "Pay" button in the app to real Moolre payments, update
`mobile/app/(tabs)/transactions.tsx` — replace the `api.post('/escrow/pay', ...)` call
for PENDING transactions with:

```ts
// Instead of:
await api.post('/escrow/pay', { transactionCode: tx.transaction_code });

// Use:
await api.post('/moolre/pay', {
  transactionCode: tx.transaction_code,
  phone: user.phone,        // buyer's phone from useAuth()
  network: 'MTN',           // or let user pick
});
// Transaction will move to PAID automatically when Moolre webhook fires
```
