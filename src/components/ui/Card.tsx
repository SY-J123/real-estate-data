interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-lg border border-border-default bg-bg-card p-4 ${className}`}>
      {children}
    </div>
  );
}
