export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl2 bg-card/90 border border-edge/60 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

