import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import type { Program } from "../types";
import { fetchPrograms } from "../api";
import { Pill } from "./Pill";
import { ProgramCard } from "./ProgramCard";

// Container drives the staggered reveal of its child cards.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export function Programs() {
  // Three pieces of state: the data, whether we're still loading, any error.
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Runs once after the component mounts: go fetch from the backend.
  useEffect(() => {
    fetchPrograms()
      .then(setPrograms)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="programs" className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <Pill>Personalized by Site, Comprehensive, Always-on</Pill>
        <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-medium leading-tight text-ink sm:text-5xl">
          Navigation Programs That Leverage the Best of Both Worlds
        </h2>
      </div>

      {loading && (
        <p className="mt-16 text-center text-stone-400">Loading programs…</p>
      )}
      {error && (
        <p className="mt-16 text-center text-red-600">Failed to load: {error}</p>
      )}

      {!loading && !error && (
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </motion.div>
      )}
    </section>
  );
}
