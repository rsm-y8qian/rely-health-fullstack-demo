import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { AiAssistant } from "./AiAssistant";
import type { Pathway } from "../../types";

// A floating, animated AI launcher (bottom-right) that opens a popup chat.
export function AiOrb({
  department,
  onPathway,
}: {
  department: string;
  onPathway: (p: Pathway) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 right-6 z-50 flex h-[30rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
          >
            <AiAssistant department={department} onPathway={onPathway} onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The animated orb */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-lg"
        title="AI Assistant"
      >
        {/* soft glow */}
        <span className="absolute inset-0 rounded-full bg-fuchsia-400/40 blur-md" />
        {/* rotating gradient sphere */}
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #f0abfc, #c026d3, #7c3aed, #2563eb, #f0abfc)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        {/* glossy highlight */}
        <span className="absolute inset-1 rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.85),transparent_45%)]" />
        <AnimatePresence>
          {open && (
            <motion.span
              key="chev"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative text-white"
            >
              <ChevronDown className="size-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
