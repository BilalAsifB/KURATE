import { Link, Outlet, useLocation } from "react-router-dom";
import { Layers } from "lucide-react";

export default function Layout() {
  const { pathname } = useLocation();

  const navLink = (to, label) => {
    const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          active
            ? "bg-zinc-800 text-emerald-400"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3 shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
          <span className="font-semibold tracking-tight text-zinc-100">Kurate</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLink("/", "Documents")}
          {navLink("/workspace", "Workspace")}
        </nav>
      </header>
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}