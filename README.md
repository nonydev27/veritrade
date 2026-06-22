# VeriTrade 🚀

## Secure Escrow Solutions Platform

**Product:** VeriTrade
**Author:** Karl Djansi
**Document Type:** Beginner Developer Setup Guide
**Status:** Development Blueprint
**Channels:** Mobile App + USSD
**Payment Infrastructure:** Moolre API

---

# 1. Project Overview

VeriTrade is a secure escrow platform designed to solve trust issues in online peer-to-peer transactions.

The platform protects:

### Buyers

* Prevents payment scams
* Ensures goods are received before sellers get paid
* Provides dispute protection

### Sellers

* Prevents fake payment screenshots
* Guarantees payment after successful delivery
* Reduces buyer ghosting

The system works through:

1. Mobile Application
2. USSD Feature Phone Access
3. Moolre Payment Infrastructure

---

# 2. How VeriTrade Works (Simple Flow)

```
Buyer creates transaction
          |
          ↓
Seller receives escrow request
          |
          ↓
Buyer pays money
          |
          ↓
Money enters VeriTrade Escrow Wallet
          |
          ↓
Seller delivers product
          |
          ↓
Buyer confirms delivery
          |
          ↓
Money released to Seller
```

If something goes wrong:

```
Transaction Dispute
        |
        ↓
Funds Frozen
        |
        ↓
Investigation
        |
        ↓
Refund OR Seller Payment
```

---

# 3. Technology Stack

## Mobile Application

Framework:

```
React Native + Expo
```

Why:

* Cross platform
* Android + iOS support
* Fast development

Languages:

```
JavaScript / TypeScript
```

---

## Backend

Framework:

```
Node.js
Express.js
```

Responsibilities:

* Authentication
* Transactions
* Escrow logic
* Moolre integration
* Notifications
* Disputes

---

## Database

Recommended:

```
PostgreSQL
```

Why:

* Financial transactions need strong consistency
* Relational data structure
* Secure ledger management

---

## Authentication

Options:

Primary:

```
JWT Authentication
```

Additional:

* OTP login
* Phone verification
* Biometric authentication

---

## Mobile Money Integration

Provider:

```
Moolre API
```

Used for:

* Payment collection
* Disbursement
* USSD
* SMS notifications

---

# 4. System Architecture

```
                 USER

        Mobile App / USSD

                 |
                 |

          VeriTrade Backend

                 |
        ---------------------

        Authentication Service

        Escrow Engine

        Transaction Ledger

        Dispute Management

        Notification Service


                 |

             Moolre API

                 |

      Mobile Money / Bank Networks

```

---

# 5. Project Structure

## Backend

```
veritrade-backend/

src/

 ├── controllers/
 │
 ├── routes/
 │
 ├── models/
 │
 ├── services/
 │
 ├── middleware/
 │
 ├── utils/
 │
 ├── config/
 │
 └── server.js


.env

package.json

README.md
```

---

# 6. Backend Setup

## Step 1: Create Project

```bash
mkdir veritrade-backend

cd veritrade-backend

npm init -y
```

---

## Step 2: Install Dependencies

```bash
npm install express cors dotenv pg bcrypt jsonwebtoken axios
```

Development:

```bash
npm install nodemon --save-dev
```

---

## Step 3: Create Server

server.js

```javascript
const express = require("express");

const app = express();


app.use(express.json());


app.get("/", (req,res)=>{

res.send("VeriTrade API Running");

});


app.listen(5000,()=>{

console.log("Server started");

});
```

---

# 7. Database Design

## Users Table

```
users

id
full_name
phone
email
password_hash
role
kyc_status
created_at
```

Roles:

```
BUYER
SELLER
ADMIN
COURIER
```

---

# Transactions Table

```
transactions

id

transaction_code

buyer_id

seller_id

item_description

amount

status

created_at

expires_at

```

Status:

```
PENDING

FUNDED

DELIVERED

COMPLETED

DISPUTED

REFUNDED
```

---

# Escrow Ledger Table

Important financial table.

```
ledger

id

transaction_id

amount

type

reference

created_at

```

Example:

```
+500 GHS

Buyer deposited money
```

```
-500 GHS

Seller paid
```

---

# Dispute Table

```
disputes

id

transaction_id

reason

status

admin_note

created_at
```

---

# 8. Main Backend Modules

---

# Authentication Module

Features:

* Register
* Login
* OTP verification
* JWT tokens

Endpoints:

```
POST /auth/register

POST /auth/login

POST /auth/verify
```

---

# Escrow Module

Create Transaction:

```
POST /escrow/create
```

Example:

```json
{
"item":"iPhone 14",

"amount":5000,

"seller":"024xxxxxxx"

}
```

---

Approve Payment:

```
POST /escrow/pay
```

---

Confirm Delivery:

```
POST /escrow/confirm
```

---

Release Money:

```
POST /escrow/release
```

---

# 9. Moolre Integration Flow

## Collect Payment

VeriTrade

↓

Moolre Collection API

↓

Mobile Money

↓

Escrow Ledger

---

## Release Payment

Buyer confirms

↓

Backend verifies

↓

Moolre Disbursement API

↓

Seller receives money

---

# 10. Mobile App Structure

```
veritrade-mobile/


src/

 ├── screens/

 ├── components/

 ├── navigation/

 ├── services/

 ├── hooks/

 ├── context/

 └── assets/

```

---

# Screens

## Authentication

* Welcome
* Login
* Register
* OTP

## Buyer

* Dashboard
* Create Escrow
* Transactions
* Verify Delivery
* Dispute

## Seller

* Requests
* Active Orders
* Wallet
* Withdraw

## Admin

* Disputes
* Users
* Transactions

---

# 11. USSD Architecture

USSD Flow:

```
*XXX#

        |

Welcome Menu


1 Create Escrow

2 Pay Request

3 Confirm Delivery

4 Dispute

5 Check Balance

```

---

Backend handles sessions:

Example:

```
USSD Request

      |

Session Manager

      |

Database

      |

Response

```

---

# 12. Security Implementation

## Never trust frontend

Bad:

```
Mobile App says:

Payment completed
```

Never accept this.

Good:

```
Moolre Webhook

        |

Backend verifies

        |

Update Ledger

```

---

# Security Checklist

## Authentication

✔ JWT
✔ OTP
✔ Password hashing

## Payments

✔ Webhook verification
✔ Transaction signatures
✔ Immutable ledger

## Fraud Prevention

✔ Expiry timers
✔ Delivery PIN
✔ Dispute system

---

# 13. MVP Development Plan

## Phase 1

Build:

* User authentication
* User profiles
* Create escrow
* Transaction database

---

## Phase 2

Payment:

* Connect Moolre
* Lock funds
* Payment status

---

## Phase 3

Settlement:

* Delivery verification
* Release payment
* Refund

---

## Phase 4

USSD:

* Feature phone support
* SMS notifications

---

# 14. Future Features

## AI Fraud Detection

Detect:

* suspicious sellers
* repeated disputes
* abnormal transactions

---

## Courier Integration

Partners:

* Delivery companies
* Riders

---

## Reputation System

Users gain:

* Trust score
* Seller rating
* Transaction history

---

# 15. Development Timeline

Beginner MVP:

```
Month 1

Backend foundation
Database
Authentication


Month 2

Mobile app
Escrow flow


Month 3

Moolre integration
Testing


Month 4

USSD
Launch preparation

```

---

# 16. Final Vision

VeriTrade aims to become Ghana's trusted transaction layer for digital commerce.

The goal:

```
No more:

"Send money first"

No more:

"Send goods first"


Only:

Trade safely.
```

---

# END OF DOCUMENT
