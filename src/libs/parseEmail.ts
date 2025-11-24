// Normalize + extract AU phone
function extractAuPhone(input: string): string | null {
  if (!input) return null;

  // keep digits and leading +
  const cleaned = input
    .replace(/[\u00A0]/g, ' ') // non-breaking spaces
    .replace(/[()\-_.]/g, ' ')
    .replace(/\s+/g, ' ');

  // Try common cues to improve precision
  const cueBlocks = (cleaned.match(
    /(?:phone|mobile|mob|call|txt|text|ring|contact(?: me)?(?: on)?)[^:\n]*[:\-]?\s*([+()\d][^.\n\r]*)/gi
  ) || []).map(s => s.trim());

  const searchSpace = [cleaned, ...cueBlocks].join('  ');

  // Match AU mobiles/landlines (04xx… or +61 4xx…; also landlines like 02/03/07/08)
  const re =
    /(?:\+?61[\s]*\(?(?:0)?\)?[\s]*|0)(?:4[\s]*\d{2}|\d{1,2})[\s]*\d[\s]*\d[\s]*\d[\s]*\d[\s]*\d[\s]*\d[\s]*\d[\s]*\d(?:[\s]*\d{0,2})?/g;

  const cand = searchSpace.match(re);
  if (!cand) return null;

  // Normalize: convert +61X… to 0X…, strip spaces
  const norm = cand
    .map(s => s.replace(/\s+/g, ''))
    .map(s => {
      // +61(0?)4… or +61(0?)[2,3,7,8]…
      const m = s.match(/^\+?61(?:0)?(\d+)/);
      if (m) return '0' + m[1];
      return s;
    })
    // Keep likely 10–11 digit local numbers (AU mobiles are 10)
    .map(s => s.replace(/[^\d]/g, ''))
    .filter(s => s.length >= 9 && s.length <= 11);

  if (norm.length === 0) return null;

  // Prefer mobiles starting with 04
  const mobile = norm.find(n => n.startsWith('04') && n.length === 10);
  return mobile || norm[0];
}

export function parseLeadFromEmail(body: string) {
  const text = (body || '').toString();

  // email
  const emailMatch = text.match(
    /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i
  );
  const email = emailMatch?.[1]?.toLowerCase() ?? null;

  // name fallback: before "<" or the email local part
  let name: string | null = null;
  if (email) {
    const local = email.split('@')[0];
    name = local.includes('.')
      ? local
          .split('.')
          .map(p => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ')
      : local;
  }

  // phone
  const phone = extractAuPhone(text);

  // description/snippet: first clean line
  const snippet =
    text
      .replace(/\r/g, '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 6) // short snippet
      .join(' ')
      .slice(0, 240) || '';

  return {
    name: name || null,
    email,
    phone,
    message: snippet,      // keep for backwards compat
    description: snippet,  // used by callers
  };
}
