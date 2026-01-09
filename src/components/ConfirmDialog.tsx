import { useEffect } from "react";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirmar",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  destructive = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, onConfirm]);

  if (!open) return null;

  // 👇 Ajusta este número si cambiaste altura del BottomBar.
  // 92 suele quedar bien con tu bar (pt-3 + pb safe-area + iconos).
  const BOTTOM_BAR_APPROX = 92;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Cerrar"
      />

      {/* Dialog (pegado abajo, full width) */}
      <div className="absolute inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-xl">
          <div
            className="w-full rounded-t-3xl bg-white p-4 shadow-2xl md:rounded-3xl md:p-6"
            style={{
              // 👇 deja espacio para el BottomBar + safe area
              paddingBottom: `calc(env(safe-area-inset-bottom) + 30px)`,
            }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300 md:hidden" />

            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border px-4 py-2 font-medium"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className={`w-full rounded-xl px-4 py-2 font-medium text-white ${destructive ? "bg-red-600" : "bg-black"
                  }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
