import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import type { Capability, ActionType } from "../../types";
import type { StepNodeData } from "./StepNode";
import { iconForAction } from "../icons";
import { splitWait, toMinutes } from "../../lib/format";

const ASSIGNEES = ["Unassigned", "AI Agent", "Nurse Navigator", "Care Coordinator", "Physician"];

function NumberWheel({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-1 flex-col items-center gap-1">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-stone-200 bg-white px-2 py-2 text-center text-sm outline-none focus:border-fuchsia-300"
      >
        {Array.from({ length: max + 1 }, (_, i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
      <span className="text-[11px] text-stone-400">{label}</span>
    </label>
  );
}

export function NodeDetailPanel({
  data,
  capabilities,
  onSave,
  onClose,
}: {
  data: StepNodeData;
  capabilities: Capability[];
  onSave: (next: StepNodeData) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(data.name);
  const [action, setAction] = useState<ActionType>(data.action);
  const wait0 = splitWait(data.waitMinutes);
  const [days, setDays] = useState(wait0.days);
  const [hours, setHours] = useState(wait0.hours);
  const [minutes, setMinutes] = useState(wait0.minutes);
  const [assignee, setAssignee] = useState(data.assignee ?? "Unassigned");

  const Icon = iconForAction(action);

  function save() {
    const totalWait = toMinutes(days, hours, minutes);
    onSave({
      ...data,
      name: name.trim() || data.name,
      action,
      waitMinutes: totalWait > 0 ? totalWait : undefined,
      assignee: assignee === "Unassigned" ? undefined : assignee,
    });
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[26rem] rounded-2xl border border-stone-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-ink-soft text-white">
              <Icon className="size-5" />
            </div>
            <span className="font-display text-lg font-medium text-ink">Edit step</span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Task name (editable) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Task name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-fuchsia-300"
            />
          </div>

          {/* Task type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Task type</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as ActionType)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-fuchsia-300"
            >
              {capabilities.map((c) => (
                <option key={c.action} value={c.action}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wait time — precise to the minute */}
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Wait before this step</label>
            <div className="flex gap-2">
              <NumberWheel label="days" value={days} max={30} onChange={setDays} />
              <NumberWheel label="hours" value={hours} max={23} onChange={setHours} />
              <NumberWheel label="mins" value={minutes} max={59} onChange={setMinutes} />
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Responsible owner</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-fuchsia-300"
            >
              {ASSIGNEES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-ink-soft px-4 py-2 text-sm font-medium text-white transition hover:bg-ink"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
