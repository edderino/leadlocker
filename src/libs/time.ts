import { formatDistanceToNow } from 'date-fns';

export function timeAgo(iso: string) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  const t = (n: number, u: string) => `${n} ${u}${n > 1 ? 's' : ''} ago`;
  if (s < 60) return t(s, 'sec');
  const m = Math.floor(s / 60);
  if (m < 60) return t(m, 'min');
  const h = Math.floor(m / 60);
  if (h < 24) return t(h, 'hour');
  const d2 = Math.floor(h / 24);
  return t(d2, 'day');
}

export function relativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

