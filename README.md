**Bank Management Ledger System

A production-ready, highly secure **Node.js & Express** ledger engine architected for financial tracking, immutable transaction accounting, and strict access management. Built with backend scalability and auditability in mind.


**Core Capabilities & Architecture

This system manages financial states securely using a predictable, gatekept request-response pipeline.

* **Cryptographic Guardrails:** Leverages `bcrypt.js` for one-way salt-hashed password protection and issues cryptographically signed **JSON Web Tokens (JWT)** for stateless authentication.
* **Granular Role-Based Access Control (RBAC):** Restricts high-privilege operations (e.g., system asset injection via `/system/initial-fund`) using specialized authorization guards checking for verified `systemUser` status.
* **Token Blacklisting Engine:** Mitigates token-replay vulnerabilities on session termination. Upon logout, active tokens are stored in a `tokenblacklists` database repository.
* **Automated Data Maintenance:** Implements a native **MongoDB TTL (Time-To-Live) index** on the blacklist engine, allowing records to self-expire autonomously to prevent memory leaks and database bloat.
* **Automated Provisioning Loop:** Automatically seeds and links a fresh multi-currency ledger account document to a user record upon successful registration.
* **Asynchronous Audit Trail:** Features an integrated **Nodemailer SMTP subsystem** that emits automated activity logs and transactional receipts directly to clients out-of-band, preserving server responsiveness.

---

## 🛠️ Tech Stack

* **Runtime & Framework:** Node.js (v22.x) | Express.js
* **Database Engine:** MongoDB | Mongoose ODM
* **Security Subsystem:** JSON Web Tokens (JWT) | Bcrypt.js
* **Event Notifications:** Nodemailer SMTP Integration

---

## 📂 System Topology

```text
Bank-Management-Backend/
├── src/
│   ├── controllers/   # Request orchestration & business logic
│   │   ├── account.controller.js
│   │   └── auth.controller.js
│   ├── middleware/    # Auth interception & RBAC privilege guards
│   │   └── auth.middleware.js
│   ├── models/        # Strict Mongoose schema configurations
│   │   ├── account.model.js
│   │   ├── blacklist.model.js
│   │   └── user.model.js
│   └── routes/        # Clean HTTP endpoint declarations
│       ├── accounts.route.js
│       └── transaction.routes.js
├── .env.example
├── package.json
└── server.js
