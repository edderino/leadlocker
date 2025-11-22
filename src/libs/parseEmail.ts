export function parseLeadFromEmail(input: string) {
  if (!input) {
    return { name: null, email: null, phone: null, message: null };
  }

  // ---- CLEAN HTML → TEXT ----
  let text = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "") // strip other HTML
    .replace(/\r/g, "")
    .trim();

  // Normalize weird spacing
  text = text.replace(/\n{2,}/g, "\n").trim();

  // ---- GENERIC FIELD EXTRACTOR (stops at next label) ----
  const field = (label: string) => {
    const regex = new RegExp(
      `${label}\\s*[:\\-]?\\s*([^\\n]+)`,
      "i"
    );
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  // ---- NAME ----
  const name =
    field("name") ||
    field("full name") ||
    field("contact") ||
    null;

  // ---- EMAIL ----
  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    field("email") ||
    null;

  // ---- PHONE (robust multi-format). Order matters. ----
  const phone =
    field("phone") ||
    field("mobile") ||
    field("contact number") ||
    // Aussie numbers + international formats
    text.match(/(\+?61\s?\d{1}\s?\d{3}\s?\d{3})/)?.[0]?.trim() || // +61 XXXX XXX
    text.match(/(\+?61\d{9})/)?.[0]?.trim() || // +61421114622
    text.match(/(0\d{9})/)?.[0]?.trim() || // 0421114622
    text.match(/(\+?\d[\d\s\-()]{7,15})/)?.[0]?.trim() || // fallback
    null;

  // ---- MESSAGE ----
  const message =
    field("message") ||
    field("details") ||
    field("body") ||
    text;

  return {
    name,
    email,
    phone,
    message,
  };
}
