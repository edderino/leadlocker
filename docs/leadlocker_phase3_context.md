# LeadLocker — Phase 3 Context (Event Layer)

## Working Agreement
- One step at a time. Wait for "done" before next step.
- Simplicity for users; intelligence under the hood.
- No scope creep; park out-of-scope items.
- Verify env, schema, and RLS before backend work.
- Paste-ready changes only. Don't rename files unless asked.

## Phase 3 Goal
Make LeadLocker hands-off: every significant action (lead created/updated, SMS sent, status changed) is logged centrally to enable automations and insights later.

## What Phase 3 Builds Now
**Event Layer foundation** — a single, extensible event log in Supabase.  
No automation logic yet.

## Event Principles
- Log all key actions.
- Include structured JSON `metadata` for context (actor, source, payload).
- Keep schema simple, predictable, and append-only.

## Example Event Types
- `lead.created` — source, actor, lead_id.
- `lead.status_updated` — old/new status, actor, lead_id.
- `sms.sent` — recipient, body hash/length, provider status, lead_id.
- `summary.sent` — period, recipient, counts.

## Important
This document is for **reference only**. Do **not** import or bundle it anywhere.
