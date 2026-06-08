import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

export function EditMetaDialog({
  initialName,
  initialDescription,
  onSave,
  onCancel,
}: {
  initialName: string;
  initialDescription?: string;
  onSave: (meta: { name: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[26rem] rounded-2xl border border-stone-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-ink">Workflow details</h3>
          <button onClick={onCancel} className="text-stone-400 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-fuchsia-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">
              Description <span className="text-stone-300">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A short summary of what this workflow does…"
              className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-fuchsia-300 placeholder:text-stone-400"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name: name.trim() || initialName, description })}
            className="rounded-lg bg-ink-soft px-4 py-2 text-sm font-medium text-white transition hover:bg-ink"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
