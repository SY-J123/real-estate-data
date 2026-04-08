interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const VARIANT_CLASSES = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800",
  danger: "bg-red-500 text-white hover:bg-red-600",
  ghost: "text-zinc-500 hover:bg-zinc-100",
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
