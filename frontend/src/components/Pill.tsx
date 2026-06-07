export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-600 shadow-sm">
      {children}
    </span>
  );
}
