export function parseLeadFromEmail(text: string) {
  const cleaned = text.replace(/\r/g, "").trim();

  const extract = (label: string) => {
    const regex = new RegExp(`${label}\\s*[:\\-]?\\s*(.+)`, "i");
    const match = cleaned.match(regex);
    return match ? match[1].trim() : null;
  };

  // Try common fields
  const name = 
    extract("name") ||
    extract("full name") ||
    extract("contact") ||
    null;

  const email =
    cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    extract("email") ||
    null;

  const phone =
    cleaned.match(/(\+?\d[\d\s\-()]{7,15})/)?.[0]?.trim() ||
    extract("phone") ||
    extract("mobile") ||
    extract("contact number") ||
    null;

  const message =
    extract("message") ||
    extract("details") ||
    extract("body") ||
    cleaned;

  return {
    name,
    email,
    phone,
    message,
  };
}

