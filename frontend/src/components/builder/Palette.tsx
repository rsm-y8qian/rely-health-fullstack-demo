import { iconFor } from "../icons";
import type { Capability } from "../../types";

// The block palette — click a block to drop it onto the canvas.
export function Palette({
  capabilities,
  onAdd,
}: {
  capabilities: Capability[];
  onAdd: (cap: Capability) => void;
}) {
  return (
    <aside className="w-56 shrink-0 border-r border-stone-200 bg-white p-3">
      <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
        Blocks
      </p>
      <div className="space-y-1.5">
        {capabilities.map((cap) => {
          const Icon = iconFor(cap.icon);
          return (
            <button
              key={cap.action}
              onClick={() => onAdd(cap)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 px-2.5 py-2 text-left transition hover:border-fuchsia-300 hover:bg-fuchsia-50/40"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-600">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{cap.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
