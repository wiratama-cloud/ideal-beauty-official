# Ideal Beauty Official — E-Commerce Storefront

A luxury, high-fashion single-tenant e-commerce platform built for **Ideal Beauty Official** ([idealbeautyofficial.com](https://idealbeautyofficial.com)), inspired by premier fashion platforms like LAAM.com.

The platform manages haute couture sales, bridal & eveningwear rentals, flexible down payments, dynamic Indonesian QRIS and Virtual Account payment processing, guest cart merging, atomic inventory control, customer order tracking, and financial accounting ledgers.

---

## Key Features

- **LAAM-Inspired High-Fashion UX**: Clean, minimalist design system with top announcement ticker, sticky navigation header, multi-image hover previews, quick view modals, and a slide-over cart drawer.
- **Configurable Landing Page Sections**: Dynamic home page sections (New Arrivals with Women, Men, Kids subcategories, Featured Brands, Editor's Picks) fully manageable via the Admin Console.
- **Product Catalog & URL-Driven Filtering**: Server-side product listing page (PLP) with instant filtering by category, search query, price range, and availability using Next.js Server Components and URL search parameters.
- **Bespoke Sales & Rentals**: Support for `SALE` (`priceSale`) and `RENTAL` (`priceRent`) item types, including rental start/end date pickers on the Product Detail Page (PDP).
- **Guest Cart & Account Session Sync**: Cookie-backed `sessionId` persistence for guest carts that auto-merges into the user account upon login/registration.
- **Indonesian QRIS & Payment Gateway**:
  - Dynamic QRIS QR code display for instant scanning via GoPay, OVO, ShopeePay, BCA Mobile, etc.
  - Bank Virtual Account details (BCA, Mandiri, BNI, BRI).
  - Abstracted payment gateway service (Midtrans/Xendit compatible) with callback webhook verification (`/api/webhooks/payment`).
- **Down Payment Checkout Workflow**: Flexible checkout options (`DOWN_PAYMENT` updates order status to `PARTIALLY_PAID`, `FINAL_BALANCE` updates status to `PAID`).
- **Atomic Inventory Control**: Concurrency-safe stock deduction (`stockAvailable`) using conditional Prisma transactions (`where: { id: variantId, stockAvailable: { gte: quantity } }`) to prevent overselling.
- **Customer Account Portal**:
  - Order history and status tracking (`/account/orders`).
  - Courier tracking codes, rental return timelines, and "Pay Final Balance" trigger (`/account/orders/[id]`).
  - Wishlist management (`/account/wishlist`).
- **Financial Accounting Ledger**:
  - Double-entry ledger tracking `INCOME` (`SALES_REVENUE`, `RENTAL_REVENUE`) and `EXPENSE` (`DESIGN_RND`, `MANUFACTURING_COGS`, `OPERATIONAL`).
  - Admin financial dashboard (`/admin/dashboard`) with revenue vs expense analytics.
  - Rental & order status management (`/admin/orders`).
  - One-click CSV audit log export for accounting reports (`/admin/ledger`).

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Database & ORM**: PostgreSQL 16 & [Prisma ORM 7](https://www.prisma.io/)
- **State Management**: React Context (`CartContext`) & URL Search Parameters
- **Testing**: [Vitest](https://vitest.dev/) & Custom Integration Test Runner
- **Containerization**: [Docker Compose](https://www.docker.com/) for local PostgreSQL setup

---

## Project Structure

```
idealbeautyofficial/
├── docker-compose.yml       # Docker Compose setup for local PostgreSQL 16
├── .env.example             # Template for environment variables
├── app/                     # Next.js App Router
│   ├── (storefront)/        # Storefront pages (Home, Products, PDP, Checkout, Account, Wishlist)
│   ├── admin/               # Admin Portal (Dashboard, Orders, Ledger Audit)
│   ├── api/webhooks/payment # Payment Gateway Webhook handler
│   └── actions/             # Next.js Server Actions (Cart, Wishlist, Checkout, Auth, Admin)
├── src/
│   ├── components/          # Reusable UI components (Layout, Product, Cart, Checkout, Account)
│   └── lib/
│       ├── prisma.ts        # Prisma Client singleton initialization
│       ├── session.ts       # Session cookie utility
│       └── services/        # Domain Services (Product, Cart, Order, Payment, Gateway, Ledger)
├── prisma/
│   ├── schema.prisma        # 11 Data Models & 5 Enums with composite performance indexes
│   └── seed.ts              # Sample luxury fashion catalog seed script
└── tests/
    └── run-tests.ts         # E2E integration test suite covering checkout, QRIS, and stock guards
```

---

## Getting Started

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Docker & Docker Compose** (for running local PostgreSQL)

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/your-org/idealbeautyofficial.git
cd idealbeautyofficial
npm install
```

### Step 2: Environment Setup

Copy `.env.example` to create your local `.env` configuration file:

```bash
cp .env.example .env
```

Ensure the database connection URL in `.env` matches your setup:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/idealbeauty?schema=public"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
MIDTRANS_SERVER_KEY="SB-Mid-server-sample-key"
MIDTRANS_CLIENT_KEY="SB-Mid-client-sample-key"
```

### Step 3: Start Local Database

Spin up the containerized PostgreSQL database using Docker Compose:

```bash
docker-compose up -d
```

### Step 4: Run Migrations & Seed Database

Push the Prisma schema to PostgreSQL and populate initial sample catalog data:

```bash
npx prisma db push
npx prisma db seed
```

### Step 5: Start Development Server

Run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the storefront.

---

## Testing

Run the automated integration test suite to verify database transactions, atomic stock deduction under high concurrency, guest cart auto-merging, QRIS webhook handling, and ledger calculations:

```bash
npm test
# or
npx tsx tests/run-tests.ts
```

---

## Key Endpoints

- **Storefront Home**: `/`
- **Product Catalog (PLP)**: `/products`
- **Product Detail (PDP)**: `/products/[slug]`
- **Checkout**: `/checkout`
- **Customer Order History**: `/account/orders`
- **Order Tracking & Balance Payment**: `/account/orders/[id]`
- **Customer Wishlist**: `/account/wishlist`
- **Admin Dashboard**: `/admin/dashboard`
- **Admin Inventory Management**: `/admin/inventory`
- **Admin Landing Sections Manager**: `/admin/sections`
- **Admin Order & Rental Management**: `/admin/orders`
- **Admin Financial Ledger & CSV Export**: `/admin/ledger`
