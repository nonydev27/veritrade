# VeriTrade — Executive Project Summary
**Product:** VeriTrade  
**Author:** Karl Djansi, Malcolm Texson Nettey, Akachukwu Favour  
**Document Type:** Executive Summary & Technical Overview  
**Status:** Approved Blueprint  
**Target Architecture:** Mobile (React Native) + USSD (Moolre API)  

---

## 1. Executive Summary
VeriTrade is an innovative peer-to-peer (P2P) secure escrow platform engineered specifically for the digital commerce landscape in Ghana. By acting as an immutable, trusted intermediary, VeriTrade eliminates the structural trust deficiencies inherent in online social commerce ("send money first" vs. "send goods first"). 

The platform guarantees safety for both market participants:
* **Buyers:** Insulated from payment fraud; funds are only released upon verified receipt and inspection of products.
* **Sellers:** Protected against fraudulent payment proofs and "buyer ghosting"; funds are locked in escrow prior to dispatch.

---

## 2. Core Transaction Lifecycle

### Standard Escrow Workflow
```
[Buyer Creates Transaction] 
           │
           ▼
[Seller Accept Request] 
           │
           ▼
[Buyer Funds Escrow] ───► (Locked in VeriTrade Escrow Wallet)
           │
           ▼
[Seller Ships & Delivers] 
           │
           ▼
[Buyer Confirms Receipt] 
           │
           ▼
[Funds Disbursed to Seller]
```

### Exception & Dispute Workflow
```
[Transaction Disputed] 
           │
           ▼
[Escrow Ledger Frozen] 
           │
           ▼
[Admin Arbitration/Investigation] 
           │
           ▼
   ┌───────┴───────┐
   ▼               ▼
[Refund Buyer]  [Pay Seller]
```

---

## 3. Technology Stack & Infrastructure

| Component | Technology | Rationale & Responsibilities |
| :--- | :--- | :--- |
| **Mobile Frontend** | React Native + Expo | Cross-platform (iOS/Android) code efficiency and rapid MVP deployment. |
| **Backend API** | Node.js + Express.js | High concurrency, decoupled services for authentication, escrow logic, and notification delivery. |
| **Database** | PostgreSQL | Enterprise-grade ACID compliance, relational safety for precise ledger management. |
| **Payment Gateway** | Moolre API | National mobile money and bank rail integration, automated collection/disbursement, and USSD session handling. |
| **Security Layer** | JWT, OTP, Bcrypt | Cryptographic multi-factor authentication, immutable transaction signatures, and webhook authenticity validation. |

---

## 4. Database Schema Matrix

### Core Entities & Attributes

* **`users`**: `id`, `full_name`, `phone`, `email`, `password_hash`, `role` (`BUYER`, `SELLER`, `ADMIN`, `COURIER`), `kyc_status`, `created_at`.
* **`transactions`**: `id`, `transaction_code`, `buyer_id`, `seller_id`, `item_description`, `amount`, `status` (`PENDING`, `FUNDED`, `DELIVERED`, `COMPLETED`, `DISPUTED`, `REFUNDED`), `created_at`, `expires_at`.
* **`ledger`**: `id`, `transaction_id`, `amount`, `type` (Credit/Debit), `reference`, `created_at`.
* **`disputes`**: `id`, `transaction_id`, `reason`, `status`, `admin_note`, `created_at`.

---

## 5. System Implementation Roadmap

```
 MONTH 1: Core Foundation
 ├── User Authentication Modules (JWT, OTP)
 ├── Relational Database Layer Configuration
 └── Base RESTful APIs (Registration & Profiles)

 MONTH 2: Application & Workflow Engine
 ├── React Native Mobile Application Shell
 ├── Escrow State-Machine Logic Development
 └── Internal Transaction Flows & Notifications

 MONTH 3: Payment Integration & Hardening
 ├── Moolre Collection & Disbursement API Integration
 ├── Secure Webhook Verification Systems
 └── Closed-Loop End-to-End Testing

 MONTH 4: USSD Engine & Launch
 ├── Feature Phone USSD Menu Interface (*XXX#)
 ├── Stress Testing & Final Audit
 └── Production Launch Preparation
```

---

## 6. Strategic Security Directives
1.  **Zero-Trust Frontend Model:** The backend never registers a transaction state shift based on client-side confirmation. All financial state updates are exclusively processed via verified cryptographic server-to-server webhooks provided by Moolre.
2.  **Immutable Ledger Rule:** Financial ledger entries (`ledger` table) are strictly append-only. Corrective actions generate a matching offsetting ledger record to ensure a permanent, auditable financial footprint.
3.  **Compulsory Fraud Walls:** Timeouts force automatic refunds if a seller fails to accept or ship within designated intervals. Delivery PIN handshakes prevent false buyer claims of non-receipt.

---

## 7. Future Horizon Capabilities
* **AI Fraud Engine:** Real-time predictive anomaly detection assessing behavior patterns of sellers and transaction risk metrics.
* **Third-Party Logistics Integration:** API handshakes directly with nationwide courier fleets and dispatch networks for automated delivery tracking.
* **Decentralized Reputation Ledger:** Transparent trust scoring calculated automatically via user dispute ratios, historical volume, and verified completion statistics.
