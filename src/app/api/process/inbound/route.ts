import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

// Safety: only allow cron/you to hit this endpoint

function assertAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== process.env.CRON_SECRET) {
    throw new Error("unauthorized");
  }
}

type QueueRow = {
  id: string;
  provider: "resend" | string;
  external_id: string | null;
  from_addr: string | null;
  to_addr: string | null;
  subject: string | null;
  payload: any;          // raw jsonb
  status: "PENDING" | "PROCESSING" | "DONE" | "ERROR";
  error_message?: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    assertAuth(req);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Lock a small batch of PENDING rows
    const BATCH = 5;

    const { data: todo, error: selErr } = await supabase
      .from("inbound_queue")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(BATCH);

    if (selErr) {
      console.error("[PROCESS] select PENDING failed:", selErr);
      return NextResponse.json({ ok: false, error: "select_failed" }, { status: 500 });
    }

    if (!todo || todo.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // mark PROCESSING
    const ids = todo.map((r) => r.id);
    const { error: markErr } = await supabase
      .from("inbound_queue")
      .update({ status: "PROCESSING" })
      .in("id", ids);

    if (markErr) {
      console.error("[PROCESS] mark PROCESSING failed:", markErr);
      return NextResponse.json({ ok: false, error: "mark_processing_failed" }, { status: 500 });
    }

    // util: very forgiving phone/email extraction
    const extractText = (row: QueueRow) => {
      const p = row.payload || {};
      const data = p.data || {};
      const textPieces: string[] = [];
      if (row.subject) textPieces.push(row.subject);
      if (typeof data.text === "string") textPieces.push(data.text);
      if (typeof data.html === "string") {
        const html = data.html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/(p|div|li|tr|td)>/gi, "\n")
          .replace(/<[^>]+>/g, "");
        textPieces.push(html);
      }
      if (typeof p.raw === "string") textPieces.push(p.raw);
      return textPieces.join("\n").trim();
    };

    const parseLead = (row: QueueRow) => {
      const text = extractText(row);
      const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      const phoneMatch = text.match(/(\+?\d[\d\s\-()]{7,15})/);

      // basic labeled extraction
      const grab = (label: string) => {
        const m = text.match(new RegExp(`${label}\\s*[:\\-]?\\s*(.+)`, "i"));
        return m ? m[1].trim() : null;
      };

      const name =
        grab("name") ||
        (row.from_addr ? row.from_addr.split("<")[0].replace(/["']/g, "").trim() : null) ||
        null;

      const description =
        grab("message") ||
        grab("details") ||
        text || "";

      return {
        name: name || "Unknown",
        email: emailMatch?.[0] || grab("email") || row.from_addr || null,
        phone: grab("phone") || grab("mobile") || phoneMatch?.[0]?.trim() || null,
        description,
      };
    };

    // 2) process each row
    const results: Array<{ id: string; status: string; err?: string }> = [];

    for (const row of todo as QueueRow[]) {
      try {
        const lead = parseLead(row);

        const orgId = "demo-org";

        // Optional: skip if we already created a lead for this external_id
        if (row.external_id) {
          const { data: existing, error: exErr } = await supabase
            .from("leads")
            .select("id")
            .eq("source", "email")
            .eq("external_id", row.external_id)
            .limit(1);

          if (exErr) console.error("[PROCESS] check existing lead err:", exErr);

          if (existing && existing.length > 0) {
            await supabase
              .from("inbound_queue")
              .update({ status: "DONE" })
              .eq("id", row.id);
            results.push({ id: row.id, status: "skipped_duplicate" });
            continue;
          }
        }

        // Insert lead
        const { error: insLeadErr } = await supabase.from("leads").insert({
          org_id: orgId,
          name: lead.name,
          email: lead.email || null,
          phone: lead.phone || null,
          description: lead.description?.slice(0, 2000) || "",
          status: "NEW",
          source: "email",
          external_id: row.external_id ?? null,
          raw: JSON.stringify(row.payload ?? {}),
        });

        if (insLeadErr) throw insLeadErr;

        // SMS notify (best-effort)
        try {
          const fallbackFrom = row.from_addr ? row.from_addr.split("<")[0].replace(/["']/g, "").trim() : null;
          const subject = row.subject || null;
          
          const smsText =
            `New Lead from Email\n` +
            `Name: ${lead.name || fallbackFrom || 'Unknown'}\n` +
            `Email: ${lead.email || fallbackFrom || 'N/A'}\n` +
            `Phone: ${lead.phone || 'N/A'}\n` +
            `Subject: ${subject || '(no subject)'}\n` +
            `Snippet: ${(lead.description || lead.message || '').slice(0, 120)}`;

          const body = smsText;

          await fetch(
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
                To: process.env.LL_DEFAULT_USER_PHONE!,
                From: process.env.TWILIO_FROM_NUMBER!, // uses the correct env
                Body: body,
              }),
            }
          );
        } catch (smsErr) {
          console.error("[PROCESS] SMS failed (ignored):", smsErr);
        }

        // Mark DONE
        await supabase
          .from("inbound_queue")
          .update({ status: "DONE", error_message: null })
          .eq("id", row.id);

        results.push({ id: row.id, status: "done" });
      } catch (rowErr: any) {
        console.error("[PROCESS] row failed:", row.id, rowErr);

        await supabase
          .from("inbound_queue")
          .update({ status: "ERROR", error_message: String(rowErr?.message || rowErr) })
          .eq("id", row.id);

        results.push({ id: row.id, status: "error", err: String(rowErr?.message || rowErr) });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e: any) {
    if (e?.message === "unauthorized") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    console.error("[PROCESS] crash:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

