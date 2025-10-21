# 📘 LeadLocker Phase 6 – Context & Architectural Overview

**Version:** Phase 6 Preparation  
**Date:** October 21, 2025  
**Status:** Context Document (No Implementation Yet)

---

## 📑 Table of Contents

1. [Overview](#1-overview)
2. [Objective of Phase 6](#2-objective-of-phase-6)
3. [Scope & Boundaries](#3-scope--boundaries)
4. [Core Goals of Phase 6](#4-core-goals-of-phase-6)
5. [Tech Stack Continuity](#5-tech-stack-continuity)
6. [Design & UX Vision](#6-design--ux-vision)
7. [Data Flow Diagram](#7-data-flow-diagram-textual)
8. [Security Continuity](#8-security-continuity)
9. [Testing & Deployment Guidelines](#9-testing--deployment-guidelines)
10. [Success Criteria](#10-success-criteria-for-phase-6-completion)

---

## 1️⃣ Overview

### What is LeadLocker (As of Phase 5)?

LeadLocker is a **fully automated, multi-client lead management platform** built for tradies and service businesses. It captures leads from multiple sources, sends instant SMS alerts, automates daily summaries, provides client-facing portals with analytics, and maintains a complete audit trail of all system activity.

### Complete System Flow

**Lead Capture → SMS Alert → Event Logging → Automation → Client Portal → Analytics**

1. **Lead arrives** (web form, API, integration)
2. **SMS sent** to admin instantly
3. **Event logged** (`lead.created`, `sms.sent`)
4. **Automation triggers** (daily summaries, cleanup, error alerts)
5. **Client accesses portal** (secure invite link)
6. **Analytics displayed** (trends, charts, metrics)

---

### Phase Recap

#### **Phase 1-2: Core Platform** ✅
- Next.js 14 app with Supabase (Postgres) backend
- Lead creation with Zod validation
- SMS alerts via Twilio
- Status tracking (NEW, APPROVED, COMPLETED)
- Admin dashboard with lead list
- Click-to-reconcile via SMS links

**Key achievement:** Working MVP with SMS notification system

---

#### **Phase 3: Event Logging Layer** ✅
- Created `events` table for full audit trail
- Event types: `lead.created`, `lead.status_updated`, `sms.sent`, `summary.sent`
- All user and system actions logged
- Foundation for analytics and activity tracking

**Key achievement:** Complete observability of system activity

---

#### **Phase 4: Automation Layer** ✅

**Step 1:** Daily Summary Cron
- Automated SMS summaries at 17:00 UTC
- `/api/cron/daily-summary` with CRON_SECRET auth
- Logs `summary.sent` events

**Step 2:** Auto-Cleanup Cron
- Removes COMPLETED leads older than 30 days
- Removes events older than 60 days
- `/api/cron/cleanup` with configurable retention
- Logs `cleanup.run` events

**Step 3:** Admin Error Alerts
- `notifyAdmin()` helper for error detection
- SMS alerts when cron jobs fail
- Logs `error.alert` events
- Silent failure prevention (no infinite loops)

**Step 4:** Activity Feed Dashboard
- Real-time event feed on admin dashboard
- Auto-refresh every 15 seconds
- Color-coded event types
- Expandable metadata view

**Key achievement:** Self-running system with monitoring and alerts

---

#### **Phase 5: Client Portal** ✅

**Step 1:** Client Portal Scaffold
- `/client/[orgId]` route structure
- `/api/client/leads` endpoint with token auth
- Organization-filtered queries using `org_id`
- Server-side rendering for security

**Step 2:** Client Dashboard UI
- Icon-enhanced summary cards (Lucide React)
- Responsive lead list (table + mobile cards)
- Refresh functionality
- Professional polish with Tailwind

**Step 3:** Invite System
- HMAC-signed, time-limited invite tokens
- `/api/client/invite` - generate and send via SMS
- `/client/access` - validate token, set cookie, redirect
- Cookie-based sessions (7-day duration)
- Event logging (`invite.sent`, `invite.accepted`)

**Step 4:** Lead Sharing Policies (RLS)
- Row-Level Security migration scripts
- Database policies for org isolation
- Service role bypass for admin
- Application-level filtering

**Step 5:** Analytics Lite
- `/api/analytics/summary` endpoint
- Analytics widget with Recharts
- 7-day trend line chart
- "New this week" metrics
- Auto-refresh every 30 seconds

**Key achievement:** Complete, secure client-facing experience with analytics

---

## 2️⃣ Objective of Phase 6

### Primary Goal

**Transform LeadLocker into an intelligent, client-centric platform** where clients can self-serve, receive automated guidance, and interact with their leads through a mobile-first Progressive Web App (PWA) — with minimal human administration required.

### What Phase 6 Adds

Phase 6 introduces the **Intelligence & Engagement Layer** — moving beyond passive data display to active, adaptive automation:

1. **📱 Mobile-First Client Experience**
   - PWA capabilities (offline access, install to home screen)
   - Touch-optimized interactions
   - Push notifications for new leads
   - Mobile-native feel

2. **🧠 Adaptive Automation (LeadLocker AI Assist)**
   - Smart follow-up suggestions
   - Lead scoring and prioritization
   - Automated status transitions based on rules
   - Intelligent reminders

3. **⚙️ Scheduling & Follow-Up Logic**
   - Automated follow-up reminders
   - Scheduled actions (call-backs, emails)
   - Snooze and reschedule capabilities
   - Integration with existing cron system

4. **💬 Enhanced Analytics & Engagement Tracking**
   - Conversion funnel metrics
   - Response time tracking
   - Client portal usage analytics
   - Engagement scoring

5. **🌐 Progressive Web App (PWA) Deployment**
   - Service worker for offline functionality
   - App manifest for installability
   - Push notifications
   - Native app-like experience

### What Phase 6 Is NOT

- ❌ **Not a full CRM** - Remains focused on lead handoff automation
- ❌ **Not replacing human judgment** - Augments, doesn't replace decision-making
- ❌ **Not adding complex billing** - Keep financial logic minimal
- ❌ **Not multi-language** - English-only for now
- ❌ **Not breaking existing features** - All Phases 1-5 must continue working

### The "Hand-Off" Model

LeadLocker automates the **lead capture → qualification → client access → follow-up** cycle:

```
New Lead Arrives
     ↓
SMS Alert to Admin (immediate)
     ↓
AI suggests: "Follow up in 2h" or "Auto-approve low-risk"
     ↓
Client gets portal access (secure invite)
     ↓
Client views analytics, takes action
     ↓
System auto-updates status, schedules next step
     ↓
Admin receives summary, not flooded with noise
```

**Result:** Clients feel engaged, admins save time, nothing falls through cracks.

---

## 3️⃣ Scope & Boundaries

### ✅ What CAN Be Changed in Phase 6

**Frontend Enhancements:**
- Add new client-facing components
- Create mobile-optimized layouts
- Implement PWA features (manifest, service worker)
- Add push notification support
- Expand analytics visualizations

**API Layer Additions:**
- New analytics endpoints
- Automation trigger endpoints
- Follow-up scheduling APIs
- Engagement tracking endpoints

**Intelligence Layer:**
- Add AI suggestion logic (simple rules-based for now)
- Create follow-up reminder system
- Implement lead scoring algorithms
- Add automated status transitions

**Client Experience:**
- Enhance existing `/client/[orgId]` pages
- Add new client-side interactions
- Implement offline capabilities
- Add real-time updates (Supabase Realtime)

**Database Extensions:**
- Add new tables if needed (e.g., `follow_ups`, `suggestions`)
- Extend `events` table with new event types
- Add metadata fields to existing tables
- Create new indexes for performance

---

### ❌ What MUST NOT Be Touched

**Core Infrastructure (Phases 1-5):**
- ❌ Don't break existing `/api/leads/*` routes
- ❌ Don't modify Twilio SMS core functionality
- ❌ Don't change Supabase auth model
- ❌ Don't alter existing cron job logic (summaries, cleanup)
- ❌ Don't break admin dashboard features

**Security Model:**
- ❌ Don't expose `CLIENT_PORTAL_SECRET` to client
- ❌ Don't bypass cookie validation
- ❌ Don't weaken HMAC token signing
- ❌ Don't disable RLS policies
- ❌ Don't allow cross-org data access

**Event Logging:**
- ❌ Don't remove existing event types
- ❌ Don't change event table schema (only add columns)
- ❌ Don't break event feed functionality

**Admin Features:**
- ❌ Don't remove admin dashboard pages
- ❌ Don't restrict admin access
- ❌ Don't break notifyAdmin error system
- ❌ Don't modify existing lead form

---

### 🔒 Architectural Expectations

**Maintain Org Isolation:**
- Every new feature MUST respect `org_id` filtering
- All queries MUST filter by organization
- No cross-org data leakage allowed
- RLS policies apply to new tables

**Server-Side Security:**
- Continue using Server Components for sensitive operations
- API routes must validate authentication
- Never expose secrets to client-side
- Maintain service_role vs anon_key separation

**Event Logging Standard:**
- All new actions MUST log events
- Event types follow naming: `category.action` (e.g., `followup.scheduled`)
- Include metadata for audit trail
- Silent failure on event logging (don't break main flow)

**Backward Compatibility:**
- All existing APIs continue working
- Existing clients not impacted
- Database migrations additive only
- No breaking changes to environment variables

---

## 4️⃣ Core Goals of Phase 6

### Goal 1: 📱 Mobile-Friendly Client Layer

**Why:** Most clients access on mobile. Current design works, but lacks native app features.

**What:** Transform `/client/[orgId]` into a Progressive Web App (PWA).

**How:**
- Add app manifest (`manifest.json`)
- Implement service worker for offline support
- Enable "Add to Home Screen" functionality
- Optimize touch targets and gestures
- Add pull-to-refresh
- Implement push notifications for new leads

**Connects to existing:**
- Uses same `/client/[orgId]` routes
- Extends `ClientDashboard` component
- Leverages existing analytics API
- Works with invite/cookie system

**Expected output:**
- Installable web app
- Offline view of cached data
- Push notifications on new leads
- Native app feel

---

### Goal 2: 🧠 Adaptive Automation Layer (LeadLocker AI Assist)

**Why:** Admins shouldn't manually triage every lead. System should suggest next actions.

**What:** Add intelligent suggestion engine that recommends:
- When to follow up
- Which leads to prioritize
- Auto-approval for low-risk leads
- Escalation triggers

**How:**
- Create `/api/ai/suggestions` endpoint
- Implement simple rule-based logic (not ML initially):
  - New lead from repeat source → auto-approve
  - Lead >24h old with no action → suggest follow-up
  - High-value lead (based on metadata) → priority flag
- Display suggestions in admin dashboard
- Allow one-click action on suggestions

**Connects to existing:**
- Reads from `leads` table
- Logs new event types (`suggestion.created`, `suggestion.acted`)
- Uses existing `notifyAdmin` for escalations
- Integrates with admin dashboard

**Expected output:**
- Suggestion cards on dashboard
- Auto-actions configurable via env vars
- Reduce admin workload by 50%

---

### Goal 3: ⚙️ Scheduling & Follow-Up Logic

**Why:** Leads need timely follow-up. Manual tracking is error-prone.

**What:** Automated follow-up reminder system.

**How:**
- Create `follow_ups` table:
  - `id`, `lead_id`, `scheduled_for`, `status`, `type`, `metadata`
- New API: `/api/followups` (CRUD for follow-ups)
- Cron job: `/api/cron/followups` (checks every hour)
- When scheduled time reached → send SMS reminder
- Client can snooze or mark complete via portal

**Connects to existing:**
- Links to `leads` table
- Uses existing Twilio SMS
- Logs `followup.scheduled`, `followup.completed` events
- Integrates with cron system (similar to daily-summary)

**Expected output:**
- No missed follow-ups
- Automated reminders
- Client self-scheduling

---

### Goal 4: 💬 Expanded Analytics for Engagement Tracking

**Why:** Current analytics show volume. Phase 6 needs engagement metrics.

**What:** Track and display:
- Client portal views (how often they check)
- Lead response times (time to first action)
- Conversion rates (NEW → APPROVED → COMPLETED)
- Engagement scores per organization

**How:**
- Extend `events` table with `portal.viewed`, `lead.viewed` events
- Create `/api/analytics/engagement` endpoint
- Add engagement charts to analytics widget
- Show funnel visualization (Recharts)

**Connects to existing:**
- Uses existing `events` table
- Extends `AnalyticsWidget` component
- Leverages Recharts library
- Works with org_id filtering

**Expected output:**
- Conversion funnel chart
- Response time metrics
- Engagement scores
- Portal usage trends

---

### Goal 5: 🌐 Progressive Web App (PWA) Deployment

**Why:** Enable offline access, installability, push notifications.

**What:** Full PWA implementation with:
- Service worker for caching
- App manifest for installation
- Offline-first architecture
- Background sync
- Push notification support

**How:**
- Create `public/manifest.json`
- Implement `public/sw.js` (service worker)
- Add PWA meta tags to layout
- Configure Next.js for PWA
- Use `next-pwa` or custom implementation
- Register push notification service

**Connects to existing:**
- Wraps existing client portal
- Caches analytics data
- Syncs when online
- Uses same authentication

**Expected output:**
- Installable on iOS/Android
- Works offline (cached data)
- Push notifications for new leads
- App icon on home screen

---

## 5️⃣ Tech Stack Continuity

### Current Stack (Phases 1-5)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- Lucide React (icons)
- Recharts (data visualization)
- date-fns (time formatting)

**Backend:**
- Next.js API Routes (serverless)
- Supabase (Postgres + RLS)
- Twilio (SMS)
- Node.js crypto (HMAC signing)

**Infrastructure:**
- Vercel (hosting + cron)
- GitHub (version control)
- Environment variables (.env.local)

**Security:**
- HMAC-SHA256 token signing
- HTTP-only cookies
- Row-Level Security (RLS)
- Service role separation

---

### Phase 6 Additions (Minimal Dependencies)

**New packages (as needed):**
- `next-pwa` (PWA support) - OR custom service worker
- `workbox` (service worker utilities) - OPTIONAL
- No AI/ML libraries initially (use rule-based logic)
- No additional UI frameworks (keep Tailwind)

**Rules for new dependencies:**
- Must be production-tested
- Must have <100KB bundle impact
- Must have TypeScript support
- Must align with Next.js 14+ best practices
- Prefer native APIs over libraries when possible

**External API integrations:**
- Follow existing pattern (serverless routes)
- Use environment variables for keys
- Respect Supabase RLS
- Log to `events` table
- Handle failures gracefully

---

## 6️⃣ Design & UX Vision

### Visual Tone

**Continue existing aesthetic:**
- Clean, modern SaaS interface
- Tailwind utility classes
- Card-based layouts
- Subtle shadows and borders
- Consistent color palette:
  - Red: Needs attention / errors
  - Yellow: Approved / warnings
  - Green: Completed / success
  - Blue: Info / analytics
  - Gray: Neutral / system

**Typography:**
- System font stack (system-ui, -apple-system, etc.)
- Clear hierarchy (h1-h6)
- Readable body text (14-16px)
- Monospace for codes/IDs

**Spacing & Layout:**
- Consistent padding (p-4, p-6)
- Gap between sections (gap-6)
- Max-width containers (max-w-7xl)
- Mobile-first responsive

---

### PWA Behavior

**Installability:**
- App manifest with name, icons, colors
- Install prompts on mobile (iOS/Android)
- Standalone display mode
- Custom splash screen

**Offline Capability:**
- Cache critical assets (HTML, CSS, JS)
- Cache recent data (leads, analytics)
- Show offline indicator
- Queue actions for background sync
- Display last updated timestamp

**Performance:**
- <3s initial load
- <1s navigation between cached pages
- Lazy load images and charts
- Code splitting for unused routes

---

### Mobile Optimizations

**Touch Targets:**
- Minimum 44x44px tap areas
- Adequate spacing between interactive elements
- Swipe gestures for actions (delete, archive)

**Viewport:**
- Responsive breakpoints (sm, md, lg, xl)
- Stack layouts on mobile (<768px)
- Hide/collapse secondary info on small screens

**Interactions:**
- Pull-to-refresh for data updates
- Swipe navigation between sections
- Bottom navigation for key actions
- Floating action button (FAB) for primary action

---

## 7️⃣ Data Flow Diagram (Textual)

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LEAD SOURCES                            │
│  (Web Forms, API Calls, Integrations, Manual Entry)         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (Postgres + RLS)                       │
│  Tables: users, leads, events, follow_ups (Phase 6)         │
│  RLS: Org isolation via org_id                              │
└─────────────┬────────────────┬──────────────────────────────┘
              │                │
              │                │
    ┌─────────▼─────┐    ┌────▼─────────┐
    │  EVENTS TABLE │    │  LEADS TABLE │
    │  (Audit Trail)│    │  (Core Data) │
    └────────┬──────┘    └──────┬───────┘
             │                  │
             │                  │
    ┌────────▼──────────────────▼────────┐
    │      AUTOMATION LAYER               │
    │  - Daily summaries (cron)           │
    │  - Auto-cleanup (cron)              │
    │  - Error alerts (notifyAdmin)       │
    │  - Follow-up reminders (Phase 6)    │
    │  - AI suggestions (Phase 6)         │
    └────────┬─────────────────┬──────────┘
             │                 │
             │                 │
    ┌────────▼─────┐    ┌──────▼───────────┐
    │  ADMIN       │    │  CLIENT PORTAL   │
    │  DASHBOARD   │    │  /client/[orgId] │
    │  (Internal)  │    │  (External)      │
    └──────────────┘    └──────┬───────────┘
                               │
                        ┌──────▼───────┐
                        │  ANALYTICS   │
                        │  (Charts)    │
                        └──────────────┘
```

### Node Descriptions

**1. Lead Sources:**
- Entry points for data
- Web forms, API POST, integrations
- Validates via Zod schemas
- Inserts into `leads` table

**2. Supabase Database:**
- Central data store (Postgres)
- RLS enforces org_id isolation
- Service role for backend, anon key for future client-side
- Tables: `users`, `leads`, `events`, `follow_ups` (Phase 6)

**3. Events Table:**
- Immutable audit log
- Every action logged (lead.created, sms.sent, etc.)
- Used by activity feed
- Analytics source

**4. Leads Table:**
- Core business data
- Columns: id, user_id, org_id, name, phone, source, description, status, created_at
- Indexed on: org_id, status, created_at
- RLS policies active

**5. Automation Layer:**
- Cron jobs (Vercel scheduled functions)
- Event-driven actions
- SMS sending (Twilio)
- Error monitoring (notifyAdmin)
- **Phase 6 adds:** AI suggestions, follow-up scheduling

**6. Admin Dashboard:**
- Internal view (`/` and `/api/leads`)
- Full access to all orgs
- Activity feed (all events)
- Lead management
- Uses service_role key

**7. Client Portal:**
- External view (`/client/[orgId]`)
- Org-filtered access
- Invite-gated (cookie auth)
- Read-only (for now)
- **Phase 6 adds:** PWA, offline, push

**8. Analytics:**
- Current: 7-day trends, status counts
- **Phase 6 adds:** Conversion funnel, engagement, response times

---

## 8️⃣ Security Continuity

### Authentication Model (UNCHANGED)

**Admin/Backend:**
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`)
- Bypasses RLS
- Full database access
- Used in all `/api/*` routes

**Client Portal:**
- HMAC-signed invite tokens
- HTTP-only cookies (`ll_client_org`)
- 7-day session duration
- Org-specific access

**Cron Jobs:**
- `CRON_SECRET` header validation
- Vercel-scheduled execution
- Server-side only

---

### Phase 6 Security Requirements

**All new features MUST:**
1. ✅ Respect org_id isolation
2. ✅ Validate authentication (cookie or token)
3. ✅ Use server components for secrets
4. ✅ Log actions to events table
5. ✅ Handle errors gracefully (no secret exposure)

**PWA-Specific Security:**
- Service worker must not cache secrets
- Offline data must be org-specific
- Push notifications must validate org before sending
- Background sync must respect auth state

**AI/Automation Security:**
- Suggestions never expose other orgs' data
- Auto-actions require admin approval (configurable)
- Rate limiting on automated SMS
- Audit trail for all AI-triggered actions

---

### HMAC Token Model (CONTINUE USING)

**Current implementation (Phase 5 Step 3):**
```typescript
// Generate token
createInviteToken(orgId, ttlHours) → HMAC-signed token

// Verify token
verifyInviteToken(token) → { orgId } or null
```

**Phase 6 extensions:**
- Same signing for follow-up links
- Same model for client-initiated actions
- Keep tokens time-limited
- Continue using `CLIENT_PORTAL_SECRET`

---

## 9️⃣ Testing & Deployment Guidelines

### Testing Requirements for Every Phase 6 Step

**1. Create Testing Document:**
- File: `/docs/phase6_stepX_testing.md`
- Minimum 300 lines
- Include: setup, test scenarios, SQL queries, troubleshooting

**2. Test Categories:**
- ✅ API endpoint tests (curl commands)
- ✅ UI visual tests (screenshots)
- ✅ Security tests (auth, isolation)
- ✅ Integration tests (E2E flow)
- ✅ Performance tests (load times)
- ✅ Mobile tests (responsive, touch)

**3. Verification Queries:**
- Database state before/after
- Event counts
- Performance metrics
- Error logs

**4. Edge Cases:**
- Empty states
- Error states
- Missing data
- Slow connections
- Offline mode (Phase 6)

---

### Deployment Standards

**Local Development:**
- Must work with `npm run dev`
- All environment variables in `.env.local`
- No external dependencies beyond npm
- Port 3000 (standard)

**Vercel Production:**
- Zero config changes to `vercel.json` (except cron if needed)
- All features work on Vercel Free tier
- Environment variables only (no build-time configuration)
- Serverless function limits respected (<10s execution)

**Database Migrations:**
- All migrations in `/docs/migrations/phaseX_*.sql`
- Idempotent (can run multiple times safely)
- Include rollback instructions
- Test on staging before production

**Environment Variables:**
- Document all new variables
- Provide example values
- Note which are required vs optional
- Use `.env.example` format (blocked file, so document in README)

---

### Git Workflow

**Every step:**
1. Implement features
2. Test thoroughly
3. Fix linter errors
4. Commit: `feat: Phase 6 Step X — Feature Name`
5. Tag: `v0.6.X-phase6-stepX`
6. Push: `git push && git push origin <tag>`

**Branch strategy:**
- Main branch for all development (current practice)
- Tags for milestones
- Can create feature branches for experimental work

---

## 🔟 Success Criteria for Phase 6 Completion

### When Phase 6 is complete, the system will have:

**1. ✅ Mobile-First Client Experience**
- PWA installable on iOS and Android
- Offline access to cached data
- Push notifications for new leads
- Touch-optimized interactions
- Pull-to-refresh functionality

**2. ✅ Intelligent Automation**
- AI suggestion engine operational
- Auto-approval rules configurable
- Follow-up reminders scheduled automatically
- Lead scoring and prioritization working
- Escalation triggers active

**3. ✅ Advanced Analytics**
- Conversion funnel visualization
- Response time tracking
- Engagement scoring per org
- Portal usage metrics
- Time-series trends beyond 7 days

**4. ✅ Follow-Up System**
- Scheduled follow-ups logged in database
- Automated SMS reminders sent
- Snooze/reschedule capability
- Client self-service for follow-ups
- Integration with existing cron system

**5. ✅ Enhanced Client Portal**
- Richer interactions (not just read-only)
- Action buttons for clients
- Feedback mechanisms
- Export capabilities (PDF/CSV)
- Customizable views per org

**6. ✅ Backward Compatibility**
- All Phase 1-5 features still working
- No breaking changes
- Existing invites continue working
- Cron jobs unaffected
- Admin dashboard unchanged (only enhanced)

**7. ✅ Performance**
- Page load <3s on 3G
- Time to interactive <5s
- Analytics queries <500ms
- No memory leaks
- Smooth animations (60fps)

**8. ✅ Security**
- Org isolation maintained
- No cross-org data access
- HMAC tokens still secure
- RLS policies enforced
- Audit trail complete

**9. ✅ Documentation**
- All Phase 6 steps documented
- Testing guides comprehensive
- Migration scripts provided
- Troubleshooting complete
- README updated

**10. ✅ Production Deployment**
- Deployed to Vercel
- All environment variables set
- Database migrations run
- SMS delivery verified
- Client portals tested with real users
- Analytics populated with real data
- Push notifications working
- Offline mode functional

---

## 📊 Current System State (End of Phase 5)

### What Works Today:

**Admin Side:**
- Lead capture and management
- SMS alerts on new leads
- Daily automated summaries (cron)
- Auto-cleanup of old data (cron)
- Error monitoring with SMS alerts
- Activity feed with all events
- Full lead list with filtering

**Client Side:**
- Secure invite system (HMAC + SMS)
- Cookie-based authentication
- Organization-specific dashboard
- Summary statistics (Needs Attention, Approved, Completed)
- Responsive lead list (table + mobile cards)
- Analytics widget with 7-day trends
- Real-time data (auto-refresh)

**Infrastructure:**
- 16 environment variables configured
- 10+ API endpoints operational
- 20+ React components
- Full event logging (10+ event types)
- Database with RLS policies
- SMS integration via Twilio
- Vercel cron jobs ready

### What's Missing (Phase 6 Will Add):

**Client Interactions:**
- Push notifications
- Offline access
- PWA installation
- Client-initiated actions
- Feedback mechanisms

**Intelligence:**
- AI suggestions
- Lead scoring
- Auto-approvals
- Smart prioritization

**Scheduling:**
- Follow-up reminders
- Scheduled actions
- Snooze/reschedule
- Automated callbacks

**Analytics:**
- Conversion funnels
- Response times
- Engagement scores
- Portal usage tracking

---

## 🔧 Phase 6 Environment Variables (Planned)

### New Variables to Add:

```bash
# Phase 6: PWA & Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<push-notification-key>
VAPID_PRIVATE_KEY=<server-push-key>
VAPID_SUBJECT=mailto:admin@leadlocker.app

# Phase 6: AI Suggestions (Optional)
ENABLE_AI_SUGGESTIONS=true
AI_AUTO_APPROVE_THRESHOLD=0.8

# Phase 6: Follow-Up Automation
FOLLOWUP_CHECK_INTERVAL_HOURS=1
DEFAULT_FOLLOWUP_DELAY_HOURS=24

# Phase 6: Analytics
ANALYTICS_RETENTION_DAYS=90
ENABLE_ENGAGEMENT_TRACKING=true
```

**All existing Phase 1-5 variables remain unchanged.**

---

## 🎯 Phase 6 Roadmap (Preliminary)

### Proposed Steps:

**Step 1:** PWA Foundation
- Add manifest.json
- Implement service worker
- Enable offline mode
- Test installability

**Step 2:** Push Notifications
- Set up VAPID keys
- Implement push subscription
- Send notifications on new leads
- Client notification preferences

**Step 3:** AI Suggestion Engine
- Create suggestion logic
- Display in admin dashboard
- One-click actions
- Log suggestion events

**Step 4:** Follow-Up System
- Create follow_ups table
- Build scheduling API
- Implement reminder cron
- Add to client portal

**Step 5:** Advanced Analytics
- Conversion funnel chart
- Response time metrics
- Engagement scoring
- Portal usage tracking

**Step 6:** Client Interactions
- Action buttons in portal
- Feedback forms
- Export capabilities
- Customizable views

*Note: Actual steps may differ based on priorities and discoveries during implementation.*

---

## 📚 Reference Documentation

### Key Files to Review Before Phase 6:

**Architecture:**
- `/docs/phase5_context.md` - Client portal foundation
- `/docs/PHASE5_VERIFICATION.md` - Current system state
- `/docs/schema.sql` - Database structure

**Security:**
- `/src/libs/signing.ts` - Token implementation
- `/src/app/client/access/route.ts` - Cookie setting
- `/docs/migrations/phase5_rls_policies.sql` - RLS setup

**Components:**
- `/src/components/client/*` - All client components
- `/src/components/ActivityFeed.tsx` - Real-time feed pattern
- `/src/components/client/AnalyticsWidget.tsx` - Chart implementation

**APIs:**
- `/src/app/api/client/*` - Client endpoints
- `/src/app/api/analytics/*` - Analytics endpoints
- `/src/app/api/cron/*` - Automation endpoints

---

## 🛠️ Development Conventions

### Code Standards:

**Logging:**
- Prefix: `[PWA]`, `[AIAssist]`, `[FollowUp]`, etc.
- Include context (orgId, leadId when relevant)
- Error logs: `console.error`
- Info logs: `console.log`
- No sensitive data in logs

**Error Handling:**
- Always try/catch async operations
- Return JSON errors, never throw to client
- Log errors before returning
- Use notifyAdmin for critical failures

**TypeScript:**
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Proper interface definitions
- Export types for reusability

**React:**
- Prefer Server Components (default)
- Use 'use client' only when necessary
- Async server components for data fetching
- Client components for interactivity

**API Routes:**
- Validate all inputs (Zod)
- Check authentication
- Filter by org_id
- Log events
- Return consistent JSON format

---

## 🎨 UI Component Patterns

### Existing Patterns to Follow:

**Card Pattern:**
```typescript
<div className="bg-white shadow-md rounded-lg border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">Title</h3>
  {/* Content */}
</div>
```

**Stat Card Pattern:**
```typescript
<div className="bg-blue-50 border-blue-200 rounded-lg border p-6">
  <Icon className="h-8 w-8 text-blue-500" />
  <div className="text-4xl font-bold text-blue-600">{value}</div>
  <div className="text-sm font-medium text-gray-600">{label}</div>
</div>
```

**Button Pattern:**
```typescript
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
  Action
</button>
```

**Table Pattern:**
```typescript
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    {/* Headers */}
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {/* Alternating rows with hover */}
  </tbody>
</table>
```

---

## 🚀 Migration Path

### From Phase 5 to Phase 6:

**No Breaking Changes:**
- All existing routes continue working
- Database schema only extended (never modified)
- Environment variables only added (never removed)
- UI components enhanced (never replaced)

**Additive Development:**
- New tables alongside existing ones
- New API routes in parallel
- New components in `/components/phase6/` (optional organization)
- New event types added to existing `events` table

**Testing Strategy:**
- Test new features in isolation
- Integration test with existing features
- Regression test Phases 1-5
- Load test with production-like data

---

## 📝 Documentation Standards

### Every Phase 6 Step Must Include:

**Testing Document:**
- Minimum 300 lines
- 10+ test scenarios
- SQL verification queries
- Visual checklists
- Troubleshooting section
- Production deployment guide

**Code Comments:**
- JSDoc for all exported functions
- Inline comments for complex logic
- TODOs for future enhancements
- Links to related files/docs

**README Updates:**
- Add new features to feature list
- Update API endpoint documentation
- Add new environment variables
- Update tech stack if new dependencies

---

## 🎯 Phase 6 Success Metrics

### Quantifiable Targets:

**Performance:**
- Lighthouse PWA score: >90
- Offline functionality: 100% of read operations
- Push notification delivery: >95%
- Analytics load time: <500ms
- Service worker cache hit rate: >80%

**User Experience:**
- Mobile usability score: >90
- Client portal usage: >70% of invited orgs
- Follow-up completion rate: >60%
- Zero critical errors in production

**Automation:**
- AI suggestions accuracy: >75%
- Auto-approval false positive rate: <5%
- Follow-up reminder delivery: >98%
- Admin workload reduction: >40%

**Technical:**
- Zero TypeScript errors
- Zero linter warnings
- Test coverage: >70% (if we add tests)
- Bundle size increase: <200KB
- No breaking changes to Phases 1-5

---

## 🔮 Future Vision (Beyond Phase 6)

### Potential Phase 7+ Features:

- Multi-language support (i18n)
- Email integration (in addition to SMS)
- Voice calls via Twilio
- Calendar integrations (Google, Outlook)
- Payment processing (Stripe)
- Invoice generation
- Team collaboration features
- White-labeling for partners
- API webhooks for integrations
- Mobile native apps (React Native)

**Phase 6 should prepare for these but not implement them.**

---

## ✅ Ready for Phase 6 Step 1

This context document provides:
- ✅ Complete system understanding
- ✅ Clear objectives for Phase 6
- ✅ Boundaries and constraints
- ✅ Security requirements
- ✅ Development standards
- ✅ Success criteria

**All Phase 6 implementation steps will reference this document for consistency and alignment.**

---

**Next:** Await Phase 6 Step 6 instructions from the user.

**Current State:** Phase 6 in progress - Steps 1-5 complete:
- ✅ Step 1: PWA Manifest & Service Worker
- ✅ Step 2: Push Notifications
- ✅ Step 3: AI Suggestion Engine
- ✅ Step 4: Follow-Up Automation
- ✅ Step 5: Advanced Analytics Dashboard

**Document Status:** ✅ COMPLETE

---

## Phase 6 Implementation References

### Step 5: Advanced Analytics Dashboard
**Tag:** v0.6.5-phase6-step5  
**Files:**
- `/src/app/api/analytics/advanced/route.ts` - Analytics API endpoint
- `/src/components/client/AdvancedAnalytics.tsx` - Interactive dashboard component
- `/docs/phase6_step5_testing.md` - Comprehensive testing guide

**Features:**
- Interactive charts (Line, Bar, Pie) using Recharts
- Lead trends, approval metrics, source distribution
- Time range filtering (7, 14, 30 days)
- Auto-refresh every 60 seconds
- In-memory caching (1 minute TTL)
- Organization isolation via RLS

---

Generated: October 21, 2025  
Document Type: Architectural Context (No Implementation)  
Purpose: Guide for Phase 6 Development  
Audience: AI Assistant & Development Team

