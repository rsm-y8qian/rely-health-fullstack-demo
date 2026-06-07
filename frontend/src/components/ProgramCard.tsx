import { motion, type Variants } from "motion/react";
import type { Program } from "../types";
import { iconFor } from "./icons";

// Reveal animation for each card (driven by the parent grid's stagger).
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// Icon animation — fires when the whole card is hovered (variant name "hover"
// propagates from the parent motion.div to this child).
const iconHover: Variants = {
  hover: { rotate: -8, scale: 1.12, transition: { type: "spring", stiffness: 300 } },
};

export function ProgramCard({ program }: { program: Program }) {
  const Icon = iconFor(program.icon);
  return (
    <motion.article
      variants={item}
      whileHover="hover"
      className="group rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      <motion.div
        variants={iconHover}
        className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-ink-soft text-white"
      >
        <Icon className="size-6" />
      </motion.div>
      <h3 className="font-display text-xl font-medium text-ink">{program.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">
        {program.description}
      </p>
    </motion.article>
  );
}
