# LeadLocker — Phase 4: Automations Layer (Context)

## Objective
Use the events we built in Phase 3 to make the system run itself: auto-send daily summaries, auto-clean stale leads, surface event activity on the dashboard, and alert admin when something breaks.

## Structure
We execute one step at a time. Each step finishes with a verification before moving on.

---

## STEP 1 – Scheduler + Cron Setup
**Goal:** Daily summary SMS at 17:00 (local).

**Tasks**
1. Create `/src/app/api/cron/daily-summary/route.ts`
   - Require `CRON_SECRET` header. If missing/invalid → 401.
   - Query leads created "today".
   - Compose and send summary SMS via Twilio (reuse summary/send logic).
   - Log `summary.sent` + `sms.sent` events.
2. Add a Vercel cron job (in dashboard):
   - URL: `https://<vercel-domain>/api/cron/daily-summary`
   - Schedule: `0 17 * * *`
   - Header: `x-cron-secret: <CRON_SECRET>`

**Success:** SMS received at 17:00 and events logged.

---

## STEP 2 – Auto-Cleanup of Old Leads
**Goal:** Mark any "Needs Attention" leads older than 30 days → Reconciled.

**Tasks**
1. Create `/src/app/api/cron/cleanup/route.ts`
   - Require `CRON_SECRET`.
   - `SELECT` leads WHERE status = 'NEEDS_ATTENTION' (or internal NEW/APPROVED/COMPLETED mapping) AND `created_at < now() - interval '30 days'`.
   - `UPDATE` to Reconciled / Completed (consistent with current status model).
   - Log `lead.status_updated` with `updated_via: "auto_cleanup"`.

**Success:** Cleanup runs daily; events recorded.

---

## STEP 3 – Admin Error Alerts
**Goal:** Instant SMS to Admin if Twilio or DB write fails.

**Tasks**
1. Create `src/libs/logger.ts` (if missing):
   - `export async function logError(message: string, context?: any)`
   - In production: send Twilio SMS to `LL_DEFAULT_USER_PHONE`; in dev: `console.warn('[Admin Alert]', message, context)`.
2. Wrap critical `try/catch` blocks (Twilio send + DB inserts) with `logError()`.

**Success:** On failure in prod, Admin phone gets alert.

---

## STEP 4 – Dashboard Activity Feed
**Goal:** Show real-time "what just happened" feed using the `events` table.

**Tasks**
1. Create `src/components/EventFeed.tsx`
   - Fetch recent events (limit 20) ordered by `created_at desc`.
   - Render compact rows with icon + text:
     - `lead.created` → "🆕 Lead created: {name}"
     - `lead.status_updated` → "🔁 Status: {old} → {new}"
     - `sms.sent` → "📨 SMS sent to {phone}"
     - `summary.sent` → "🧾 Summary sent"
   - Auto-refresh every 10s.
2. Mount under `SummaryCard` on the dashboard.

**Success:** Feed shows live activity; no client-side RLS issues (use backend route if needed).

---

## Notes
- Keep usage simple; put intelligence in the backend.
- Respect RLS: client reads should go through backend routes using service role where required.
- Environment: ensure `CRON_SECRET` is set in Vercel before enabling scheduled hits.
- Verification after each step: demonstrate events logged + UI behavior (where applicable).






