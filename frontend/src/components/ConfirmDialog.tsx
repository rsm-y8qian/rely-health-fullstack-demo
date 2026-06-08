import { motion } from "motion/react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[24rem] rounded-2xl border border-stone-200 bg-white p-5 shadow-xl"
      >
        <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
        <p className="mt-2 text-sm text-stone-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
