# Shree Laxmi Infratech WhatsApp Bot

Production-ready WhatsApp automation for Shree Laxmi Infratech, built with Node.js + Express + Sequelize. It handles NOC registration, renewals, premise registration, insurance applications, quotation upload/approval flows, and payment proof verification.

## Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Key Routes](#key-routes)
- [Project Structure](#project-structure)
- [Compliance URLs](#compliance-urls)
- [Troubleshooting](#troubleshooting)

## Overview

This service exposes:

- A Meta/WhatsApp webhook (`/webhook`) to receive customer messages.
- Web forms (Express-rendered HTML) for customer submissions and owner actions.
- Sequelize models storing customer/application data and uploaded files (PDFs, screenshots, premise documents) in DB BLOB fields.

## Architecture Diagram

```mermaid
flowchart LR
  WA[WhatsApp Cloud API]:::whatsapp
  WH[Webhook\nGET/POST /webhook]:::webhook
  SVR[Node.js + Express\nindex.js]:::server

  subgraph Web[Web UI (Forms & Views)]
    P1[/quotationForm\n(quotation upload)/]:::pages
    P2[/NoCRegistrationForm\n(NOC apply)/]:::pages
    P3[/form\n(renewal apply)/]:::pages
    P4[/premiseRegistrationForm\n(premise docs)/]:::pages
    P5[/insuranceForm\n(insurance apply)/]:::pages
    P6[/paymentUploadForm\n(payment proof)/]:::pages
  end

  DB[(Sequelize DB\nSQLite (default) or PostgreSQL)]:::db
  FILES[(DB BLOB Storage\nQuotation PDF • Payment Proof\nPremise Docs)]:::files
  QR[UPI QR Generation\n(in-memory)]:::qr

  CUST[Customer WhatsApp]:::customer
  OWNER[Owner WhatsApp]:::owner

  WA -->|Webhook events| WH --> SVR
  SVR -->|Read/Write| DB
  SVR -->|Stores/Serves| FILES
  SVR --> QR --> WA
  SVR -->|Interactive messages\n(list/buttons/CTA URLs)| WA

  P1 <--> SVR
  P2 <--> SVR
  P3 <--> SVR
  P4 <--> SVR
  P5 <--> SVR
  P6 <--> SVR

  WA --> CUST
  WA --> OWNER

  classDef whatsapp fill:#25D366,stroke:#0B6E3A,color:#ffffff;
  classDef webhook fill:#F59E0B,stroke:#92400E,color:#111827;
  classDef server fill:#3B82F6,stroke:#1E3A8A,color:#ffffff;
  classDef db fill:#8B5CF6,stroke:#4C1D95,color:#ffffff;
  classDef pages fill:#EC4899,stroke:#9D174D,color:#ffffff;
  classDef files fill:#10B981,stroke:#065F46,color:#ffffff;
  classDef qr fill:#06B6D4,stroke:#0E7490,color:#ffffff;
  classDef owner fill:#111827,stroke:#111827,color:#ffffff;
  classDef customer fill:#F3F4F6,stroke:#9CA3AF,color:#111827;
```

## Features

- WhatsApp menu + interactive flows (list, buttons, CTA URL).
- NOC registration + view pages.
- Renewal applications.
- Premise registration (with document uploads).
- Insurance applications.
- Quotation upload (PDF stored in DB) + customer/owner notifications.
- Payment flow: UPI QR (generated in-memory) + payment screenshot upload + owner confirm/reject.
- Compliance pages for Meta app review: Terms, Privacy, Data deletion instructions.

## Tech Stack

- Node.js, Express
- Sequelize (SQLite by default; PostgreSQL supported)
- Multer (memory storage for uploads)
- Axios (Meta Graph API)
- QR generation: `qrcode`

## Quick Start

```bash
npm install
npm run dev
```

Server listens on `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the project root:

```env
# WhatsApp / Meta
WHATSAPP_TOKEN=...
PHONE_NUMBER_ID=...
VERIFY_TOKEN=...
WHATSAPP_API_VERSION=v25.0

# Public base URL of this service (Render / ngrok)
BASE_URL=https://your-public-domain

# Payments
UPI_ID=yourupi@bank

# Owner/admin number (no +, digits only)
OWNER_PHONE_NUMBER=918006243900

# Database
# Default is SQLite (in-memory unless configured).
# Persistent SQLite (local):
# DATABASE_DIALECT=sqlite
# DATABASE_URL=sqlite:database.sqlite
#
# PostgreSQL (production):
# DATABASE_DIALECT=postgres
# DATABASE_URL=postgres://user:pass@host:5432/dbname

NODE_ENV=development
```

## Key Routes

### Health

- `GET /` → basic "server running" response
- `GET /health` → database connectivity check

### WhatsApp Webhook (Meta)

- `GET /webhook` → verification (uses `VERIFY_TOKEN`)
- `POST /webhook` → receives WhatsApp messages

### Forms & Views

- `GET /quotationForm?phoneNumber=...&name=...&type=...`
- `GET /NoCRegistrationForm?phoneNumber=...&type=...`
- `GET /form?phoneNumber=...&type=...` (renewals)
- `GET /premiseRegistrationForm?phoneNumber=...&type=...`
- `GET /insuranceForm?phoneNumber=...&type=...`
- `GET /paymentUploadForm?phoneNumber=...&orderNo=...&amount=...&type=...`

### Submissions / Actions

- `POST /nocRegistration`
- `POST /renewal`
- `POST /premiseRegistrationForm` (multipart)
- `POST /insurance`
- `POST /quotationAmount` (multipart PDF)
- `POST /payment/upload` (multipart screenshot)
- `POST /payment/confirm/:paymentId`
- `POST /payment/reject/:paymentId`

### Documents

- `GET /document/quotation/:phoneNumber/:orderNo` → serves quotation PDF (from DB)
- `GET /payment/screenshot/:paymentId` → serves payment screenshot (from DB)

## Project Structure

```
.
├── index.js
├── package.json
├── README.md
├── database/
│   └── db.js
├── models/
│   ├── User.js
│   ├── insuranceTable.js
│   ├── nocRegistration.js
│   ├── paymentProof.js
│   ├── premiseRegistration.js
│   ├── quotationAmount.js
│   ├── relationship.js
│   └── renewalTable.js
└── uploads/   # created at runtime (legacy static mount; current uploads stored in DB)
```

## Compliance URLs

Use these (or your deployed domain equivalents) in the Meta App Dashboard:

- Terms of Service: `https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/terms`
- Privacy Policy: `https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/privacy`
- Data Deletion Instructions: `https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/data-deletion`

## Troubleshooting

- Webhook verification fails
  - Ensure Meta webhook URL points to `https://<BASE_URL>/webhook` and `VERIFY_TOKEN` matches.
- Messages not sending
  - Confirm `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, and `WHATSAPP_API_VERSION` (default `v25.0`).
- DB connection issues
  - Default: SQLite `sqlite::memory:` (data resets on restart).
  - Persistent local SQLite: set `DATABASE_DIALECT=sqlite` and `DATABASE_URL=sqlite:database.sqlite`.
  - PostgreSQL: set `DATABASE_DIALECT=postgres` and `DATABASE_URL`.

## Development

```bash
npm run dev
# or
npm start
```

Local webhook testing:

```bash
ngrok http 3000
```

Set Meta webhook URL to `https://<ngrok-domain>/webhook`.

## Additional Resources

- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Express: https://expressjs.com/
- Sequelize: https://sequelize.org/
- ngrok: https://ngrok.com/docs

## License

ISC (per `package.json`).
