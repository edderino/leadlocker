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

✅ **Save this file and confirm it exists before doing anything further.**

