# Production Deployment Guide: Firebase App Hosting

This document provides a comprehensive, step-by-step operational guide for deploying the **Ideal Beauty Official** storefront and administrative platform (built with Next.js 16, React 19, Tailwind CSS v4, and Prisma 7) to **Firebase App Hosting**.

---

## 1. Overview & Architecture

Firebase App Hosting is a serverless runtime built on Google Cloud Run and Google Cloud Build designed specifically for full-stack Next.js applications.

```
┌─────────────────┐        ┌───────────────────────┐        ┌─────────────────────────┐
│                 │ Push   │                       │ Build  │                         │
│  GitHub Repository ├───────► Google Cloud Build   ├───────►│  Firebase App Hosting   │
│                 │        │                       │        │      (Cloud Run)        │
└─────────────────┘        └───────────────────────┘        └────────────┬────────────┘
                                                                         │
    ┌─────────────────────────┐                                          │ Pool Connection
    │   GCP Secret Manager    ├──────────────────────────────────────────┼───────────────┐
    │ (DATABASE_URL, Keys)    │ Inject Secrets at Runtime                │               │
    └─────────────────────────┘                                          ▼               ▼
                                                           ┌───────────────────┐ ┌───────────────┐
                                                           │ Production PG DB  │ │ Midtrans API  │
                                                           │ (Cloud SQL / Neon)│ │ & Firebase SDK│
                                                           └───────────────────┘ └───────────────┘
```

---

## 2. Prerequisites

Before initializing deployment, ensure the following prerequisites are met:

1. **Firebase CLI**: Installed globally (`npm install -g firebase-tools`) and authenticated (`firebase login`).
2. **Google Cloud Project**: Active GCP project with Firebase enabled and billing activated (Blaze plan required for Cloud Run/App Hosting).
3. **Database Instance**: Accessible PostgreSQL instance (GCP Cloud SQL, Neon, Supabase, or self-hosted) supporting SSL/TLS connections.
4. **GitHub Repository**: Admin access to the GitHub repository to link Firebase App Hosting build triggers.

---

## 3. Firebase CLI Backend Creation

You can initialize your App Hosting backend either via the Firebase Console or using the Firebase CLI.

### Option A: Using Firebase CLI (Recommended)

1. Navigate to the project root directory:
   ```bash
   cd /path/to/idealbeautyofficial
   ```

2. Run the backend creation command:
   ```bash
   firebase apphosting:backends:create --project YOUR_FIREBASE_PROJECT_ID
   ```

3. Follow the interactive prompts:
   - **Backend ID**: Enter a unique identifier (e.g., `idealbeauty-storefront`).
   - **Region**: Select your primary region (e.g., `asia-southeast1` for Singapore/Indonesia low latency).
   - **GitHub Connection**: Authorize GitHub access and select the repository (`idealbeautyofficial`).
   - **Target Branch**: Select `main` for automatic production deployment triggers.
   - **Root Directory**: Accept `/` (root directory).

### Option B: Using Firebase Console

1. Open the [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Navigate to **App Hosting** in the left sidebar menu.
3. Click **Get Started** and connect your GitHub account.
4. Select the repository and set the deployment branch to `main`.
5. Configure backend settings:
   - **Backend Name**: `idealbeauty-storefront`
   - **Region**: `asia-southeast1` (or your preferred region)
6. Click **Finish and Deploy**.

---

## 4. GCP Secret Manager & Environment Variable Configuration

Sensitive application credentials must be securely stored in Google Cloud Secret Manager and mapped to App Hosting environment variables via `apphosting.yaml`.

### Step 4.1: Create Secrets in Secret Manager

Execute `gcloud` CLI commands or use the GCP Console to create the required secrets:

```bash
# 1. Database Connection URL
gcloud secrets create DATABASE_URL --replication-policy="automatic" --project=YOUR_FIREBASE_PROJECT_ID
echo -n "postgresql://user:password@host:5432/idealbeauty?schema=public&sslmode=require&connection_limit=5" | \
  gcloud secrets versions add DATABASE_URL --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

# 2. Admin Access Email
gcloud secrets create ADMIN_EMAIL --replication-policy="automatic" --project=YOUR_FIREBASE_PROJECT_ID
echo -n "admin@idealbeautyofficial.com" | \
  gcloud secrets versions add ADMIN_EMAIL --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

# 3. Firebase Admin Service Account Key (Single-line minified JSON string)
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --replication-policy="automatic" --project=YOUR_FIREBASE_PROJECT_ID
gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT_KEY --data-file=path/to/service-account.json --project=YOUR_FIREBASE_PROJECT_ID

# 4. Midtrans Payment Gateway Server Key
gcloud secrets create MIDTRANS_SERVER_KEY --replication-policy="automatic" --project=YOUR_FIREBASE_PROJECT_ID
echo -n "Mid-server-YOUR_PRODUCTION_SERVER_KEY" | \
  gcloud secrets versions add MIDTRANS_SERVER_KEY --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

# 5. Firebase Public Client SDK Variables
gcloud secrets create NEXT_PUBLIC_FIREBASE_API_KEY --project=YOUR_FIREBASE_PROJECT_ID
echo -n "AIzaSyYourProductionApiKey" | gcloud secrets versions add NEXT_PUBLIC_FIREBASE_API_KEY --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --project=YOUR_FIREBASE_PROJECT_ID
echo -n "your-project-id.firebaseapp.com" | gcloud secrets versions add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --project=YOUR_FIREBASE_PROJECT_ID
echo -n "your-project-id" | gcloud secrets versions add NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --project=YOUR_FIREBASE_PROJECT_ID
echo -n "your-project-id.firebasestorage.app" | gcloud secrets versions add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

gcloud secrets create NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --project=YOUR_FIREBASE_PROJECT_ID
echo -n "123456789012" | gcloud secrets versions add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

gcloud secrets create NEXT_PUBLIC_FIREBASE_APP_ID --project=YOUR_FIREBASE_PROJECT_ID
echo -n "1:123456789012:web:abcdef1234567890" | gcloud secrets versions add NEXT_PUBLIC_FIREBASE_APP_ID --data-file=- --project=YOUR_FIREBASE_PROJECT_ID

gcloud secrets create NEXT_PUBLIC_FIREBASE_VAPID_KEY --project=YOUR_FIREBASE_PROJECT_ID
echo -n "BEl7...YourProductionVapidKey" | gcloud secrets versions add NEXT_PUBLIC_FIREBASE_VAPID_KEY --data-file=- --project=YOUR_FIREBASE_PROJECT_ID
```

### Step 4.2: Grant Secret Manager Access to App Hosting

App Hosting uses a default backend service account (`firebase-app-hosting-compute@YOUR_FIREBASE_PROJECT_ID.iam.gserviceaccount.com`). Grant it access to read secrets:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_FIREBASE_PROJECT_ID --format='value(projectNumber)')

gcloud projects add-iam-policy-binding YOUR_FIREBASE_PROJECT_ID \
  --member="serviceAccount:firebase-app-hosting-compute@${YOUR_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 4.3: Verify `apphosting.yaml` Mapping

Ensure `apphosting.yaml` in the repository root references all secrets correctly:

```yaml
runConfig:
  cpu: 1
  memoryMiB: 1024
  minInstances: 0
  maxInstances: 10
  concurrency: 80

env:
  - variable: DATABASE_URL
    secret: DATABASE_URL
  - variable: ADMIN_EMAIL
    secret: ADMIN_EMAIL
  - variable: FIREBASE_SERVICE_ACCOUNT_KEY
    secret: FIREBASE_SERVICE_ACCOUNT_KEY
  - variable: MIDTRANS_SERVER_KEY
    secret: MIDTRANS_SERVER_KEY
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: NEXT_PUBLIC_FIREBASE_API_KEY
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    secret: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    secret: NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    secret: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    secret: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    secret: NEXT_PUBLIC_FIREBASE_APP_ID
  - variable: NEXT_PUBLIC_FIREBASE_VAPID_KEY
    secret: NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

---

## 5. Production PostgreSQL Setup & Connection Pooling

Because Cloud Run dynamically scales containers up and down, direct unpooled connections can quickly exhaust PostgreSQL `max_connections` limits.

### Option A: GCP Cloud SQL for PostgreSQL

1. Provision a Cloud SQL PostgreSQL instance (minimum recommended: 1 vCPU, 3.75 GB RAM).
2. Configure **Public IP with Authorized Networks** or **Private IP with Serverless VPC Access**.
3. Enable SSL (`sslmode=require`).
4. Append `connection_limit=5` to the connection string to constrain client pool sizes per container instance:
   ```env
   DATABASE_URL="postgresql://db_user:password@INSTANCE_IP:5432/idealbeauty?schema=public&sslmode=require&connection_limit=5"
   ```

### Option B: External Managed PostgreSQL (Neon / Supabase)

1. When using Neon or Supabase, use the **Pooled Connection String** (PgBouncer mode).
2. Set `connection_limit=5` and `pgbouncer=true`:
   ```env
   DATABASE_URL="postgresql://user:password@pgpool-host:6543/idealbeauty?schema=public&sslmode=require&pgbouncer=true&connection_limit=5"
   ```

---

## 6. Production Database Schema Migrations

> **Important**: Never run destructive migration commands (`prisma db push --force-reset`) in production.

### Executing Migrations

To apply pending Prisma migrations safely to your production database, execute `prisma migrate deploy` from a secure CI/CD pipeline or admin workstation with direct database connectivity:

1. Export production `DATABASE_URL`:
   ```bash
   export DATABASE_URL="postgresql://db_user:password@HOST:5432/idealbeauty?schema=public&sslmode=require"
   ```

2. Run migration deployment:
   ```bash
   npx prisma migrate deploy
   ```

3. (Optional) Run seeding script for initial administrative data:
   ```bash
   npx prisma db seed
   ```

---

## 7. Custom Domain Configuration

To point your custom domain (e.g., `www.idealbeautyofficial.com`) to your Firebase App Hosting deployment:

1. Open **Firebase Console > App Hosting > Domains**.
2. Click **Add Custom Domain**.
3. Enter your domain name (`idealbeautyofficial.com` or `www.idealbeautyofficial.com`).
4. Update your domain registrar's DNS records with the provided target records:
   - **A Records** / **AAAA Records** for root domain apex (`@`).
   - **CNAME Record** for subdomains (`www`).
5. Firebase automatically provisions managed SSL certificates via Let's Encrypt (certificate issuance takes between 15 minutes to 2 hours after DNS propagation).

---

## 8. Deployment Verification & Monitoring

1. **Trigger Deployment**: Push a commit to your linked GitHub `main` branch:
   ```bash
   git push origin main
   ```
2. **Monitor Build Logs**: Track build progress in Firebase Console under **App Hosting > Dashboard > Release History** or via Google Cloud Build logs.
3. **Inspect Runtime Logs**: Monitor container runtime logs in Google Cloud Logging:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=idealbeauty-storefront" --limit 50 --project YOUR_FIREBASE_PROJECT_ID
   ```
4. **Smoke Test Production URL**: Verify storefront navigation, user authentication, checkout workflows, and FCM notification triggers on the deployed URL.
