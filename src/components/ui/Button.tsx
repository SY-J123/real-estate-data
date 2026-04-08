interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const VARIANT_CLASSES = {
  primary: "bg-btn-primary text-text-inverse hover:bg-btn-primary-hover",
  danger: "bg-btn-danger text-text-inverse hover:bg-btn-danger-hover",
  ghost: "text-text-muted hover:bg-bg-muted",
} as const;

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
} as const;

export default function Button({
  variant = "primary",
  size = "sm",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-md font-medium transition-colors disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
