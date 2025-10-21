export function log(...msg: any[]) {
  const text = `[LeadLocker ${process.env.NEXT_PUBLIC_APP_ENV}] ${msg.join(" ")}`
  if (process.env.NODE_ENV === "development") console.log(text)
  else fetch("https://api.betterstack.com/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  }).catch(() => {})
}

/**
 * Log follow-up automation events
 */
export function logFollowUp(orgId: string, count: number) {
  const message = `[FollowUp] Triggered for org: ${orgId}, count: ${count}`;
  log(message);
}
