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
      ? "bg-red-500 hover:bg-red-600"
      : "bg-zinc-900 hover:bg-zinc-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h4 className="text-sm font-semibold text-zinc-800">{title}</h4>
        {message && <p className="mt-1 text-xs text-zinc-500">{message}</p>}

        {children}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
