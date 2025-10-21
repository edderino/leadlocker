# 📘 LeadLocker Phase 5 – Context & Working Agreement

## 🎯 Phase Goal

Transform LeadLocker into a multi-client platform where tradies can securely access their own leads through a simple, read-only portal — without exposing admin features.

This phase introduces client-facing visibility while preserving backend control, laying the foundation for invoicing and analytics in later phases.

---

## 🧩 Core Objectives

- Create a `/client/[orgId]` portal for each organization.
- Restrict data access by `org_id` (no cross-org visibility).
- Enable lightweight authentication via signed or tokenized links.
- Provide clean UI: lead list + summary + activity snapshots.
- Keep backend structure identical — build on existing `leads`, `events`, and `users` tables.

---

## 🧱 Architecture Overview

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind + ShadCN.
- **Backend:** Supabase (Postgres + RLS).
- **Auth:** Token-based via `CLIENT_PORTAL_SECRET` (Step 1), then org-scoped invites (Step 3).
- **Data Source:** `leads` table filtered by `org_id`.
- **Security:** Server components only handle the secret; never exposed to browser.

---

## ⚙️ Phase 5 Steps

| Step | Feature | Description |
|------|---------|-------------|
| 1 | Client Portal Scaffold | Create `/client/[orgId]` route + API for read-only lead view |
| 2 | Client Dashboard UI | Summary + LeadList + Stats cards |
| 3 | Invite System | Generate tokenized SMS link for clients |
| 4 | Lead Sharing Policies | Apply RLS & org-member rules |
| 5 | Analytics Lite | Simple metrics per org (view + conversion) |

---

## 🧠 Design Principles

- **UX first** → simple and mobile-friendly.
- **Minimal moving parts** → extend existing components where possible.
- **Security first** → each client isolated by org scope.
- **Same logging standard** → all client activity creates events in `events` table.
- **Start with server-side fetches**; client hydration only for refresh or filters.

---

## 🧩 Output Expectations

- All new routes compile cleanly (`npm run build` = 0 errors).
- No breaking changes to admin flows.
- Each step produces a small increment documented in `/docs/phase5_stepX.md`.

---

## 🧾 References

- Previous Phase (4) added automation, alerts, and activity feed.
- Now we extend visibility to clients using that event data.

---

## 🧭 Cursor Instructions

- Treat this document as persistent context for all Phase 5 tasks.
- Confirm environment vars exist before coding; prefix all logs with `[ClientPortal]` or `[ClientAPI]`.
- After completion of each step, produce a summary and testing instructions in `/docs/phase5_stepX_testing.md`.

---

## ✅ Progress Summary

### Step 1: Client Portal Scaffold ✓ (Completed)
**Tag:** `v0.5.1-phase5-step1`

**What was built:**
- ✅ `/src/app/api/client/leads/route.ts` - Token-authenticated API endpoint
- ✅ `/src/app/client/[orgId]/page.tsx` - Server-rendered client portal page
- ✅ `/src/components/client/ClientSummary.tsx` - Summary stats component
- ✅ `/src/components/client/ClientLeadList.tsx` - Responsive lead list
- ✅ Database migration: Added `org_id` column to `leads` table

**Key features:**
- Secure token authentication via `x-client-token` header
- Organization-filtered lead queries using `org_id`
- Server-side rendering (no client-side secrets)
- Read-only database access with `supabaseAdmin`
- Responsive design (desktop table, mobile cards)

**Environment variables added:**
- `CLIENT_PORTAL_SECRET` - Token for API authentication

---

### Step 2: Client Dashboard UI ✓ (Completed)
**Tag:** `v0.5.2-phase5-step2`

**What was enhanced:**
- ✅ `/src/components/client/ClientDashboard.tsx` - NEW: Wrapper with refresh
- ✅ Enhanced `ClientSummary` with Lucide React icons
- ✅ Enhanced `ClientLeadList` with icons and better styling
- ✅ Updated portal page with new layout
- ✅ Added `lucide-react` dependency for icons

**UI improvements:**
- Icon-enhanced summary cards (AlertCircle, CheckCircle, ClipboardList)
- Color-coded themes (red, yellow, green)
- Responsive grid layout (1:2 ratio on desktop)
- Refresh button with spinning animation
- Alternating row backgrounds in lead list
- Enhanced empty state with SVG icon
- Phone and MapPin icons in contact/source columns
- Status badges with borders
- Hover effects and smooth transitions

**User experience:**
- Auto-refresh capability via button
- Click-to-expand metadata (inherited from ActivityFeed pattern)
- Touch-friendly mobile layout
- Clear visual hierarchy
- Professional polish matching admin dashboard

---

## 🔧 Key Dependencies

### Database Schema
- **`leads` table** - Must have `org_id TEXT` column (added in Step 1)
- **`events` table** - For future client activity logging (Step 4)
- **`users` table** - For org ownership/membership (Step 3+)

### Environment Variables
- `CLIENT_PORTAL_SECRET` - Shared token for API auth (Step 1-2)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side queries
- `TWILIO_*` - For SMS invites (Step 3)

### NPM Packages
- `date-fns` - Relative time formatting
- `lucide-react` - Icon library
- `@supabase/supabase-js` - Database client
- `twilio` - SMS for invite links (Step 3)

### Existing Infrastructure
- `/api/events/recent` - Event feed (from Phase 4 Step 4)
- `/libs/supabaseAdmin.ts` - Service role client
- `/libs/twilio.ts` - SMS helper
- `/libs/time.ts` - Time utilities

---

## 📋 Current State

**What's working:**
- ✅ Client portal accessible at `/client/[orgId]`
- ✅ Secure API endpoint with token auth
- ✅ Organization-filtered lead views
- ✅ Professional dashboard UI with icons
- ✅ Responsive design (mobile + desktop)
- ✅ Refresh functionality
- ✅ Empty and error states handled

**What's NOT yet implemented:**
- ❌ Per-organization tokens (using shared secret)
- ❌ SMS/email invite system
- ❌ Client activity logging to events table
- ❌ Supabase RLS for additional security
- ❌ Analytics/metrics

---

## 🎯 Next Step: Invite System (Step 3)

**Goal:** Generate and send secure, tokenized invite links to client organizations via SMS or email.

**Requirements:**
- Create per-organization access tokens
- Store tokens in database (new `org_tokens` table?)
- Generate invite links: `/client/[orgId]?token=XXX`
- Send via Twilio SMS to organization contact
- Validate tokens on portal access
- Log invite events to `events` table

**Key considerations:**
- Token expiration (optional: 30-day validity)
- Token regeneration capability
- Audit trail of who accessed when
- Graceful fallback if token invalid/expired
- Admin interface to generate/revoke tokens

**Dependencies:**
- Existing Twilio setup from Phase 1-4
- Database migration for token storage
- Server-side token validation
- Event logging for `invite.sent`, `portal.accessed`

---

**Ready to begin Phase 5 Step 3!** 🚀

