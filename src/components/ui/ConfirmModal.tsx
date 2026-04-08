interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "확인",
  variant = "default",
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-btn-danger hover:bg-btn-danger-hover"
      : "bg-btn-primary hover:bg-btn-primary-hover";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay">
      <div className="w-full max-w-sm rounded-lg bg-bg-card p-6 shadow-lg">
        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
        {message && <p className="mt-1 text-xs text-text-muted">{message}</p>}

        {children}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-muted"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-text-inverse disabled:opacity-40 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
