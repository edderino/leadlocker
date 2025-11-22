export function parseLeadFromEmail(body: string) {
  if (!body) return {};

  // Remove HTML tags just in case
  const clean = body.replace(/<[^>]+>/g, "").replace(/\r/g, "").trim();

  // Extract values in a flexible way
  const extract = (label: string) => {
    const regex = new RegExp(`${label}\\s*[:\\-]\\s*(.+)`, "i");
    const match = clean.match(regex);
    return match ? match[1].trim() : null;
  };

  // Name detection
  const name =
    extract("name") ||
    extract("full name") ||
    extract("contact") ||
    null;

  // Email detection (fallback to regex)
  const email =
    extract("email") ||
    clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    null;

  // Phone detection — VERY flexible
  const phone =
    extract("phone") ||
    extract("mobile") ||
    extract("contact number") ||
    clean.match(/(\+?\d[\d\s\-()]{7,15})/)?.[0]?.trim() ||
    null;

  // Message detection
  const message =
    extract("message") ||
    extract("msg") ||
    extract("details") ||
    extract("body") ||
    null;

  return {
    name,
    email,
    phone,
    message,
  };
}
