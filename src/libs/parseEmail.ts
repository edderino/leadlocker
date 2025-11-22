export function parseLeadFromEmail(input: string) {
  if (!input) {
    return { name: null, email: null, phone: null, message: null };
  }

  // 1. Convert common HTML to text safely
  let text = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<div[^>]*>/gi, "\n")
    .replace(/<\/p>|<\/div>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "") // remove any other tags
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ") // collapse double spaces
    .trim();

  // Normalize multiple newlines
  text = text.replace(/\n{2,}/g, "\n").trim();

  // Helper extractor
  const extract = (label: string) => {
    const regex = new RegExp(`${label}\\s*[:\\-]?\\s*(.+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  // Extract values
  const name =
    extract("name") ||
    extract("full name") ||
    extract("contact") ||
    null;

  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    extract("email") ||
    null;

  // PHONE EXTRACTION — stronger version
  const phone =
    extract("phone") ||
    extract("mobile") ||
    extract("contact number") ||
    text.match(/(\+?\d[\d\s\-()]{7,20})/)?.[0]?.replace(/\D/g, "") ||
    null;

  const message =
    extract("message") ||
    extract("details") ||
    extract("body") ||
    text;

  return {
    name,
    email,
    phone,
    message,
  };
}
