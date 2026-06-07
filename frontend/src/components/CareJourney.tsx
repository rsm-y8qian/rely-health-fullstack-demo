import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Pill } from "./Pill";

const steps = [
  { t: "Discharge", d: "Patient leaves the hospital — the journey begins." },
  { t: "24-hour check-in", d: "Automated SMS: “How are you feeling today?”" },
  { t: "Day 3 follow-up", d: "No reply → escalate to a human care navigator." },
  { t: "Day 7 appointment", d: "Confirm the PCP follow-up visit is booked." },
];

function Step({
  step,
  index,
  total,
  progress,
}: {
  step: { t: string; d: string };
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // The fraction of the timeline this step sits at (0 = top, 1 = bottom).
  const point = index / (total - 1);
  // As the scroll progress reaches this step, animate its dot + text.
  const dotBg = useTransform(progress, [point - 0.12, point], ["#e7e5e4", "#16a34a"]);
  const dotScale = useTransform(progress, [point - 0.12, point], [0.7, 1.1]);
  const textOpacity = useTransform(progress, [point - 0.12, point], [0.3, 1]);

  return (
    <div className="relative flex items-start gap-5 pb-12 last:pb-0">
      <motion.span
        style={{ backgroundColor: dotBg, scale: dotScale }}
        className="relative z-10 mt-1 size-6 shrink-0 rounded-full ring-4 ring-cream"
      />
      <motion.div style={{ opacity: textOpacity }}>
        <h3 className="font-display text-xl font-medium text-ink">{step.t}</h3>
        <p className="mt-1 text-sm text-stone-500">{step.d}</p>
      </motion.div>
    </div>
  );
}

export function CareJourney() {
  const ref = useRef<HTMLDivElement>(null);
  // scrollYProgress goes 0 -> 1 as this section travels through the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  // Drive the green fill line's height directly from scroll position.
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <div className="text-center">
        <Pill>Smart Patient Orchestration</Pill>
        <h2 className="mt-6 font-display text-4xl font-medium leading-tight text-ink sm:text-5xl">
          A patient's journey, orchestrated
        </h2>
        <p className="mx-auto mt-4 max-w-md text-stone-500">
          Scroll to follow one patient through their next best steps in care.
        </p>
      </div>

      <div ref={ref} className="relative mt-14 pl-1">
        {/* Static track */}
        <div className="absolute left-3 top-1 h-full w-0.5 -translate-x-1/2 bg-stone-200" />
        {/* Animated fill — its height follows the scroll wheel */}
        <motion.div
          style={{ height: lineHeight }}
          className="absolute left-3 top-1 w-0.5 -translate-x-1/2 origin-top bg-green-600"
        />
        {steps.map((s, i) => (
          <Step key={i} step={s} index={i} total={steps.length} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
