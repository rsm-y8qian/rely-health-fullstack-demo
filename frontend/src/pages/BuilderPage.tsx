import { Heart, ChevronDown, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// The product shell (the "app" institutions log into). For now it lays out the
// two zones — the workflow canvas and the AI assistant — which we fill next.
export default function BuilderPage() {
  return (
    <div className="flex h-screen flex-col bg-stone-50">
      {/* App top bar */}
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center text-xl font-bold tracking-tight text-ink">
            rely
            <Heart className="ml-0.5 size-3.5 translate-y-1 fill-fuchsia-500 text-fuchsia-500" />
          </Link>
          <span className="text-stone-300">/</span>
          <span className="text-sm font-medium text-stone-600">Workflow Builder</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Tenant (institution) switcher — multi-tenancy made visible */}
          <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50">
            <span className="size-2 rounded-full bg-green-500" />
            Mercy General Hospital
            <ChevronDown className="size-4 text-stone-400" />
          </button>
          <Link to="/" className="flex items-center gap-1 text-sm text-stone-500 hover:text-ink">
            <ArrowLeft className="size-4" /> Site
          </Link>
        </div>
      </header>

      {/* Body: canvas (left) + AI assistant (right/bottom) */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center text-stone-400">
            <p className="font-display text-2xl text-stone-500">Workflow canvas</p>
            <p className="mt-1 text-sm">Visual pathway builder — coming in the next lesson.</p>
          </div>
        </main>

        <aside className="flex w-80 flex-col border-l border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
            <Sparkles className="size-4 text-fuchsia-500" />
            <span className="text-sm font-medium text-ink">AI Assistant</span>
          </div>
          <div className="flex-1 p-4 text-sm text-stone-400">
            Describe the clinical workflow you need and I'll build it.
          </div>
          <div className="border-t border-stone-200 p-3">
            <div className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-400">
              e.g. “Follow up with discharged patients…” (Phase 3)
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
