'use client';

export default function Sparkline({ values }: { values: number[] }) {
  const w = 260;
  const h = 60;
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1 || 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="text-violet-300/80">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

