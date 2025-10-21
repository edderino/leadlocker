# LeadLocker - Phase 1 MVP

A Next.js application for managing leads with real-time SMS alerts via Twilio and daily summaries.

## Features

- **Lead Management**: Store and track leads in Supabase (Postgres)
- **SMS Alerts**: Instant notifications via Twilio when new leads arrive
- **Status Updates**: Mark leads as done via SMS link clicks
- **Daily Summaries**: Automated daily SMS summaries via Vercel Cron
- **Auto-Cleanup**: Automatic removal of old completed leads and events
- **Error Monitoring**: SMS alerts to admin when cron jobs fail
- **Event Tracking**: Full audit trail of all system actions
- **Dashboard**: View all leads in a clean, modern interface
- **Client Portal**: Secure, invite-based client access with analytics
- **PWA Support**: Installable web app with offline capabilities
- **Push Notifications**: Real-time browser notifications for new leads (Phase 6)

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: TailwindCSS
- **Database**: Supabase (Postgres)
- **SMS Service**: Twilio
- **Push Notifications**: Web Push API with VAPID
- **Deployment**: Vercel
- **Validation**: Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
leadlocker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── leads/
│   │   │   │   ├── new/route.ts       # POST - Create new lead
│   │   │   │   └── status/route.ts    # GET - Update lead status
│   │   │   ├── summary/
│   │   │   │   └── send/route.ts      # GET/POST - Manual daily summary
│   │   │   └── cron/
│   │   │       ├── daily-summary/route.ts  # Automated daily summary
│   │   │       └── cleanup/route.ts        # Automated data cleanup
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── LeadList.tsx               # Lead display component
│   │   ├── LeadForm.tsx               # Lead creation form
│   │   ├── SummaryCard.tsx            # Dashboard summary stats
│   │   └── SendSummaryButton.tsx      # Manual summary trigger
│   └── libs/
│       ├── supabaseAdmin.ts           # Server-side Supabase client
│       ├── supabaseClient.ts          # Client-side Supabase client
│       ├── twilio.ts                  # Twilio SMS helper
│       ├── log.ts                     # Logging utility
│       └── time.ts                    # Time utilities
└── docs/
    ├── schema.sql                     # Database schema
    ├── phase4_step1_testing.md        # Daily summary cron tests
    └── phase4_step2_testing.md        # Cleanup cron tests
```

## Local Setup

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Twilio account with SMS capabilities
- Vercel account (for deployment)

### 2. Clone and Install

```bash
cd leadlocker
npm install
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `docs/schema.sql`
3. Get your project credentials from Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 4. Twilio Setup

1. Create account at [twilio.com](https://twilio.com)
2. Get a phone number with SMS capabilities
3. Find your credentials in Console:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` (your Twilio phone number)

### 5. Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# LeadLocker Config
LL_DEFAULT_USER_PHONE=+1234567890
LL_DAILY_SUMMARY_HOUR=18
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Security (Phase 4)
CRON_SECRET=your-secure-random-secret-here

# Auto-Cleanup (Phase 4)
CLEANUP_LEAD_RETENTION_DAYS=30
CLEANUP_EVENT_RETENTION_DAYS=60

# Client Portal (Phase 5)
REQUIRE_CLIENT_INVITE=true
CLIENT_PORTAL_SECRET=your-secure-portal-secret-here

# Push Notifications (Phase 6 Step 2)
WEB_PUSH_PUBLIC_KEY=your-vapid-public-key-here
WEB_PUSH_PRIVATE_KEY=your-vapid-private-key-here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key-here
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### 7. Generate VAPID Keys (Phase 6)

For push notifications to work, you need to generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Copy the output keys to your `.env.local` file.

### 8. Run Database Migrations

Run migrations for Phase 5 and Phase 6 features:

```sql
-- In Supabase SQL Editor:
-- Run: /docs/migrations/phase5_rls_policies.sql
-- Run: /docs/migrations/phase6_push_subscriptions.sql
```

### 9. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

**Note:** Push notifications require production mode:

```bash
npm run build
npm run start
```

## API Endpoints

### POST /api/leads/new

Create a new lead and send SMS alert.

**Request Body:**
```json
{
  "user_id": "uuid",
  "source": "Website",
  "name": "John Doe",
  "phone": "+1234567890",
  "description": "Interested in product X"
}
```

**Response:**
```json
{
  "success": true,
  "lead": { ... }
}
```

### GET /api/leads/status?id=UUID

Mark a lead as done (designed for SMS link clicks).

**Query Parameters:**
- `id`: Lead UUID

**Response:**
```json
{
  "success": true,
  "lead": { ... }
}
```

### GET/POST /api/summary/send

Send daily summary SMS (manual trigger).

**Response:**
```json
{
  "success": true,
  "total": 10,
  "byStatus": {
    "NEW": 5,
    "APPROVED": 3,
    "COMPLETED": 2
  }
}
```

### GET/POST /api/cron/daily-summary

Automated daily summary SMS (triggered by Vercel Cron).

**Headers Required:**
- `x-cron-secret`: Must match `CRON_SECRET` environment variable

**Response:**
```json
{
  "success": true,
  "total": 10,
  "byStatus": {
    "NEW": 5,
    "APPROVED": 3,
    "COMPLETED": 2
  },
  "timestamp": "2025-10-20T17:00:00.000Z"
}
```

### GET/POST /api/cron/cleanup

Automated cleanup of old leads and events (triggered by Vercel Cron).

**Headers Required:**
- `x-cron-secret`: Must match `CRON_SECRET` environment variable

**Response:**
```json
{
  "success": true,
  "leadsDeleted": 4,
  "eventsDeleted": 12,
  "timestamp": "2025-10-20T03:00:00.000Z",
  "retention": {
    "leadDays": 30,
    "eventDays": 60
  }
}
```

### POST /api/notifications/subscribe

Subscribe to push notifications for an organization (Phase 6).

**Headers Required:**
- Cookie: `ll_client_org` must match the orgId

**Request Body:**
```json
{
  "orgId": "demo-org",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "uuid",
  "message": "Successfully subscribed to push notifications"
}
```

### POST /api/notifications/trigger

Send push notifications to all subscribers of an organization (Phase 6).

**Headers Required:**
- `x-cron-secret`: Must match `CRON_SECRET` environment variable

**Request Body:**
```json
{
  "orgId": "demo-org",
  "eventType": "lead.created",
  "title": "New Lead Arrived!",
  "message": "John Doe is interested in your services",
  "url": "/client/demo-org"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "total": 2,
  "cleaned": 0,
  "message": "Sent 2 notification(s), 0 failed"
}
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - LeadLocker MVP"
git remote add origin https://github.com/yourusername/leadlocker.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add all environment variables from `.env.local`
3. Deploy!

### 3. Verify Cron Job

The `vercel.json` file configures a cron job to run `/api/summary/send` daily at 09:00 UTC (approximately 18:00 AEST).

Verify it's running in your Vercel dashboard → Project → Cron.

### 4. Update APP_URL

After deployment, update `NEXT_PUBLIC_APP_URL` in Vercel environment variables to your production URL:

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Testing the Flow

### 1. Create a Test User

Run in Supabase SQL Editor:

```sql
INSERT INTO users (name, phone, email) 
VALUES ('Test User', '+1234567890', 'test@example.com');
```

Note the returned `id`.

### 2. Create a Test Lead

```bash
curl -X POST http://localhost:3000/api/leads/new \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-uuid",
    "source": "Website",
    "name": "Jane Smith",
    "phone": "+1987654321",
    "description": "Test lead"
  }'
```

You should receive an SMS alert!

### 3. Mark Lead as Done

Click the link in the SMS or visit:

```
http://localhost:3000/api/leads/status?id=lead-uuid
```

### 4. Test Daily Summary

```bash
curl http://localhost:3000/api/summary/send
```

You should receive a summary SMS!

## Phase Implementation Status

- ✅ **Phase 1-2**: Core lead management + SMS alerts
- ✅ **Phase 3**: Event logging and audit trail
- ✅ **Phase 4**: Automation (daily summaries, cleanup, error alerts)
- ✅ **Phase 5**: Client portal with invite system and analytics
- ✅ **Phase 6 Step 1**: PWA foundation (manifest, service worker, offline)
- ✅ **Phase 6 Step 2**: Push notifications (Web Push API, subscriptions)
- 🚧 **Phase 6 Step 3**: AI suggestion engine (planned)
- 🚧 **Phase 6 Step 4**: Follow-up system (planned)

## Documentation

- **Phase 6 Step 1**: `/docs/phase6_step1_testing.md` - PWA testing guide
- **Phase 6 Step 2**: `/docs/phase6_step2_testing.md` - Push notifications testing
- **Phase 6 Context**: `/docs/phase6_context.md` - Architecture overview
- **Database Schema**: `/docs/schema.sql`
- **Migrations**: `/docs/migrations/`

## Next Steps

- [ ] AI suggestion engine for lead scoring
- [ ] Follow-up scheduling system
- [ ] Advanced analytics (conversion funnels, engagement)
- [ ] Client-side actions (approve/reject from portal)
- [ ] Multi-language support
- [ ] Email integration

## License

MIT

