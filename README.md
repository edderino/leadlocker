# LeadLocker - Phase 1 MVP

A Next.js application for managing leads with real-time SMS alerts via Twilio and daily summaries.

## Features

- **Lead Management**: Store and track leads in Supabase (Postgres)
- **SMS Alerts**: Instant notifications via Twilio when new leads arrive
- **Status Updates**: Mark leads as done via SMS link clicks
- **Daily Summaries**: Automated daily SMS summaries via Vercel Cron
- **Dashboard**: View all leads in a clean, modern interface

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: TailwindCSS
- **Database**: Supabase (Postgres)
- **SMS Service**: Twilio
- **Deployment**: Vercel
- **Validation**: Zod

## Project Structure

```
leadlocker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── leads/
│   │   │   │   ├── new/route.ts       # POST - Create new lead
│   │   │   │   └── status/route.ts    # GET - Update lead status
│   │   │   └── summary/
│   │   │       └── send/route.ts      # GET/POST - Send daily summary
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── LeadList.tsx               # Lead display component
│   └── libs/
│       ├── supabaseAdmin.ts           # Server-side Supabase client
│       ├── supabaseClient.ts          # Client-side Supabase client
│       └── twilio.ts                  # Twilio SMS helper
└── docs/
    └── schema.sql                     # Database schema
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
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

LL_DEFAULT_USER_PHONE=+1234567890
LL_DAILY_SUMMARY_HOUR=18
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

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

Send daily summary SMS (triggered by Vercel Cron).

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 10,
    "new": 5,
    "done": 5
  }
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

## Next Steps for Production

- [ ] Add authentication (Supabase Auth)
- [ ] Implement proper RLS policies
- [ ] Add lead assignment to multiple users
- [ ] Create admin dashboard for user management
- [ ] Add lead tags and filtering
- [ ] Implement webhook support for integrations
- [ ] Add analytics and reporting

## License

MIT

