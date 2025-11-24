import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CRON/Manual endpoint:
 * - Auth via Bearer CRON_SECRET
 * - Pull NEW inbound_emails
 * - Parse body (text/html), create a lead, send SMS
 * - Mark as DONE (or ERROR with last_error in payload)
 */

// ──────────────────────────────────────────────────────────────────────────────
// CONFIG – force numbers so Twilio never errors with 21612 (undefined From/To)
// ──────────────────────────────────────────────────────────────────────────────
const TWILIO_TO = "+61421114622";    // recipient (your mobile)
const TWILIO_FROM = "+15074787192";  // your Twilio purchased number

function authOk(req: NextRequest) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : "";
  return !!token && token === process.env.CRON_SECRET;
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1) Fetch a small batch of NEW items
    const { data: rows, error: selErr } = await supabase
      .from("inbound_emails")
      .select("id, external_id, status, payload, created_at")
      .eq("status", "new")
      .order("created_at", { ascending: true })
      .limit(10);

    if (selErr) {
      console.error("[PROCESS] select error:", selErr);
      return NextResponse.json({ ok: false, error: "select-failed" }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // 2) Mark them 'processing'
    const ids = rows.map((r: any) => r.id);
    const { error: markErr } = await supabase
      .from("inbound_emails")
      .update({ status: "processing" })
      .in("id", ids);

    if (markErr) {
      console.error("[PROCESS] mark processing error:", markErr);
      return NextResponse.json({ ok: false, error: "mark-processing-failed" }, { status: 500 });
    }

    const results: Array<{ id: string; status: "done" | "error"; err?: string }> = [];

    // 3) Process each
    for (const row of rows as any[]) {
      try {
        const payload = row?.payload ?? {};
        const subject: string = payload.subject || "(no subject)";
        const fromHdr: string | null = payload.from || null;
        const textPart: string = payload.text || "";
        const htmlPart: string = payload.html || "";

        // Prefer text, then strip html, else subject as last resort
        const candidateBody =
          textPart || (htmlPart ? stripHtml(htmlPart) : "") || subject;

        // Parse
        const { parseLeadFromEmail } = await import("@/libs/parseEmail");
        const parsed = parseLeadFromEmail(candidateBody);

        const fallbackName =
          (fromHdr?.split("<")[0]?.trim().replace(/["']/g, "") || "Unknown").toString();

        const lead = {
          name: parsed.name || fallbackName,
          email: parsed.email || fromHdr || null,
          phone: parsed.phone || null,
          description: (parsed.message || subject || "") as string,
        };

        // 3a) Insert Lead
        const orgId = "demo-org";
        const { error: insErr } = await supabase.from("leads").insert({
          org_id: orgId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          description: lead.description,
          status: "NEW",
          source: "email",
        });

        if (insErr) {
          throw new Error("lead-insert-failed: " + (insErr.message || JSON.stringify(insErr)));
        }

        // 3b) SMS alert (forced From/To)
        const snippet = candidateBody.slice(0, 120);
        const smsText =
          `New Lead from Email\n` +
          `Name: ${lead.email || lead.name}\n` +
          `Phone: ${lead.phone || "N/A"}\n` +
          `Subject: ${subject}\n` +
          `Snippet: ${snippet}`;

        try {
          const smsRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization:
                  "Basic " +
                  Buffer.from(
                    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                  ).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: TWILIO_TO,
                From: TWILIO_FROM, // FORCE explicit From so Twilio never sees "undefined"
                Body: smsText,
              }),
            }
          );
          const smsJson = await smsRes.json().catch(() => ({}));
          console.log("[Twilio] send result", {
            status: smsRes.status,
            ok: smsRes.ok,
            to: TWILIO_TO,
            fromUsed: TWILIO_FROM,
            sid: (smsJson as any)?.sid,
            twilioStatus: (smsJson as any)?.status,
            errorCode: (smsJson as any)?.error_code,
            errorMessage: (smsJson as any)?.message || (smsJson as any)?.error_message,
          });
        } catch (smsErr) {
          // don't fail the whole job on SMS; we still mark as done
          console.error("[PROCESS] SMS failed:", smsErr);
        }

        // 3c) Mark done
        await supabase.from("inbound_emails").update({ status: "done" }).eq("id", row.id);
        results.push({ id: row.id as string, status: "done" });
      } catch (e: any) {
        console.error("[PROCESS] item error:", e);

        // Park the error on the payload so we can see it later
        await supabase
          .from("inbound_emails")
          .update({
            status: "error",
            payload: {
              ...(row as any).payload,
              last_error: String(e?.message || e),
            },
          })
          .eq("id", row.id);

        results.push({ id: row.id as string, status: "error", err: String(e?.message || e) });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (err) {
    console.error("[PROCESS] fatal error:", err);
    return NextResponse.json({ ok: false, error: "server-error" }, { status: 500 });
  }
}