import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useOutletContext } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { fetchDepartments } from "../api";

export type AppContext = { department: string };

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? "bg-stone-100 text-ink" : "text-stone-500 hover:text-ink"
  }`;

export default function AppLayout() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [department, setDepartment] = useState("");

  useEffect(() => {
    fetchDepartments().then((d) => {
      setDepartments(d);
      setDepartment(d[0] ?? "");
    });
  }, []);

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-2.5">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center text-xl font-bold tracking-tight text-ink">
            rely
            <Heart className="ml-0.5 size-3.5 translate-y-1 fill-fuchsia-500 text-fuchsia-500" />
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/app" end className={tabClass}>
              Builder
            </NavLink>
            <NavLink to="/app/operations" className={tabClass}>
              Operations
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700">
            <span className="size-2 rounded-full bg-green-500" />
            Mercy General Hospital
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <Link to="/" className="flex items-center gap-1 text-sm text-stone-500 hover:text-ink">
            <ArrowLeft className="size-4" /> Site
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet context={{ department } satisfies AppContext} />
      </main>
    </div>
  );
}

export function useAppContext() {
  return useOutletContext<AppContext>();
}
