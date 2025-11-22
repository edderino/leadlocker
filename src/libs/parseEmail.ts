export function parseLeadFromEmail(input: string) {
  if (!input) return { name: null, email: null, phone: null, message: null };

  // Convert HTML to text by replacing <br> and block tags
  let text = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "") // remove other HTML tags
    .replace(/\r/g, "")
    .trim();

  const extract = (label: string) => {
    const regex = new RegExp(`${label}\\s*[:\\-]?\\s*(.+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const name =
    extract("name") ||
    extract("full name") ||
    extract("contact") ||
    null;

  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    extract("email") ||
    null;

  const phone =
    extract("phone") ||
    extract("mobile") ||
    extract("contact number") ||
    text.match(/(\+?\d[\d\s\-()]{7,15})/)?.[0]?.trim() ||
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
