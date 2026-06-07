import { Sparkles, Heart } from "lucide-react";
import { Pill } from "./components/Pill";
import { Programs } from "./components/Programs";
import { CareJourney } from "./components/CareJourney";

function Nav() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-stone-200/70 bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
        <a href="/" className="flex items-center text-2xl font-bold tracking-tight text-ink">
          rely
          <Heart className="ml-0.5 size-4 translate-y-1 fill-fuchsia-500 text-fuchsia-500" />
        </a>
        <div className="flex items-center gap-7 text-sm text-stone-600">
          <a href="#" className="hidden hover:text-ink sm:inline">About Us</a>
          <a href="#" className="hidden hover:text-ink sm:inline">Careers</a>
          <a href="#" className="hidden hover:text-ink sm:inline">Resources</a>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-soft px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink"
          >
            Book a demo
            <Sparkles className="size-4" />
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <Pill>Care Powered by AI, Guided by Humans</Pill>

      <h1 className="mt-8 font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-7xl">
        Hybrid Human–AI
        <br />
        Patient Orchestration
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-lg text-stone-500">
        Reducing labor costs by 30%+, delivering outcomes — not just technology.
        Human care where it matters. AI everywhere else.
      </p>

      <div className="mt-9 flex items-center justify-center gap-3">
        <a
          href="#programs"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-soft px-5 py-3 text-sm font-medium text-white transition hover:bg-ink"
        >
          Book a demo
          <Sparkles className="size-4" />
        </a>
        <a
          href="#programs"
          className="rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-ink transition hover:bg-stone-50"
        >
          See programs
        </a>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <Hero />
      <CareJourney />
      <Programs />
    </div>
  );
}
