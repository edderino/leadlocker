# LeadLocker – Phase 1 Roadmap

## 🎯 Goal
A simple, reliable lead-capture and SMS-alert system for tradies.  
Focus on speed, simplicity, and zero-friction notifications.

## 🧱 Stack
- **Next.js 14 (App Router, TypeScript)**
- **Supabase (Postgres + RLS enabled)**  
- **TailwindCSS** for styling  
- **Twilio** for SMS  
- **Vercel** for hosting and cron jobs  
- **GitHub** for version control

## 🧩 Core Loop
1. POST /api/leads/new → Validate (Zod) → Insert into Supabase → Send SMS via Twilio  
2. GET /api/leads/status?id=UUID → Update lead status  
3. Cron /api/summary/send → Daily SMS summary  
4. Display leads in LeadList component on the dashboard

## ⚙️ Folder Structure
```
src/
 ├─ app/
 │   ├─ api/leads/new/route.ts
 │   ├─ api/leads/status/route.ts
 │   ├─ api/summary/send/route.ts
 │   ├─ layout.tsx
 │   └─ page.tsx
 ├─ components/LeadList.tsx
 ├─ libs/{supabaseClient.ts,supabaseAdmin.ts,twilio.ts}
docs/
 ├─ schema.sql
 └─ phase1_roadmap.md
```

## 🔐 Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
LL_DEFAULT_USER_PHONE
LL_DAILY_SUMMARY_HOUR
NEXT_PUBLIC_APP_URL
```

## ✅ Phase 1 Success Criteria
- Leads save to Supabase and display instantly.  
- SMS alert fires when a lead is created.  
- Daily summary SMS runs via Vercel cron.  
- App deploys and runs identically on Vercel.  

