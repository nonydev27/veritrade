# VeriTrade — Complete Beginner's Guide

Read this top to bottom. Every file, every concept, every line that matters — explained.
No experience assumed. By the end you will understand exactly how this app was built and how to build your own.

---

## Table of Contents

1. [What Is VeriTrade?](#1-what-is-veritrade)
2. [The Tech Stack — What Tools We Use](#2-the-tech-stack)
3. [Core Concepts You Must Know First](#3-core-concepts-you-must-know-first)
4. [Project Structure — The Big Picture](#4-project-structure)
5. [Configuration Files](#5-configuration-files)
6. [The Backend — File by File](#6-the-backend)
7. [The Mobile App — Concepts First](#7-the-mobile-app-concepts)
8. [Mobile — Constants and Services](#8-mobile-constants-and-services)
9. [Mobile — Hooks](#9-mobile-hooks)
10. [Mobile — The Splash Screen](#10-mobile-the-splash-screen)
11. [Mobile — Navigation and Layouts](#11-mobile-navigation-and-layouts)
12. [Mobile — Every Screen Explained](#12-mobile-every-screen-explained)
13. [Transaction Lifecycle](#13-transaction-lifecycle)
14. [How Everything Connects](#14-how-everything-connects)
15. [Styling in React Native](#15-styling-in-react-native)
16. [Running the Project](#16-running-the-project)
17. [Common Errors and Fixes](#17-common-errors-and-fixes)
18. [All Dependencies Explained](#18-all-dependencies-explained)
19. [Moolre — Real Mobile Money Payments](#19-moolre-real-mobile-money-payments)
20. [What to Build Next](#20-what-to-build-next)

---

## 1. What Is VeriTrade?

VeriTrade is an **escrow platform** for Ghana. Before understanding the code, understand the problem.

### The Problem

Imagine you want to buy a phone from a stranger online.

- If you pay first → they can disappear with your money.
- If they send first → you can disappear without paying.

Neither side trusts the other. This is why millions of online trades go wrong.

### The Solution — Escrow

An **escrow** is a trusted middleman that holds the money:

```
Buyer pays → Escrow holds money → Seller delivers → Buyer confirms → Escrow releases money to Seller
```

Nobody loses. If something goes wrong, a dispute is raised.

VeriTrade is that middleman — as a **mobile app** and a **USSD service** (works on any phone, no internet needed).

---

## 2. The Tech Stack

These are all the technologies used. You don't need to understand them all deeply yet — just know what each one is for.

| Technology | What it is | Why we use it |
|-----------|-----------|--------------|
| **TypeScript** | JavaScript with types | Catches bugs before they happen |
| **React Native** | Framework for mobile apps | Write once, runs on iOS and Android |
| **Expo** | Toolchain on top of React Native | Faster setup, QR code testing |
| **Expo Router** | File-based navigation | Each file automatically becomes a screen |
| **Node.js** | JavaScript on the server | Runs the backend API |
| **Express** | Web framework for Node.js | Handles incoming HTTP requests |
| **Axios** | HTTP client | Makes API calls from the mobile app |
| **AsyncStorage** | Key-value storage on device | Saves your login token between app opens |
| **JWT** | JSON Web Token | Proves who you are without a password each time |
| **bcrypt** | Password hashing | Stores passwords safely |
| **react-native-reanimated** | Animation library | Powers the splash screen animations |
| **expo-linear-gradient** | Gradient colors | Blue-to-dark-blue backgrounds |
| **expo-blur** | Frosted glass effect | Glass card backgrounds |
| **pycairo** | Python drawing library | Generates the app icon PNG files |

---

## 3. Core Concepts You Must Know First

### What Is a Component?

In React (and React Native), everything on screen is a **component** — a function that returns what to draw.

```tsx
function MyButton() {
  return <Text>Click me</Text>;
}
```

You can use this component anywhere:
```tsx
<MyButton />
```

Components can receive **props** (properties) — data passed in from outside:

```tsx
function Greeting({ name }: { name: string }) {
  return <Text>Hello, {name}!</Text>;
}

// Usage:
<Greeting name="Kofi" />
// Shows: "Hello, Kofi!"
```

### What Is State?

**State** is data that a component remembers, and when it changes, the screen re-draws.

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);  // starts at 0
  
  return (
    <TouchableOpacity onPress={() => setCount(count + 1)}>
      <Text>Tapped {count} times</Text>
    </TouchableOpacity>
  );
}
```

- `count` — the current value
- `setCount` — the function to update it
- `useState(0)` — starts at 0

Every time `setCount` is called, the component re-renders (redraws itself).

### What Is a Hook?

A **hook** is a special function that lets components use React features. Every hook name starts with `use`.

```tsx
useState()       // Manages changing data
useEffect()      // Runs code at specific times (on load, when data changes)
useRouter()      // Gets navigation functions
useColorScheme() // Detects dark or light mode
```

### What Is `useEffect`?

`useEffect` runs code **after** the component appears on screen (or when certain values change).

```tsx
useEffect(() => {
  // This runs once when the screen loads
  loadData();
}, []);  // ← empty array means "only run once"
```

```tsx
useEffect(() => {
  // This runs every time `userId` changes
  loadUserProfile(userId);
}, [userId]);  // ← runs when userId changes
```

### What Is `async`/`await`?

Network requests (API calls, file reads) take time. `async`/`await` lets you write code that waits for them without freezing everything.

```tsx
// Without async/await (old way — hard to read)
api.get('/escrow/list').then(res => {
  setData(res.data);
}).catch(err => {
  console.log('error', err);
});

// With async/await (modern way — reads like normal code)
async function loadData() {
  try {
    const res = await api.get('/escrow/list');  // waits here
    setData(res.data);                          // runs after
  } catch (err) {
    console.log('error', err);
  }
}
```

`async` marks a function as asynchronous. `await` pauses that function until a promise resolves.

### What Is TypeScript?

TypeScript is JavaScript with **types**. Types tell you what kind of data a variable holds.

```tsx
// JavaScript (no types — errors discovered at runtime)
let name = "Kofi";
name = 42;  // no error in JS, but this breaks things

// TypeScript (types — errors caught while writing code)
let name: string = "Kofi";
name = 42;  // ← TypeScript shows a red underline immediately
```

Types in this project:
```tsx
string       // text: "hello", "0594737677"
number       // numbers: 42, 450.00
boolean      // true or false
string | null  // either a string or null (nothing)
any          // any type (avoid using this — it defeats the purpose)
```

### What Is an Interface / Type?

A type that describes the shape of an object:

```tsx
interface User {
  name: string;
  phone: string;
  role: 'BUYER' | 'SELLER';  // can only be one of these two values
}

// Now TypeScript knows what a User looks like:
const user: User = { name: 'Kofi', phone: '0594...', role: 'BUYER' };
```

### What Is `StyleSheet.create`?

React Native doesn't use CSS. Styles are written as JavaScript objects. `StyleSheet.create` organises them:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060C1A',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

// Usage:
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>
```

---

## 4. Project Structure

```
veritrade/
│
├── backend/                ← The SERVER (Node.js / Express)
│   ├── src/
│   │   ├── server.js           ← Entry point, starts the API
│   │   ├── routes/             ← URL definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── escrow.routes.js
│   │   │   ├── ussd.routes.js
│   │   │   └── moolre.routes.js
│   │   ├── controllers/        ← Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── escrow.controller.js
│   │   │   └── moolre.controller.js
│   │   ├── services/
│   │   │   ├── ussd.service.js     ← USSD state machine
│   │   │   └── moolre.service.js   ← Payment gateway calls
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  ← JWT token checker
│   │   └── config/
│   │       ├── database.js         ← PostgreSQL connection
│   │       └── local_store.js      ← JSON file storage (dev)
│   ├── local_data/             ← Auto-created JSON files (dev "database")
│   │   ├── users.json
│   │   ├── transactions.json
│   │   └── disputes.json
│   ├── .env                    ← Secret config (never commit)
│   └── package.json
│
├── mobile/                 ← The MOBILE APP (React Native / Expo)
│   ├── app/                    ← Every file = one screen (Expo Router)
│   │   ├── _layout.tsx             ← Root layout + auth redirect
│   │   ├── onboarding.tsx          ← 3-slide intro (first launch only)
│   │   ├── login.tsx               ← Login screen
│   │   ├── register.tsx            ← Register screen
│   │   └── (tabs)/                 ← Tab navigation group
│   │       ├── _layout.tsx             ← Tab bar setup
│   │       ├── index.tsx               ← Home dashboard
│   │       ├── transactions.tsx        ← All trades
│   │       ├── create-escrow.tsx       ← New escrow form
│   │       ├── explore.tsx             ← USSD info + simulator
│   │       └── profile.tsx             ← User profile
│   ├── components/
│   │   └── animated-splash.tsx     ← Custom animated splash screen
│   ├── constants/
│   │   └── theme.ts                ← Brand colors + dark/light themes
│   ├── hooks/
│   │   ├── useAuth.ts              ← Login/logout state management
│   │   └── use-color-scheme.ts     ← Dark/light mode detection
│   ├── services/
│   │   └── api.ts                  ← Axios HTTP client
│   ├── assets/images/              ← App icons, splash images
│   ├── scripts/
│   │   └── generate-assets.py      ← Generates PNG icons from Python
│   ├── app.json                    ← Expo app configuration
│   ├── package.json                ← Dependencies
│   └── tsconfig.json               ← TypeScript settings
│
├── database/init.sql           ← PostgreSQL schema (tables)
├── TUTOR.md                    ← This file
└── DEPLOYMENT.md               ← How to go live
```

---

## 5. Configuration Files

### `mobile/package.json` — Project Dependencies

This file tells Node.js what packages the project needs and what commands to run.

```json
{
  "name": "veritrade-mobile",
  "scripts": {
    "start": "expo start",       ← Run this to open the dev server
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "expo": "~54.0.34",          ← Core Expo SDK
    "expo-router": "~6.0.23",   ← File-based navigation
    "react-native": "0.81.5",   ← The mobile framework
    "axios": "~1.18.0",         ← HTTP requests
    ...
  }
}
```

When you run `npm install`, it downloads everything listed in `dependencies` into the `node_modules` folder.

### `mobile/app.json` — Expo App Configuration

This file configures the app itself — name, icons, splash screen, permissions:

```json
{
  "expo": {
    "name": "VeriTrade",           ← App name shown on phone
    "slug": "veritrade",           ← URL-safe identifier
    "version": "1.0.0",            ← App version
    "icon": "./assets/images/icon.png",   ← App icon file
    "orientation": "portrait",     ← Don't allow landscape rotation
    "userInterfaceStyle": "automatic",    ← Respect device dark/light mode
    "plugins": [
      "expo-router",               ← Enable file-based routing
      ["expo-splash-screen", {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 220,         ← Shield logo size on native splash
        "backgroundColor": "#060C1A"  ← Dark navy background
      }]
    ]
  }
}
```

The **native splash** (controlled here) appears the instant the app opens — before any JavaScript runs.

### `mobile/tsconfig.json` — TypeScript Settings

```json
{
  "compilerOptions": {
    "strict": true,               ← Strictest type checking (good)
    "paths": {
      "@/*": ["./*"]              ← @/ is shorthand for the project root
    }
  }
}
```

The `@/` path alias means you can write:
```tsx
import { Brand } from '@/constants/theme';
// Instead of:
import { Brand } from '../../constants/theme';
```

Much cleaner when files are deeply nested.

### `mobile/eas.json` — Build Configuration

EAS (Expo Application Services) builds production APK/IPA files.

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }  ← APK for testing on real Android devices
    },
    "production": {
      "android": { "buildType": "app-bundle" }  ← AAB for Play Store
    }
  }
}
```

You run `eas build` to create a real binary file you can share or submit to the app stores.

---

## 6. The Backend

### `backend/src/server.js` — The Entry Point

This is the first file Node.js runs. Every server starts with something like this:

```js
const express = require('express');
const app = express();

// Middleware — code that runs on every request
app.use(cors());          // Allow cross-origin requests (mobile app on different IP)
app.use(express.json());  // Parse JSON request bodies

// Routes — attach groups of URLs
app.use('/api/auth',   authRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/ussd',   ussdRoutes);

// Start listening
app.listen(5000, () => console.log('Server started on 5000'));
```

**What is middleware?** Code that sits between the request arriving and your function handling it.
Think of it as a conveyor belt — the request passes through each piece of middleware in order.

### `backend/src/routes/` — URL Definitions

Routes map URLs to functions. They contain no logic — just wiring.

```js
// escrow.routes.js
const router = express.Router();

router.post('/create',    auth, createEscrow);   // POST /api/escrow/create
router.get('/list',       auth, listTransactions);
router.post('/pay',       auth, pay);
router.post('/confirm',   auth, confirm);
router.post('/dispute',   auth, dispute);

// "auth" is middleware — runs BEFORE the controller
// If token is invalid, it stops here and returns 401
```

### `backend/src/middleware/auth.middleware.js` — The JWT Gatekeeper

Every protected route goes through here first:

```js
function auth(req, res, next) {
  // 1. Get the Authorization header: "Bearer eyJhbG..."
  const header = req.headers.authorization;
  
  // 2. Split off "Bearer " to get just the token
  const token = header.split(' ')[1];
  
  // 3. Verify it with the secret key
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // 4. Attach the user info to the request
  req.user = decoded;
  
  // 5. Continue to the controller
  next();
}
```

If verification fails (token expired, tampered, missing) → returns `401 Unauthorized` and the request stops.

### `backend/src/controllers/auth.controller.js` — Register & Login

**Register:**
```
1. Read name, phone, password from request body
2. Hash the password with bcrypt (never store plain text)
3. Save user to users.json (or PostgreSQL in production)
4. Create a JWT token containing { id, name, phone, role }
5. Return { token, user }
```

**Why do we hash passwords?**
If your database is ever leaked (it happens), hackers shouldn't be able to read everyone's passwords.
bcrypt turns `"123456"` into `"$2b$10$vI8aWBnW3fID.ZQ4/zo1G..."`. You can't reverse it.
But you can verify a password against a hash: `bcrypt.compare("123456", hash)` → `true/false`.

**Login:**
```
1. Find user by phone number
2. Compare submitted password against stored hash
3. If match → create JWT, return it
4. If no match → return "Invalid credentials"
```

### `backend/src/controllers/escrow.controller.js` — Escrow Logic

| Function | What happens |
|----------|-------------|
| `createEscrow` | Generates a random 6-digit code, saves transaction with status = PENDING |
| `listTransactions` | Returns all transactions where the user is buyer OR seller |
| `pay` | Changes PENDING → PAID |
| `confirm` | Changes PAID → COMPLETED |
| `dispute` | Changes status → DISPUTED, creates a dispute record |
| `cancel` | Changes PENDING → CANCELLED |

The **transaction code** (e.g. `483921`) is the shared identifier. The buyer creates it, shares it with the seller. Both use it to reference the same trade.

### `backend/src/services/ussd.service.js` — The USSD State Machine

USSD is session-based. When someone dials `*384*1#`, the server must remember where they are in the conversation.

```js
// An in-memory map of sessions
const sessions = new Map();

// Example state:
// "0244000001" → { step: "CREATE_ITEM", data: {} }
// "0244000002" → { step: "MENU", data: {} }
```

When a request arrives:
1. Look up the session by phone number
2. Based on the current `step`, know what the user just answered
3. Process that answer and store it in `data`
4. Return the next prompt text
5. Update the step

The 6 menu options:
```
1 → Create Escrow    (steps: item → amount → seller phone)
2 → Pay             (steps: enter code)
3 → Confirm         (steps: enter code)
4 → Check Status    (steps: enter code)
5 → Dispute         (steps: code → reason)
6 → Cancel          (steps: enter code)
```

### `backend/src/config/local_store.js` — The Dev Database

Instead of needing PostgreSQL installed, this file reads/writes plain JSON files. Perfect for development.

| Function | What it does |
|----------|-------------|
| `addUser(user)` | Adds a new object to the users array in users.json |
| `findUserByPhone(phone)` | Searches users.json and returns the matching user |
| `addTransaction(tx)` | Adds to transactions.json |
| `findTransactionByCode(code)` | Finds by 6-digit code |
| `listTransactionsForUser(id)` | Returns all trades where buyer_id or seller_id matches |
| `updateTransactionStatus(id, status)` | Finds by id and updates the status field |
| `addDispute(dispute)` | Adds to disputes.json |

In production (when `DATABASE_URL` is set to a real PostgreSQL URL), the controllers use `database.js` instead.

### `backend/.env` — Secret Configuration

```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/veritrade_db
JWT_SECRET=change_this_to_something_random_and_long
MOOLRE_API_KEY=your_key
MOOLRE_WEBHOOK_SECRET=your_webhook_secret
```

**The `.gitignore` file** prevents `.env` from ever being committed to git.
Never put real secrets in your code files — only in `.env`.

---

## 7. The Mobile App — Concepts First

Before reading the screens, make sure you understand these mobile-specific ideas.

### React Native Elements vs HTML

In a website you'd write `<div>`, `<p>`, `<button>`.
In React Native, those don't exist. Instead:

| Web (HTML) | React Native | What it does |
|-----------|-------------|-------------|
| `<div>` | `<View>` | A container box |
| `<p>`, `<span>` | `<Text>` | Shows text |
| `<button>` | `<TouchableOpacity>` | A pressable area |
| `<input>` | `<TextInput>` | Text input field |
| `<ul>` / long lists | `<FlatList>` | Efficient scrollable list |
| `<img>` | `<Image>` | Shows an image |
| `<div style="overflow-y:auto">` | `<ScrollView>` | Scrollable container |

Everything must be inside a `<View>` at the top level. Text must always be inside a `<Text>`.

### Flexbox in React Native

React Native uses **flexbox** for layout — the same concept as CSS flexbox, but with different defaults.

In React Native:
- `flexDirection` defaults to `'column'` (vertical stacking)
- `flex: 1` means "take up all available space"

```tsx
// Side-by-side layout:
<View style={{ flexDirection: 'row' }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// Take full height:
<View style={{ flex: 1 }}>
  {/* fills the screen */}
</View>

// Centred content:
<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
  <Text>I am centred</Text>
</View>
```

### Navigation with Expo Router

Expo Router works like a filesystem router (same idea as Next.js for websites).

```
File path                         Screen accessible at
────────────────────────────────────────────────────────
app/_layout.tsx                → Root layout (wraps everything)
app/login.tsx                  → /login
app/onboarding.tsx             → /onboarding
app/(tabs)/_layout.tsx         → Tab navigation wrapper
app/(tabs)/index.tsx           → / (first tab)
app/(tabs)/transactions.tsx    → /transactions
app/(tabs)/create-escrow.tsx   → /create-escrow
app/(tabs)/explore.tsx         → /explore
app/(tabs)/profile.tsx         → /profile
```

The `(tabs)` folder name with parentheses means it's a **group** — the group name doesn't appear in the URL.

**Navigating between screens:**
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();

router.push('/login');          // Go to login (can go back)
router.replace('/login');       // Go to login (can't go back — replaces history)
router.back();                  // Go back one screen
```

### `StyleSheet.absoluteFill`

A shorthand for:
```tsx
{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
```

It makes the element fill its entire parent container. Used for overlays, backgrounds, full-screen gradients.

---

## 8. Mobile — Constants and Services

### `mobile/constants/theme.ts` — Brand Colors

All colours are defined in one place. Every screen imports from here — never hardcode hex values in screen files.

```ts
export const Brand = {
  primary:     '#1A56DB',  // Deep blue — buttons, active tabs, headers
  primaryDark: '#0E3A9F',  // Darker blue — gradient bottoms
  primaryLight:'#3B82F6',  // Lighter blue — accents
  accent:      '#F97316',  // Vivid orange — create button, checkmark right leg
  accentDark:  '#EA580C',  // Darker orange — pressed states
  accentLight: '#FB923C',  // Lighter orange
  success:     '#22C55E',  // Green — completed transactions
  warning:     '#EAB308',  // Yellow — pending transactions
  error:       '#EF4444',  // Red — disputes, errors
  white:       '#FFFFFF',
  black:       '#0A0F1E',  // Very dark navy-black (used for dark text)
};

export const Colors = {
  light: {
    text:        '#0A0F1E',             // Dark text on light background
    subtext:     '#6B7280',             // Gray secondary text
    background:  '#EEF2FF',             // Very light blue-white background
    card:        'rgba(255,255,255,0.75)',  // Semi-transparent white glass card
    border:      '#E2E8F0',             // Light gray borders
    tabBar:      'rgba(255,255,255,0.88)',  // Frosted white tab bar
  },
  dark: {
    text:        '#F1F5FF',             // Light text on dark background
    subtext:     '#9CA3AF',             // Gray secondary text
    background:  '#060C1A',             // Very dark navy background
    card:        'rgba(13,23,48,0.75)', // Semi-transparent dark glass card
    border:      '#1E2A45',             // Dark blue-gray borders
    tabBar:      'rgba(6,12,26,0.88)',  // Frosted dark tab bar
  },
};

export const Currency = {
  code:   'GHS',    // ISO currency code
  symbol: '₵',     // Ghana Cedi symbol
  name:   'Ghana Cedi',
};
```

**Why separate `Brand` from `Colors`?**
`Brand` colours are always the same (your logo blue is always `#1A56DB`).
`Colors` change based on whether the device is in dark or light mode.

### `mobile/services/api.ts` — The HTTP Client

This file sets up Axios — the library used to make API calls to the backend.

```ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The backend URL — change this to your machine's local IP
const BASE_URL = 'http://100.66.247.137:5000/api';

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,  // Give up after 8 seconds
});

// INTERCEPTOR: Runs before every request
// Automatically attaches the JWT token without you having to think about it
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper: saves the token (or removes it on logout)
export async function setAuthToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem('token', token);
  } else {
    await AsyncStorage.removeItem('token');
  }
}

export default api;
```

**How you use it in screens:**
```ts
// GET request
const res = await api.get('/escrow/list');
const transactions = res.data.transactions;

// POST request
const res = await api.post('/escrow/create', {
  item: 'iPhone 15',
  amount: 4500,
  seller_phone: '0244000001',
});
const code = res.data.transactionCode;
```

The token is attached automatically to every request by the interceptor.

**What is `AsyncStorage`?**
It's like `localStorage` in a browser, but for React Native. Stores key-value pairs that persist even when the app is closed.

```ts
await AsyncStorage.setItem('token', 'eyJhbG...');  // save
const token = await AsyncStorage.getItem('token');  // read
await AsyncStorage.removeItem('token');              // delete
```

---

## 9. Mobile — Hooks

### `mobile/hooks/use-color-scheme.ts` — Dark/Light Mode

```ts
export { useColorScheme } from 'react-native';
```

Just re-exports React Native's built-in hook. Usage:
```ts
const scheme = useColorScheme();  // returns 'dark' or 'light'
const c = Colors[scheme ?? 'light'];  // pick the right color set

<View style={{ backgroundColor: c.background }}>
```

### `mobile/hooks/useAuth.ts` — Authentication State

This hook manages the logged-in user's state across the entire app.

```ts
export default function useAuth() {
  // State: current token string (or null = not logged in)
  const [token, setToken] = useState<string | null>(null);
  // State: current user object (or null)
  const [user, setUser] = useState<any>(null);

  // On first render: load token + user from storage
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      const u = await AsyncStorage.getItem('user');
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));  // JSON.parse converts string back to object
    })();
  }, []);

  async function login(phone: string, password: string) {
    // 1. Call the backend
    const res = await api.post('/auth/login', { phone, password });
    // 2. Save token to storage AND axios header
    await setAuthToken(res.data.token);
    // 3. Save user info to storage
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    // 4. Update state (causes screens to re-render)
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  async function register(name, phone, password, role = 'BUYER') {
    const res = await api.post('/auth/register', { name, phone, password, role });
    await setAuthToken(res.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  async function logout() {
    await setAuthToken(null);          // removes token from storage
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  return { token, user, login, register, logout };
}
```

**Why put auth in a hook?**
Because any screen can call `useAuth()` and get the same data. If you login in `login.tsx`, the `user` becomes available in `home/index.tsx` without passing it through props.

---

## 10. Mobile — The Splash Screen

The splash screen system has two layers:

### Layer 1: Native Splash (instant)

Appears the moment the app is tapped — before any JavaScript loads. Controlled by `app.json`:

```json
"expo-splash-screen": {
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 220,
  "backgroundColor": "#060C1A"   ← Dark navy background
}
```

The `splash-icon.png` (512×512, transparent background) is the VeriTrade shield logo — generated by `scripts/generate-assets.py`.

### Layer 2: Animated Splash (after JS loads)

`components/animated-splash.tsx` — a custom React Native component that covers the screen after the native splash hides.

#### How it's triggered (`app/_layout.tsx`):

```tsx
SplashScreen.preventAutoHideAsync();  // Keep native splash showing

export default function RootLayout() {
  const [appReady, setAppReady]   = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      await SplashScreen.hideAsync();  // Hide native splash
      setAppReady(true);               // Show animated splash
    })();
  }, []);

  const handleSplashFinish = async () => {
    setSplashDone(true);
    // Now decide where to navigate
    const onboarded = await AsyncStorage.getItem('hasOnboarded');
    const token     = await AsyncStorage.getItem('token');
    if (!onboarded) router.replace('/onboarding');
    else if (!token) router.replace('/login');
    // else: stay on (tabs)
  };

  return (
    <ThemeProvider ...>
      <Stack>...</Stack>
      {/* Animated splash sits on top until finished */}
      {appReady && !splashDone && (
        <AnimatedSplash onFinish={handleSplashFinish} />
      )}
    </ThemeProvider>
  );
}
```

#### Inside `components/animated-splash.tsx`

**The Background — Stars:**
28 floating dots that twinkle and drift up/down. Each is a small `View` with `position: 'absolute'`.

```tsx
function Star({ x, y, size, delay, duration }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Continuously fade in/out
    opacity.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: duration * 0.5 }),
          withTiming(0.08, { duration: duration * 0.5 }),
        ),
        -1,   // repeat forever
        true, // alternate direction
      ),
    );
    // Continuously float up and down
    translateY.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration }),
          withTiming(8,  { duration }),
        ),
        -1, true,
      ),
    );
  }, []);
  ...
}
```

**The Orbit Ring:**
A rotating `View` with a dashed border and 5 colored dots on it. One orange dot, four blue.
`withRepeat(withTiming(360, { duration: 7000, easing: Easing.linear }), -1, false)` — rotates forever.

**The Shield Logo:**
Built from pure `View` and `LinearGradient` components (no image file needed).
- Outer `LinearGradient`: three-stop blue gradient, top-heavy border radius creates shield shape
- Two `View` strips rotated to form the checkmark (white left leg, orange right leg)
- A small orange dot accent

**The Animation Sequence:**
```
Time 0ms:    Glow and stars begin fading in
Time 80ms:   Shield pops in (spring bounce with back-ease)
Time 500ms:  Orbit ring fades in; brand name slides up from below
Time 750ms:  Tagline fades in
Time 900ms:  Progress bar begins filling (left → right, 1400ms)
Time 2700ms: Entire screen fades out → onFinish() is called
Time ~3300ms: Navigation happens
```

**`react-native-reanimated` — Why not just `Animated` from React Native?**
The built-in `Animated` API runs on the JS thread — it can stutter when the JS thread is busy.
`react-native-reanimated` runs animations on the UI thread (native side) — silky smooth, no stuttering.

Key reanimated concepts used:
- `useSharedValue(initial)` — a value that lives on the native thread
- `useAnimatedStyle(() => ({ ... }))` — derives a style from shared values
- `withTiming(target, options)` — animate to a target over time
- `withDelay(ms, animation)` — wait before starting an animation
- `withSequence(a, b, c)` — run animations one after another
- `withRepeat(animation, count, reverse)` — repeat (count = -1 means forever)
- `Easing.out(Easing.back(1.4))` — bounces slightly past the target then settles back

### `scripts/generate-assets.py` — Icon Generator

Uses **pycairo** (a Python 2D drawing library) to generate vector-quality PNG icons.

```python
# The shield is drawn as a bezier path
def shield_path(ctx, cx, cy, r):
    ctx.new_path()
    ctx.move_to(cx, cy - 56*s)           # top centre
    ctx.curve_to(...)                     # top-right arch
    ctx.curve_to(...)                     # right side tapering down
    ctx.curve_to(cx, cy + 66*s, ...)     # bottom point
    # mirror for left side
    ctx.close_path()

# Fill with gradient (light blue top → dark blue bottom)
lg = cairo.LinearGradient(cx, cy - 56*s, cx, cy + 66*s)
lg.add_color_stop_rgb(0, 0.23, 0.51, 0.96)  # #3B82F6
lg.add_color_stop_rgb(1, 0.05, 0.23, 0.62)  # #0E3A9F
ctx.set_source(lg)
ctx.fill()
```

It generates:
- `icon.png` (1024×1024) — app icon with dark background
- `splash-icon.png` (512×512) — shield on transparent background (Expo adds the colour)
- `favicon.png` (64×64) — web favicon
- `android-icon-foreground.png` (1024×1024) — Android adaptive icon layer
- `android-icon-monochrome.png` (1024×1024) — single-colour version for Android theming

---

## 11. Mobile — Navigation and Layouts

### `mobile/app/_layout.tsx` — Root Layout

This is the outermost wrapper of the entire app. It runs once.

```tsx
// Tell Expo: don't auto-hide the native splash until we say so
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [appReady, setAppReady]     = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      await SplashScreen.hideAsync();  // Hide native splash → show animated one
      setAppReady(true);
    })();
  }, []);

  // Called when animated splash finishes
  const handleSplashFinish = async () => {
    setSplashDone(true);
    try {
      const onboarded = await AsyncStorage.getItem('hasOnboarded');
      const token     = await AsyncStorage.getItem('token');
      if (!onboarded)    router.replace('/onboarding');
      else if (!token)   router.replace('/login');
      // else → default route (tabs) loads automatically
    } catch {}
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: '#060C1A' }}>
        {/* The Stack navigator contains all screens */}
        <Stack>
          <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
          <Stack.Screen name="onboarding"  options={{ headerShown: false }} />
          <Stack.Screen name="login"       options={{ headerShown: false }} />
          <Stack.Screen name="register"    options={{ headerShown: false }} />
          <Stack.Screen name="modal"       options={{ presentation: 'modal', title: 'Details' }} />
        </Stack>

        {/* Animated splash overlays everything until done */}
        {appReady && !splashDone && (
          <AnimatedSplash onFinish={handleSplashFinish} />
        )}
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
```

**What is `ThemeProvider`?**
It wraps the app in a React Navigation theme context. Screens that use navigation hooks (`useNavigation`) will automatically get the right header colors.

**What is `Stack`?**
A stack navigator — like a pile of cards. Pushing a screen adds it on top. Going back removes it.

### `mobile/app/(tabs)/_layout.tsx` — Tab Bar

Defines the 5 bottom tabs and how they look.

```tsx
export default function TabLayout() {
  const scheme  = useColorScheme();
  const c       = Colors[scheme ?? 'light'];
  const insets  = useSafeAreaInsets();  // ← screen notch/home-bar padding

  const tabBarHeight = 56 + insets.bottom;  // extra space for home indicator bar

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Brand.primary,    // blue when selected
        tabBarInactiveTintColor: '#9CA3AF',        // gray when not selected
        tabBarStyle: {
          height: tabBarHeight,
          backgroundColor: c.tabBar,              // frosted glass
          borderTopColor: c.border,
        },
        // Render a BlurView behind the tab bar for the glass effect
        tabBarBackground: () => (
          <BlurView intensity={60} tint={scheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen name="index"         options={{ title: 'Home', ... }} />
      <Tabs.Screen name="transactions"  options={{ title: 'Activity', ... }} />
      <Tabs.Screen name="create-escrow" options={{
        title: '',
        tabBarLabel: () => null,      // no label under the button
        tabBarIcon: ({ focused }) => <CreateIcon focused={focused} />,
      }} />
      <Tabs.Screen name="explore"  options={{ title: 'USSD', ... }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile', ... }} />
    </Tabs>
  );
}
```

**The floating create button:**
```tsx
function CreateIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.createBtn, focused && styles.createBtnActive]}>
      <Ionicons name="add" size={28} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    width: 56, height: 56, borderRadius: 28,  // perfect circle
    backgroundColor: Brand.accent,            // orange
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,                          // lifts it above tab bar baseline
    shadowColor: Brand.accent,
    shadowOpacity: 0.5, shadowRadius: 12,    // orange glow shadow
    elevation: 10,                            // Android shadow
  },
  createBtnActive: { backgroundColor: Brand.accentDark },
});
```

**`useSafeAreaInsets`** — Gives you the padding needed to avoid the iPhone notch, Android status bar, and bottom home indicator. Always use it for elements near screen edges.

---

## 12. Mobile — Every Screen Explained

### `app/onboarding.tsx` — Three-Slide Intro

This screen is shown exactly once — the first time someone opens the app.

```tsx
const slides = [
  {
    id: '1',
    icon: 'shield-checkmark',
    title: 'Trade Without Fear',
    subtitle: 'VeriTrade holds your money safely...',
    bg: ['#0E3A9F', '#1A56DB'],  // gradient colours
  },
  // ... 2 more slides
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);    // which slide is visible
  const flatRef = useRef<FlatList>(null);   // direct access to the FlatList

  async function finish() {
    // Remember that onboarding is done
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/login');
  }

  function next() {
    if (index < slides.length - 1) {
      // Scroll FlatList to next slide programmatically
      flatRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      finish();  // last slide → done
    }
  }
  ...
}
```

**`FlatList`** — An efficient scrollable list. For long lists it only renders items currently visible on screen (virtualization), which is faster than rendering everything at once.

**`pagingEnabled`** — Each scroll snaps to the full width of the screen, making it feel like page turning.

**`useRef`** — Gives you a direct handle to a component. `flatRef.current?.scrollToIndex(...)` imperatively scrolls the list — this is one of the few cases where `useRef` is the right tool.

**Progress dots:**
```tsx
{slides.map((_, i) => (
  <View
    key={i}
    style={[
      styles.dot,
      i === index && styles.dotActive,  // wide + orange when active
    ]}
  />
))}
```

The active dot is wider (`width: 24`) to show which slide you're on.

---

### `app/login.tsx` — Login Screen

```tsx
export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  // State for each form field
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);   // show/hide password
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function onLogin() {
    if (!phone || !password) { setError('Fill in all fields'); return; }
    setError('');
    setLoading(true);
    try {
      await login(phone, password);      // calls useAuth hook's login function
      router.replace('/(tabs)');          // go to main app
    } catch {
      setError('Invalid phone or password');
    } finally {
      setLoading(false);  // runs whether success or failure
    }
  }
  ...
}
```

**Key UI pattern — loading button:**
```tsx
<TouchableOpacity onPress={onLogin} disabled={loading} activeOpacity={0.85}>
  <LinearGradient colors={['#1A56DB', '#2563EB']} style={styles.btn}>
    {loading
      ? <ActivityIndicator color="#fff" />      // spinner while waiting
      : <Text style={styles.btnTxt}>Sign In</Text>  // normal state
    }
  </LinearGradient>
</TouchableOpacity>
```

`disabled={loading}` prevents double-tapping while the request is in flight.

**`KeyboardAvoidingView`** — When the keyboard opens on iOS, it would cover the input fields. This component automatically pushes content up to keep inputs visible.

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
```

On Android the OS handles this automatically so we only apply it on iOS.

**`BlurView`** — The frosted glass card effect. Uses the GPU to blur whatever is behind the view.
```tsx
<BlurView intensity={60} tint="dark" style={styles.card}>
  {/* content on top of blur */}
</BlurView>
```

**`LinearGradient`** — Smooth colour transition between two or more colours.
```tsx
<LinearGradient
  colors={['#060C1A', '#0D1A3A', '#060C1A']}  // dark → mid-blue → dark
  start={{ x: 0.2, y: 0 }}   // gradient starts at 20% left, top
  end={{ x: 0.8, y: 1 }}     // ends at 80% left, bottom (diagonal)
  style={StyleSheet.absoluteFill}
/>
```

---

### `app/register.tsx` — Register Screen

Same structure as login, but adds:

**Role picker:**
```tsx
const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');

{(['BUYER', 'SELLER'] as const).map((r) => (
  <TouchableOpacity
    style={[styles.roleBtn, role === r && styles.roleBtnActive]}
    onPress={() => setRole(r)}
  >
    <Text>{r === 'BUYER' ? 'Buyer' : 'Seller'}</Text>
  </TouchableOpacity>
))}
```

`role === r && styles.roleBtnActive` — this is a **conditional style**. It applies `roleBtnActive` only when the current role matches the button's role. The `&&` short-circuits: if the left side is false, the right side is never evaluated.

---

### `app/(tabs)/index.tsx` — Home Dashboard

This is the first screen users see after logging in.

```tsx
export default function HomeScreen() {
  const { user }   = useAuth();                          // logged-in user
  const scheme     = useColorScheme();
  const c          = Colors[scheme ?? 'light'];          // current color set
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing]     = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  async function load() {
    try {
      const res = await api.get('/escrow/list');
      const txs = res.data.transactions || [];
      setTransactions(txs.slice(0, 3));  // only show last 3 on home
      setStats({
        total:     txs.length,
        active:    txs.filter(t => ['PENDING','PAID'].includes(t.status)).length,
        completed: txs.filter(t => t.status === 'COMPLETED').length,
      });
    } catch {}
  }

  useEffect(() => { load(); }, []);  // load when screen first opens

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Gradient header */}
      <LinearGradient colors={[Brand.primaryDark, Brand.primary]} style={styles.header}>
        <Text>Hello, {user?.name?.split(' ')[0] || 'Trader'} 👋</Text>
        {/* user?.name — optional chaining: if user is null, don't crash */}
        {/* ?.split(' ')[0] — takes only the first name */}
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats cards */}
        {/* Quick actions */}
        {/* Recent transactions */}
      </ScrollView>
    </View>
  );
}
```

**Optional chaining `?.`** — If the object might be null or undefined, `?.` prevents a crash:
```ts
user?.name           // returns undefined if user is null (instead of crashing)
user?.name?.split()  // chains safely
```

**`RefreshControl`** — The pull-to-refresh spinner. When the user pulls the list down:
1. `refreshing` becomes `true` → spinner shows
2. `onRefresh` is called → makes the API call again
3. `refreshing` set to `false` → spinner hides

**Status colour lookup table:**
```tsx
const STATUS_COLOR: Record<string, string> = {
  PENDING:   Brand.warning,   // yellow
  PAID:      Brand.primary,   // blue
  COMPLETED: Brand.success,   // green
  DISPUTED:  Brand.error,     // red
  CANCELLED: '#9CA3AF',       // gray
};
```

`Record<string, string>` is a TypeScript type meaning "object where every key is a string and every value is a string". Used like a lookup table: `STATUS_COLOR['PENDING']` → `'#EAB308'`.

---

### `app/(tabs)/create-escrow.tsx` — New Escrow Form

```tsx
async function onCreate() {
  // Validation
  if (!item || !amount || !seller) {
    setError('All fields are required');
    return;  // stops the function here
  }

  setError('');
  setLoading(true);

  try {
    const res = await api.post('/escrow/create', {
      item,
      amount: parseFloat(amount),  // convert string "450.00" to number 450
      seller_phone: seller,
    });
    setSuccess(res.data.transactionCode);  // "483921"
    // Clear the form
    setItem(''); setAmount(''); setSeller('');
  } catch {
    setError('Could not create escrow. Check seller phone.');
  } finally {
    setLoading(false);
  }
}
```

**`parseFloat(amount)`** — TextInput always gives you a string. The backend needs a number. `parseFloat("450.00")` → `450`.

**Conditional rendering — two states:**
```tsx
{success ? (
  // Show success card with transaction code
  <View>
    <Text>Escrow Created!</Text>
    <Text style={styles.codeTxt}>{success}</Text>  // "483921"
  </View>
) : (
  // Show the form
  <>
    {/* item input */}
    {/* amount input */}
    {/* seller phone input */}
    <TouchableOpacity onPress={onCreate}>...</TouchableOpacity>
  </>
)}
```

`<>` is a **React Fragment** — a wrapper that doesn't add an extra `View` to the DOM. Needed because JSX expressions can only return one element, but you can wrap multiple siblings in a fragment.

---

### `app/(tabs)/transactions.tsx` — All Trades

The most interactive screen — shows every transaction with status-based action buttons.

**Filtering:**
```tsx
const FILTERS = ['ALL', 'PENDING', 'PAID', 'COMPLETED', 'DISPUTED'];
const [filter, setFilter] = useState('ALL');

// Computed value (no state needed):
const displayed = filter === 'ALL'
  ? all
  : all.filter(t => t.status === filter);
```

`displayed` is not state — it's computed from `all` and `filter`. Every time either changes, React re-renders and recalculates `displayed`.

**The FlatList with actions:**
```tsx
<FlatList
  data={displayed}
  keyExtractor={t => String(t.id)}  // unique key for each item (React needs this)
  renderItem={({ item: tx }) => (
    <View>
      {/* Transaction info */}
      
      {/* Action buttons based on status */}
      {tx.status === 'PAID' && (
        <View style={styles.actRow}>
          <TouchableOpacity onPress={() => confirmDelivery(tx.transaction_code)}>
            <Text>✅ Confirm Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => raiseDispute(tx.transaction_code)}>
            <Text>⚠️ Dispute</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {tx.status === 'PENDING' && (
        <TouchableOpacity onPress={async () => {
          await api.post('/escrow/pay', { transactionCode: tx.transaction_code });
          await load();  // refresh the list
        }}>
          <Text>💳 Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  )}
/>
```

**`Alert.alert`** — Shows a native confirmation dialog:
```tsx
async function confirmDelivery(code: string) {
  Alert.alert(
    'Confirm Delivery',                   // title
    `Release funds for #${code}?`,       // message
    [
      { text: 'Cancel', style: 'cancel' },    // dismisses
      { text: 'Confirm', onPress: async () => {
          await api.post('/escrow/confirm', { transactionCode: code });
          await load();  // refresh
        }
      },
    ]
  );
}
```

---

### `app/(tabs)/explore.tsx` — USSD Info + Simulator

**Two sections:**

1. **Info cards** — Shows the real dial code `*384*1#` and lists the 6 menu options.

2. **Live Simulator** — A chat interface that talks to the backend's USSD endpoint.

```tsx
const [phone, setPhone]       = useState('');
const [input, setInput]       = useState('');
const [messages, setMessages] = useState<{ from: 'you' | 'server'; text: string }[]>([]);
const [loading, setLoading]   = useState(false);

async function send(text: string) {
  if (!phone) return;
  
  // Add your message to chat
  setMessages(m => [...m, { from: 'you', text: text || '(dial)' }]);
  
  setLoading(true);
  try {
    const res = await api.post('/ussd', { phone, text });
    // Add server response to chat
    setMessages(m => [...m, { from: 'server', text: res.data.response }]);
  } catch {
    setMessages(m => [...m, { from: 'server', text: 'Could not connect' }]);
  }
  setInput('');
  setLoading(false);
}
```

**`setMessages(m => [...m, newMessage])`** — This is the functional form of setState. Instead of:
```ts
setMessages([...messages, newMessage])
```
We use:
```ts
setMessages(m => [...m, newMessage])
```
The functional form receives the latest state value (`m`) as an argument. Safer when state updates can happen fast in sequence — you're always working with the latest value.

**`...m`** is the **spread operator** — it "spreads" the array's items into a new array. `[...m, newItem]` creates a new array with all old items plus one new item at the end.

**Chat bubbles — alignment based on sender:**
```tsx
<View style={[
  styles.bubble,
  msg.from === 'you' ? styles.bubbleYou : styles.bubbleServer
]}>
  <Text>{msg.text}</Text>
</View>
```

```tsx
bubble:       { maxWidth: '85%', borderRadius: 14, padding: 10 },
bubbleServer: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF' }, // left side
bubbleYou:    { alignSelf: 'flex-end', backgroundColor: Brand.accent }, // right side
```

`alignSelf: 'flex-start'` — align this item to the left within its parent.
`alignSelf: 'flex-end'` — align this item to the right.

---

### `app/(tabs)/profile.tsx` — User Profile

```tsx
export default function Profile() {
  const { user, logout } = useAuth();

  function onLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',  // shows in red on iOS
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  // Dynamic initial avatar (first letter of name)
  // user?.name?.[0] — safely get first character, or 'V' if no name
  const initial = (user?.name?.[0] || 'V').toUpperCase();
  
  ...
}
```

**Menu items as data:**
```tsx
const menuItems = [
  { icon: 'notifications-outline', label: 'Notifications', onPress: () => Alert.alert('Coming soon') },
  { icon: 'shield-checkmark-outline', label: 'Security & KYC', onPress: () => Alert.alert('Coming soon') },
  // ...
];

// Render:
{menuItems.map((item, i) => (
  <TouchableOpacity key={i} onPress={item.onPress}>
    <Ionicons name={item.icon} />
    <Text>{item.label}</Text>
    <Ionicons name="chevron-forward" />  // → arrow
  </TouchableOpacity>
))}
```

This pattern — putting UI data in an array and mapping over it — keeps code DRY (Don't Repeat Yourself). Adding a new menu item is just adding one object to the array.

---

## 13. Transaction Lifecycle

Every escrow transaction goes through these stages:

```
┌─────────┐
│ PENDING │  ← Created. Buyer has a code. Waiting for payment.
└────┬────┘
     │  buyer calls POST /escrow/pay
     ▼
┌──────┐
│ PAID │     ← Funds locked in escrow. Waiting for delivery.
└──┬───┘
   │  buyer calls POST /escrow/confirm
   ▼
┌───────────┐
│ COMPLETED │  ← Seller receives funds. Trade done. ✅
└───────────┘

From PENDING or PAID:
   → DISPUTED   ← Buyer raises a dispute (POST /escrow/dispute)

From PENDING only:
   → CANCELLED  ← Trade called off (POST /escrow/cancel)
```

**Status colours in the app:**

| Status | Colour | Meaning |
|--------|--------|---------|
| PENDING | Yellow | Waiting for action |
| PAID | Blue | Money locked |
| COMPLETED | Green | All good |
| DISPUTED | Red | Problem raised |
| CANCELLED | Gray | Trade cancelled |

---

## 14. How Everything Connects

Here is the full flow for "Buyer creates an escrow and seller confirms delivery":

```
─── BUYER'S PHONE ──────────────────────────────────────────────────────

1. Opens create-escrow screen
2. Types: item = "iPhone 15", amount = 4500, seller = "0244000001"
3. Taps "Lock Funds in Escrow"

─── api.ts ─────────────────────────────────────────────────────────────

4. axios.post('http://192.168.x.x:5000/api/escrow/create', {...})
   Headers: { Authorization: "Bearer eyJhbG..." }  ← auto-added by interceptor

─── BACKEND ────────────────────────────────────────────────────────────

5. Express receives: POST /api/escrow/create
6. auth.middleware.js: verifies JWT → req.user = { id: 1, name: "Kofi", ... }
7. escrow.controller.js → createEscrow():
   a. Generates code = "483921"
   b. Finds seller in users.json by phone "0244000001"
   c. Saves to transactions.json:
      { id: 1, code: "483921", buyer_id: 1, seller_id: 2,
        item: "iPhone 15", amount: 4500, status: "PENDING" }
   d. Returns: { transactionCode: "483921" }

─── BUYER'S PHONE ──────────────────────────────────────────────────────

8. Success card shows: transaction code 483921
9. Buyer shares code with seller (WhatsApp, SMS, verbally)

─── SELLER'S PHONE ─────────────────────────────────────────────────────

10. Goes to Transactions tab → sees their pending trade
11. Buyer then: taps "Mark as Paid" → POST /escrow/pay → status = PAID
12. Delivers the iPhone
13. Buyer taps "Confirm Delivery" → POST /escrow/confirm → status = COMPLETED
14. Seller receives the 4500 (in real deployment, via Moolre payout)
```

---

## 15. Styling in React Native

React Native uses a subset of CSS properties, written as JavaScript objects.

### Key Differences from CSS

| CSS | React Native | Notes |
|-----|-------------|-------|
| `background-color: red` | `backgroundColor: 'red'` | camelCase |
| `font-size: 16px` | `fontSize: 16` | no units — all sizes are in dp (density-independent pixels) |
| `border-radius: 12px` | `borderRadius: 12` | |
| `display: flex` | automatic | all Views are flex by default |
| `flex-direction: row` | `flexDirection: 'row'` | |
| `margin: 20px 10px` | `marginVertical: 20, marginHorizontal: 10` | |
| `box-shadow` | `shadowColor, shadowRadius, elevation` | shadow props vary by platform |
| `opacity: 0.5` | `opacity: 0.5` | same |

### Combining Styles

```tsx
// Merge multiple styles (last one wins on conflicts):
<View style={[styles.base, styles.extra, { marginTop: 10 }]} />

// Conditional style:
<View style={[styles.btn, isActive && styles.btnActive]} />
```

### Platform-Specific Code

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  card: {
    // Shadow works differently on iOS vs Android
    shadowColor: '#000',          // iOS
    shadowOpacity: 0.2,           // iOS
    shadowRadius: 8,              // iOS
    shadowOffset: { width: 0, height: 4 },  // iOS
    elevation: 6,                 // Android (replaces all shadow props)
  },
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,  // status bar height differs
  },
});
```

### Colors

React Native accepts:
- Hex: `'#1A56DB'`
- RGB: `'rgb(26, 86, 219)'`
- RGBA (with transparency): `'rgba(26, 86, 219, 0.5)'` — last value is 0 (invisible) to 1 (solid)
- Named: `'blue'`, `'white'` (avoid — limited set and inconsistent across devices)

### The `flex: 1` Pattern

The most important layout tool:

```tsx
// Takes up ALL remaining space
<View style={{ flex: 1 }}>

// Split 50/50:
<View style={{ flex: 1 }}>  {/* 50% */}
<View style={{ flex: 1 }}>  {/* 50% */}

// Split 1/3 and 2/3:
<View style={{ flex: 1 }}>  {/* 33% */}
<View style={{ flex: 2 }}>  {/* 67% */}
```

---

## 16. Running the Project

### First Time Setup

```bash
# Terminal 1 — Start the backend
cd ~/Desktop/veritrade/backend
npm install
npm run dev
# ✓ You should see: "Server started on 5000"

# Terminal 2 — Start the mobile app
cd ~/Desktop/veritrade/mobile
npm install
npx expo start
# Scan the QR code with Expo Go on your phone
```

### Connecting Phone to Dev Server

1. Make sure phone and laptop are on the **same WiFi network**
2. Find your laptop's IP address:
   ```bash
   ip addr show | grep "inet " | grep -v 127
   # Look for something like: 192.168.1.105 or 100.66.247.137
   ```
3. Open `mobile/services/api.ts` and update:
   ```ts
   const BASE_URL = 'http://YOUR_IP_HERE:5000/api';
   ```
4. Press `r` in the Expo terminal to reload the app

### Default Test Account

| Phone | Password |
|-------|----------|
| 0594737677 | 123456789 |

### Regenerating the App Icon

If you want to change the logo design, edit `scripts/generate-assets.py` then run:
```bash
cd mobile
python3 scripts/generate-assets.py
```

---

## 17. Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Network request failed" | Wrong IP in api.ts | Update `BASE_URL` with your current IP |
| "invalid credentials" (when password is right) | Backend not running | Run `npm run dev` in `/backend` |
| "seller not found" | Seller not registered | Register seller first, then create escrow |
| Blank white screen | Expo JS error | Open Expo Go menu → press 'j' for debug, check console |
| Splash doesn't animate | Reanimated not linked | Run `npx expo start --clear` |
| "Cannot read properties of null" | Optional chaining missing | Add `?.` before the property: `user?.name` |
| Port 5000 in use | Another process | `kill $(lsof -t -i:5000)` or change PORT in `.env` |
| Keyboard covers inputs | Missing `KeyboardAvoidingView` | Wrap form in `<KeyboardAvoidingView behavior="padding">` |

---

## 18. All Dependencies Explained

### Backend (`backend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.x | The web framework — the foundation of the backend |
| `cors` | 2.x | Cross-Origin Resource Sharing — lets mobile app talk to server |
| `dotenv` | 16.x | Loads `.env` file into `process.env` |
| `bcrypt` | 5.x | Password hashing — never store plain text passwords |
| `jsonwebtoken` | 9.x | Creates and verifies JWT tokens |
| `pg` | 8.x | PostgreSQL client — used in production |
| `axios` | 1.x | Makes HTTP requests from the backend (to Moolre API) |
| `nodemon` (dev) | 3.x | Restarts server automatically when files change |

### Mobile (`mobile/package.json`)

| Package | Purpose |
|---------|---------|
| `expo` | Core Expo SDK — the glue for all expo-* packages |
| `expo-router` | File-based navigation — each file = a screen |
| `react` | Core React library |
| `react-native` | Cross-platform mobile framework |
| `expo-splash-screen` | Manages the native splash screen |
| `expo-linear-gradient` | `<LinearGradient>` component |
| `expo-blur` | `<BlurView>` frosted glass component |
| `@expo/vector-icons` | Icon sets (we use Ionicons) |
| `react-native-reanimated` | Smooth native-thread animations |
| `react-native-safe-area-context` | `useSafeAreaInsets()` — notch/home bar padding |
| `@react-navigation/bottom-tabs` | Tab bar navigator |
| `@react-navigation/native` | Core navigation primitives |
| `axios` | HTTP client for API calls |
| `@react-native-async-storage/async-storage` | Persistent key-value storage on device |

---

## 19. Moolre — Real Mobile Money Payments

Right now when a buyer "pays", the app just changes a status field in the JSON file. In production, you want **real Ghanaian mobile money** moving (MTN MoMo, Vodafone Cash, AirtelTigo Money).

That's where **Moolre** comes in — a Ghanaian payment gateway with one API for all networks.

### The Payment Flow

```
User taps "Pay" in the app
  ↓
App: POST /api/moolre/pay  { transactionCode, phone, network }
  ↓
Backend → Moolre API: "Charge 0244000001 GHS 450"
  ↓
Customer's phone gets a MoMo PIN prompt
  ↓
Customer enters PIN → Moolre charges them
  ↓
Moolre sends a webhook to: POST /api/moolre/webhook
  ↓
Backend verifies signature → updates transaction to PAID
```

### The Three Backend Files

**`backend/src/services/moolre.service.js`**

| Function | What it does |
|----------|-------------|
| `initiateCollection(params)` | Sends payment request to Moolre, which prompts the customer's phone |
| `checkStatus(reference)` | Polls Moolre for payment status |
| `verifyWebhookSignature(body, sig)` | Validates that a webhook is genuinely from Moolre (HMAC-SHA256) |

**`backend/src/controllers/moolre.controller.js`**

| Route | What it does |
|-------|-------------|
| `POST /api/moolre/pay` | Looks up transaction, calls Moolre to charge buyer |
| `GET /api/moolre/status/:reference` | Returns payment status from Moolre |
| `POST /api/moolre/webhook` | Called by Moolre when payment succeeds → updates to PAID |

**Why no JWT on `/webhook`?**
The webhook is called by Moolre's servers — not the mobile app. Instead of a JWT, we verify the HMAC-SHA256 signature using your `MOOLRE_WEBHOOK_SECRET`. If the signature doesn't match → reject with 400.

### Environment Variables

Add to `backend/.env`:

```env
MOOLRE_API_KEY=your_api_key_from_moolre_dashboard
MOOLRE_URL=https://api.moolre.com/v1
MOOLRE_WEBHOOK_SECRET=your_webhook_secret
APP_BASE_URL=https://your-deployed-backend.railway.app
```

### Testing Without Real Money

Use sandbox credentials:
```env
MOOLRE_URL=https://sandbox.moolre.com/v1
```

No real money moves in sandbox mode.

### Wiring It Up in the Mobile App

In `mobile/app/(tabs)/transactions.tsx`, replace the "Mark as Paid" button's action:

```ts
// Current (fake):
await api.post('/escrow/pay', { transactionCode: tx.transaction_code });

// Replace with (real):
await api.post('/moolre/pay', {
  transactionCode: tx.transaction_code,
  phone: user.phone,   // from useAuth()
  network: 'MTN',      // or show a picker to let user choose
});
// The transaction will move to PAID automatically when Moolre fires the webhook
```

---

## 20. What to Build Next

Once you understand this codebase completely, here's the natural learning progression:

### Level 1 — Strengthen What's Here
- Add **input validation** on the backend (`zod` library)
- Add **loading skeletons** (gray placeholder shapes while data loads)
- Add **error boundaries** (catch JS errors gracefully instead of white screen)
- Write your first **test** (`jest` + `@testing-library/react-native`)

### Level 2 — New Features
- **Push notifications** when escrow status changes (`expo-notifications`)
- **KYC upload** — require ID photo before allowing trades above a threshold
- **Real payments** — wire up Moolre in the mobile app

### Level 3 — Production
- **PostgreSQL** on Supabase (free tier — replace `local_store.js`)
- **Deploy backend** to Railway.app (free tier)
- **Build APK** with `eas build --platform android --profile preview`
- **Submit to Play Store** with `eas build --platform android --profile production`

### Level 4 — Scale
- **Admin dashboard** — a React web app to review disputes
- **Rate limiting** — prevent abuse (`express-rate-limit`)
- **HTTPS** — required for production webhook URLs
- **Monitoring** — Sentry for error tracking

---

## Quick Reference

### IP address (run in terminal):
```bash
ip addr show | grep "inet " | grep -v 127
```

### Start backend:
```bash
cd ~/Desktop/veritrade/backend && npm run dev
```

### Start mobile:
```bash
cd ~/Desktop/veritrade/mobile && npx expo start
```

### Regenerate icons:
```bash
cd ~/Desktop/veritrade/mobile && python3 scripts/generate-assets.py
```

### Clear Expo cache (when weird things happen):
```bash
npx expo start --clear
```

### See backend data (the JSON "database"):
```bash
cat ~/Desktop/veritrade/backend/local_data/users.json
cat ~/Desktop/veritrade/backend/local_data/transactions.json
```
