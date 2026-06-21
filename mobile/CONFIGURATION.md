# VeriTrade MVP Complete Beginner Build Guide (3 Days)

## Goal

Build a working escrow marketplace prototype with:

✅ React Native mobile app
✅ Node.js backend
✅ PostgreSQL database
✅ Moolre API integration
✅ USSD simulation/integration
✅ Authentication
✅ Escrow transaction flow

---

# SYSTEM OVERVIEW

```
Mobile App
(React Native)

        |
        |

Backend API
(Node + Express)

        |
        |

PostgreSQL Database

        |
        |

Moolre API

        |
        |

Mobile Money


Feature Phone

        |
        |

USSD Gateway

        |
        |

Backend API

```

---

# DAY 0: Install Everything

Install:

## Node.js

https://nodejs.org

Check:

```bash
node -v

npm -v
```

---

## Install Expo

```bash
npm install -g expo-cli
```

---

## Install PostgreSQL

Create database:

```
veritrade_db
```

---

## Install VS Code

Extensions:

* ES7 React snippets
* PostgreSQL
* Thunder Client

---

# PROJECT STRUCTURE

Create:

```
VeriTrade/


├── mobile/

├── backend/

└── database/

```

---

# PART 1: BACKEND CREATION

Go:

```
cd backend
```

Create:

```bash
npm init -y
```

Install:

```bash
npm install express cors dotenv pg bcrypt jsonwebtoken axios
```

Install development:

```bash
npm install nodemon -D
```

---

# Backend Folder Structure

Create:

```
backend/


src/

├── server.js

├── config/

│     database.js


├── routes/


│     auth.routes.js

│     escrow.routes.js

│     ussd.routes.js


├── controllers/


│     auth.controller.js

│     escrow.controller.js


├── models/


├── middleware/


└── services/


      moolre.service.js

      sms.service.js

```

---

# BACKEND SERVER

server.js

```javascript
const express=require("express");

const cors=require("cors");


const app=express();


app.use(cors());

app.use(express.json());


app.get("/",(req,res)=>{

res.send("VeriTrade Running");

});


app.listen(5000,()=>{

console.log("Server started")

});

```

Run:

```
npm run dev
```

---

# DATABASE CREATION

Create tables:

## Users

```sql
CREATE TABLE users(

id SERIAL PRIMARY KEY,

name VARCHAR(100),

phone VARCHAR(20),

password TEXT,

role VARCHAR(20)

);

```

---

## Transactions

```sql
CREATE TABLE transactions(

id SERIAL PRIMARY KEY,


code VARCHAR(10),


buyer INTEGER,


seller INTEGER,


item TEXT,


amount INTEGER,


status VARCHAR(30)

);

```

Statuses:

```
PENDING

PAID

DELIVERED

COMPLETED

DISPUTED

```

---

# AUTHENTICATION

Create:

```
auth.controller.js
```

Functions:

```
register()

login()

```

Routes:

```
POST /api/auth/register


POST /api/auth/login

```

---

# API TESTING

Use Thunder Client

Register:

POST

```
localhost:5000/api/auth/register
```

Body:

```json
{

"name":"Karl",

"phone":"024xxxxxxx",

"password":"1234"

}

```

---

# ESCROW MODULE

Create:

```
escrow.controller.js

```

Functions:

## Create Transaction

```
createEscrow()

```

API:

```
POST /api/escrow/create

```

Input:

```json
{

"item":"Laptop",

"amount":2000,

"seller":"024xxxx"

}

```

Output:

```json
{

"transactionCode":"938221"

}

```

---

## Payment

```
POST

/api/escrow/pay

```

Logic:

```
Check transaction

Change:

PENDING

to

PAID

```

---

## Confirm Delivery

```
POST

/api/escrow/confirm

```

Changes:

```
PAID

↓

COMPLETED

```

---

# MOOLRE API INTEGRATION

Create:

```
services/moolre.service.js

```

Install:

```
npm install axios

```

Example:

```javascript

const axios=require("axios");


async function collectPayment(data){


const response =
await axios.post(

MOOLRE_URL,

data

);


return response.data;


}


module.exports={
collectPayment

}

```

---

# Environment File

Create:

```
.env

```

Add:

```
PORT=5000


DATABASE_URL=your_database


MOOLRE_API_KEY=your_key

```

---

# PART 2: MOBILE APP

Create:

```
cd mobile

npx create-expo-app .

```

Install:

```bash
npm install axios

npm install @react-navigation/native

npm install @react-navigation/native-stack

```

---

# MOBILE STRUCTURE

```
src/


screens/


Login.js

Register.js

Home.js

CreateEscrow.js

Transaction.js

Delivery.js

Wallet.js


components/


Button.js

Input.js


services/


api.js


navigation/


AppNavigator.js

```

---

# API CONNECTION

services/api.js

```javascript
import axios from "axios";


export default axios.create({

baseURL:

"http://YOUR_IP:5000/api"

});

```

---

# NAVIGATION

Pages:

```
Login

Register

Dashboard

Create Escrow

Transaction Details

Confirm Delivery

Wallet

```

---

# PAGE EXPLANATION

# Login Page

Inputs:

* Phone
* Password

Button:

Login

Calls:

```
POST /auth/login

```

---

# Dashboard

Shows:

```
Active Escrows

Completed Trades

Wallet

```

---

# Create Escrow Page

Inputs:

```
Item name

Amount

Seller phone

Delivery date

```

Button:

Create

Calls:

```
POST /escrow/create

```

---

# Transaction Page

Shows:

```
Product

Amount

Status


PAY NOW


```

---

# Delivery Page

Button:

```
Confirm Delivery

```

Calls:

```
POST /escrow/confirm

```

---

# Hooks You Need

Create:

```
hooks/


useAuth.js

useEscrow.js

useTransactions.js

```

---

# useAuth.js

Handles:

```
login

logout

current user

token

```

---

# useEscrow.js

Handles:

```
create escrow

pay

confirm

```

---

# useTransactions.js

Gets:

```
user transactions

```

---

# PART 3: USSD FEATURE PHONE SYSTEM

## How USSD Works

A person with a normal phone:

Dials:

```
*920#

```

Network sends request:

```
USSD Gateway

        |

Backend

        |

Database

```

Backend replies:

```
1 Create Escrow

2 Pay

3 Confirm Delivery

4 Dispute

```

---

# USSD API

Create:

```
ussd.routes.js

```

Endpoint:

```
POST /api/ussd

```

Example request:

```json
{

"phone":"024xxxx",

"text":"1"

}

```

Backend:

```javascript
if(text==="1"){


return "Enter item name"


}


```

---

# USSD SESSION FLOW

Example:

User:

```
*920#

```

Server:

```
Welcome VeriTrade

1. Create Order

```

User:

```
1

```

Server:

```
Enter amount

```

User:

```
500

```

Server:

```
Transaction Created

Code:

123456

```

---

# Connecting Real USSD

In Ghana you need:

* Moolre USSD
  OR
* Telecom USSD aggregator

Options:

* MTN MoMo API
* Telecel API
* Hubtel API
* Moolre USSD

They provide:

* shortcode
* callback URL

Your callback:

```
https://yourdomain.com/api/ussd

```

---

# SMS API

For OTP:

Use:

* Moolre SMS
* Hubtel SMS

Flow:

```
Transaction created

↓

Send OTP

↓

Verify

```

---

# 3 DAY EXECUTION PLAN

# DAY 1

Morning:

Setup:

✅ Backend
✅ Database
✅ Authentication

Afternoon:

Build:

✅ Create Escrow
✅ Transactions API

Night:

Build:

✅ React Native screens

---

# DAY 2

Morning:

Connect app + backend

Build:

✅ Login
✅ Dashboard
✅ Create transaction

Afternoon:

Add:

✅ Payment simulation

Night:

Integrate:

✅ Moolre API sandbox

---

# DAY 3

Morning:

Build:

✅ USSD endpoint

Afternoon:

Testing:

Buyer flow

Seller flow

Night:

Deploy:

Backend:

Render/Railway

Database:

Supabase

Mobile:

Expo APK

---

# FINAL MVP DEMO FLOW

1.

Buyer opens app

2.

Creates:

iPhone sale

3.

Seller receives request

4.

Buyer pays

5.

Money locked

6.

Seller delivers

7.

Buyer confirms

8.

Seller receives payment

9.

Feature phone user can check using:

```
*920#

```

---

# IMPORTANT

For your 3-day deadline:

DO NOT BUILD:

❌ AI fraud detection
❌ Full KYC
❌ Real dispute department
❌ Complex wallets

Build the core trust flow first.

The winning demo is:

"Money does not move until buyer confirms."
