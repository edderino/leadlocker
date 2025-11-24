// src/libs/parseEmail.ts
export type ParsedLead = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
};

const AU_PHONE_REGEXES = [
  /\b(?:\+?61\s?|\(0\)\s?0?|\b)4\s?\d(?:[\s-]?\d){7}\b/i,          // mobiles: 04xxxxxxxx or +61 4xx...
  /\b(?:\+?61\s?|0)(2|3|7|8)\s?\d(?:[\s-]?\d){7}\b/i,              // landlines: 02/03/07/08...
];

const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function findFirst(reArr: RegExp[], text: string): string | null {
  for (const re of reArr) {
    const m = text.match(re);
    if (m) return m[0].replace(/\s+/g, "");
  }
  return null;
}

function clean(text: string) {
  return (text || "").replace(/\r/g, "").trim();
}

export function parseLeadFromEmail(raw: string): ParsedLead {
  const body = clean(raw);

  // Email (explicit “Email:” line wins; fallback to first email-like token)
  const emailLine = body.match(/(?:email|e-mail)\s*[:\-]\s*(.+)/i)?.[1]?.trim();
  const email =
    (emailLine && (emailLine.match(EMAIL_REGEX)?.[0] || null)) ||
    body.match(EMAIL_REGEX)?.[0] ||
    null;

  // Phone: handle AU formats (04…, +61…, 02/03/07/08…)
  const phone =
    body.match(/(?:phone|mobile|contact)\s*[:\-]\s*([+\d\(\)\s-]{8,})/i)?.[1]
      ?.replace(/[^\d+]/g, "") ||
    findFirst(AU_PHONE_REGEXES, body);

  // Name: prefer explicit “Name:” line; else name before @; else null
  const nameLine = body.match(/(?:name|full\s*name)\s*[:\-]\s*(.+)/i)?.[1]?.trim();
  let name: string | null = null;
  if (nameLine) {
    name = nameLine.replace(/["']/g, "");
  } else if (email) {
    const local = email.split("@")[0].replace(/[._-]+/g, " ");
    name = local
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Message: strip common prefixes lines, keep first ~500 chars
  const message =
    body
      .replace(/^(from:|sent:|to:|subject:).*$\n?/gim, "")
      .replace(/^>.*$\n?/gm, "")
      .trim()
      .slice(0, 500) || null;

  return { name, email, phone, message };
}
