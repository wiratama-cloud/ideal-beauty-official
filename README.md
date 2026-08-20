# Ideal Beauty Official — E-Commerce Storefront

A luxury, high-fashion single-tenant e-commerce platform built for **Ideal Beauty Official** ([idealbeautyofficial.com](https://idealbeautyofficial.com)), inspired by premier haute couture fashion platforms like LAAM.com.

The platform manages haute couture sales, bridal & eveningwear rentals, flexible down payments, dynamic Indonesian QRIS and Virtual Account payment processing, guest cart session merging, atomic inventory control with concurrency protection, customer order tracking, and a double-entry financial accounting ledger.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Zero-Friction Local Quick Start](#zero-friction-local-quick-start)
- [Midtrans Payment Testing Guide](#midtrans-payment-testing-guide)
  - [Method 1: Fast UI Simulation (In-Browser)](#method-1-fast-ui-simulation-in-browser)
  - [Method 2: Webhook Callback Simulation (`curl`)](#method-2-webhook-callback-simulation-curl)
  - [Signature Verification Mechanism](#signature-verification-mechanism)
  - [Connecting to Midtrans Sandbox Simulator](#connecting-to-midtrans-sandbox-simulator)
- [Firebase Emulation & Storage Guide](#firebase-emulation--storage-guide)
  - [Offline Local Disk Storage Fallback](#offline-local-disk-storage-fallback)
  - [Firebase Client & Auth Offline Emulation](#firebase-client--auth-offline-emulation)
  - [Connecting to Firebase Cloud / Emulator Suite](#connecting-to-firebase-cloud--emulator-suite)
- [Automated Testing Suite](#automated-testing-suite)
- [Key Endpoints & Routes](#key-endpoints--routes)

---

## Key Features

- **LAAM-Inspired High-Fashion UX**: Minimalist, editorial design system featuring top announcement ticker, sticky navigation header, multi-image hover previews, quick-view modals, and a slide-over cart drawer.
- **Configurable Landing Page Sections**: Dynamic home page sections (New Arrivals by category, Featured Brands, Editor's Picks, Hero Banners) fully manageable via the Admin Console.
- **Product Catalog & URL-Driven Filtering**: Server-side Product Listing Page (PLP) with instant URL-driven search parameters for category, price range, silhouette, and in-stock filtering.
- **Bespoke Sales & Rentals**: Native support for `SALE` (`priceSale`) and `RENTAL` (`priceRent`) item types, including rental start/end date calendar pickers on the Product Detail Page (PDP).
- **Down Payment Checkout Workflow**: Flexible checkout options (`FULL_PAYMENT` or `DOWN_PAYMENT` e.g., 50% deposit). Automatically transitions order states from `PENDING` to `PARTIALLY_PAID` and finally `PAID` upon balance clearance.
- **Indonesian QRIS & Virtual Account Integration**:
  - Dynamic QRIS payload generation compatible with GoPay, OVO, ShopeePay, DANA, BCA Mobile.
  - Bank Virtual Account details (BCA, Mandiri, BNI, BRI).
  - Webhook callback listener (`/api/webhooks/payment`) with SHA-512 signature validation and local mock tolerance.
- **Atomic Inventory Control**: Concurrency-safe stock deduction (`stockSaleAvailable`, `stockRentAvailable`) using conditional Prisma transactions (`where: { id: variantId, stockSaleAvailable: { gte: quantity } }`) to strictly prevent overselling.
- **Guest Cart & Account Session Sync**: Cookie-backed `sessionId` persistence that auto-merges guest items into customer accounts upon login or registration.
- **Customer Account Portal**:
  - Comprehensive order timeline & status tracking (`/account/orders`).
  - Rental return countdowns, courier tracking codes, and instant "Pay Final Balance" triggers (`/account/orders/[id]`).
  - Wishlist management (`/account/wishlist`).
- **Double-Entry Financial Accounting Ledger**:
  - Double-entry ledger tracking `INCOME` (`SALES_REVENUE`, `RENTAL_REVENUE`) and `EXPENSE` (`DESIGN_RND`, `MANUFACTURING_COGS`, `OPERATIONAL`, `MARKETING`).
  - Admin financial dashboard (`/admin/dashboard`) with gross revenue, net profit margin, and expense distribution.
  - One-click CSV audit log export for accounting reports (`/admin/ledger`).

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Database & ORM**: PostgreSQL 16 & [Prisma ORM 7](https://www.prisma.io/) (with `@prisma/adapter-pg`)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) (Responsive WebP generation: 256w, 512w, 768w, 1024w)
- **Testing**: [Vitest 4](https://vitest.dev/) & Custom End-to-End Integration Test Runner
- **Containerization**: [Docker Compose](https://www.docker.com/) for PostgreSQL 16 local database

---

## Project Structure

```
idealbeautyofficial/
├── docker-compose.yml       # PostgreSQL 16 container definition (:5432)
├── .env                     # Pre-configured local emulation environment (committed)
├── package.json             # Scripts & dependencies
├── prisma/
│   ├── schema.prisma        # Prisma schema (Models, Enums, Composite Indexes)
│   └── seed.ts              # Luxury fashion catalog dummy seed script
├── public/
│   └── images/              # Static catalog seed photography
├── src/
│   ├── app/
│   │   ├── (storefront)/    # Storefront pages (Home, Products, PDP, Checkout, Account)
│   │   ├── admin/           # Admin Portal (Dashboard, Catalog, Orders, Ledger, Banners)
│   │   ├── actions/         # Next.js Server Actions (Cart, Checkout, Admin, Auth)
│   │   └── api/webhooks/    # Midtrans payment webhook listener (/api/webhooks/payment)
│   ├── components/          # Reusable UI & Atelier components
│   └── lib/
│       ├── prisma.ts        # Prisma Client singleton
│       ├── firebase/        # Firebase client & admin SDK wrappers (with emulator support)
│       └── services/        # Domain Services (Product, Order, Payment, Gateway, Ledger, Storage)
└── tests/
    ├── run-tests.ts         # Full lifecycle integration runner (8 core transaction tests)
    ├── midtrans-payment.test.ts
    ├── firebase-storage-emulator.test.ts
    └── image-processor.test.ts
```

---

## Zero-Friction Local Quick Start

The repository is configured for **100% offline local development and zero-dependency emulation**. You do not need to create external cloud accounts (Midtrans or Firebase) to run and test all storefront and admin workflows.

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Docker & Docker Compose** (for running local PostgreSQL)

---

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Verify Environment Configuration

A functional `.env` file is already provided in the repository with local defaults:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/idealbeauty?schema=public"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@idealbeautyofficial.com"

# Midtrans Mock / Sandbox Mode
MIDTRANS_SERVER_KEY="SB-Mid-server-sample-key"
MIDTRANS_CLIENT_KEY="SB-Mid-client-sample-key"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-sample-key"
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION="false"
MIDTRANS_MOCK_MODE="true"

# Firebase Storage & Auth Emulation
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyMockLocalApiKeyForOfflineDev12345"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="localhost"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ideal-beauty-official-b313d"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ideal-beauty-official-b313d.appspot.com"
FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9199"
NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9199"
```

### Step 3: Start Local PostgreSQL Database

Spin up the containerized PostgreSQL database:

```bash
docker compose up -d
```

### Step 4: Synchronize Schema & Seed Luxury Catalog

Push the Prisma schema to PostgreSQL and seed initial high-fashion products, navigation trees, vouchers, size charts, and admin credentials:

```bash
npx prisma db push
npx prisma db seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Portal**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) (Default admin email: `admin@idealbeautyofficial.com`)

---

## Midtrans Payment Testing Guide

The application supports both **QRIS** (instant QR scan) and **Bank Virtual Accounts** (BCA, Mandiri, BNI, BRI). You can test payments locally using either the in-browser UI simulator or webhook HTTP requests.

### Method 1: Fast UI Simulation (In-Browser)

This is the fastest method for testing order fulfillment, stock deduction, and ledger updates:

1. Browse the storefront, add items to cart, and proceed to **`/checkout`**.
2. Select **Down Payment (50%)** or **Full Payment**, and choose **QRIS** or **Virtual Account**.
3. Complete checkout to reach the order tracking page (`/account/orders/[id]`).
4. On the payment prompt, click the **"Simulate Payment (Dev Sandbox)"** button.
5. The server action `simulatePaymentCompletionAction(paymentId)` instantly marks the payment as `COMPLETED`, transitions order status to `PARTIALLY_PAID` or `PAID`, and logs double-entry revenue to the financial ledger.

---

### Method 2: Webhook Callback Simulation (`curl`)

Midtrans sends asynchronous HTTP POST notifications when a customer completes a payment. You can simulate these webhooks locally using `curl`:

#### Down Payment Settlement Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "YOUR_PAYMENT_ID",
    "order_id": "YOUR_ORDER_ID",
    "transaction_status": "settlement",
    "status_code": "200",
    "gross_amount": "5000000.00",
    "transaction_id": "MOCK-MIDTRANS-TX-1001"
  }'
```

#### Final Balance Settlement Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "YOUR_FINAL_PAYMENT_ID",
    "order_id": "YOUR_ORDER_ID",
    "transaction_status": "settlement",
    "status_code": "200",
    "gross_amount": "5000000.00",
    "transaction_id": "MOCK-MIDTRANS-TX-1002"
  }'
```

---

### Signature Verification Mechanism

Midtrans generates a SHA-512 hash to authenticate webhook calls:

$$\text{signature\_key} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$

In `src/lib/services/payment-gateway.ts`:
- When running in production (`NODE_ENV === 'production'`), valid SHA-512 signatures are strictly enforced.
- In local development (`MIDTRANS_MOCK_MODE="true"`), mock webhooks without signatures are gracefully permitted to simplify testing with tools like curl, Postman, or ngrok.

---

### Connecting to Midtrans Sandbox Simulator

To use official Midtrans Sandbox Simulator accounts:
1. Log in to [Midtrans Merchant Dashboard (Sandbox)](https://dashboard.sandbox.midtrans.com/).
2. Navigate to **Settings > Access Keys** and copy your **Server Key** and **Client Key**.
3. In `.env`, set:
   ```env
   MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_ACTUAL_SANDBOX_KEY"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_ACTUAL_SANDBOX_KEY"
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_ACTUAL_SANDBOX_KEY"
   MIDTRANS_MOCK_MODE="false"
   ```
4. Use the [Midtrans Payment Simulator](https://simulator.sandbox.midtrans.com/) to simulate real QRIS scans and VA bank transfers.

---

## Firebase Emulation & Storage Guide

### Firebase Storage Emulator (Local Development)

The application uses Firebase Storage directly for media uploads and variant processing. In local development and testing, it seamlessly integrates with the **Firebase Storage Emulator**:

1. **Responsive WebP Optimization**: The built-in image processor (`src/lib/services/image-processor.ts`) uses Sharp to automatically generate multi-resolution WebP variants (`256w`, `512w`, `768w`, `1024w` + original) and uploads them to Firebase Storage / Emulator.
2. **Deterministic Variant Management**: Deleting or updating an image variant will automatically clean up all associated variant resolutions in Firebase Storage / Emulator.

---

### Firebase Client & Auth Offline Emulation

- `NEXT_PUBLIC_FIREBASE_API_KEY` and project IDs in `.env` are pre-populated with mock strings to enable offline development without external Firebase errors.
- Push notification service worker (`public/firebase-messaging-sw.js`) and PWA notification hooks will gracefully operate in offline mock mode when push credentials are not connected.

---

### Connecting to Firebase Cloud / Emulator Suite

To enable live Firebase Cloud Storage or the local Firebase Emulator Suite:

1. **Firebase Cloud Storage (Production)**:
   Add your Firebase Service Account JSON credentials to `.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   ```
2. **Firebase Emulator Suite (Local Emulators)**:
   If running the Firebase Emulator Suite locally:
   ```bash
   firebase emulators:start
   ```
   Set `FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9199"` (or `localhost:9199`) and `FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"`.

---

## Automated Testing Suite

The repository includes comprehensive automated test coverage for both unit components and core business transactions.

### Running Vitest Suites (266+ Tests)

Runs all unit, component, and isolated service tests (in-memory database mode):

```bash
npm test
# or
npx vitest run
```

To run a specific test suite:

```bash
npx vitest run tests/midtrans-payment.test.ts
npx vitest run tests/firebase-storage-emulator.test.ts
npx vitest run tests/image-processor.test.ts
```

---

### Running Full Lifecycle Integration Runner

Executes the 8-step end-to-end integration test against the local database:

```bash
npx tsx tests/run-tests.ts
```

#### What `run-tests.ts` Validates:
1. **Catalog Search & Filtering**: Product discovery by category and search terms.
2. **Wishlist Persistence**: User wishlist toggle, addition, and retrieval.
3. **Guest Cart & Account Sync**: Guest session cart persistence and automatic merging upon user login.
4. **Atomic Checkout with Down Payment**: 50% deposit calculation and atomic variant stock deduction.
5. **High Concurrency Stock Guard**: Prevention of overselling under simultaneous checkout requests.
6. **Payment Webhook Verification**: Settlement processing and double-entry `SALES_REVENUE` ledger creation.
7. **Final Balance Clearance**: Second payment creation and order status transition to `PAID`.
8. **Double-Entry Ledger & CSV Export**: Operational expense logging and financial CSV audit log generation.

---

### Database Inspection (Prisma Studio)

Launch Prisma Studio to visually inspect database tables, orders, ledger entries, and catalog stock:

```bash
npx prisma studio
```

Open [http://localhost:5555](http://localhost:5555) in your browser.

---

## Key Endpoints & Routes

| Section | Route | Description |
| :--- | :--- | :--- |
| **Storefront** | `/` | Luxury editorial homepage with dynamic configurable sections |
| **Storefront** | `/products` | Catalog listing with URL-driven filters (Category, Silhouette, Price) |
| **Storefront** | `/products/[slug]` | Product details with sale/rental mode & calendar date pickers |
| **Storefront** | `/checkout` | Down payment / Full payment checkout flow |
| **Account** | `/account/orders` | Order history & live status tracking |
| **Account** | `/account/orders/[id]` | Courier tracking & "Pay Final Balance" actions |
| **Account** | `/account/wishlist` | Customer wishlist collection |
| **Admin** | `/admin/dashboard` | Gross revenue, expense analytics, and net profit charts |
| **Admin** | `/admin/orders` | Order fulfillment, rental return statuses, and courier assignment |
| **Admin** | `/admin/inventory` | Variant stock levels, cost price, and stock adjustments |
| **Admin** | `/admin/sections` | Configurable homepage banners and featured collections |
| **Admin** | `/admin/ledger` | Double-entry accounting ledger & one-click CSV audit export |
| **Webhook** | `/api/webhooks/payment` | Midtrans QRIS and Virtual Account settlement notification listener |
