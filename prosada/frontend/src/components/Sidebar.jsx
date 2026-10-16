import { Link, NavLink } from "react-router-dom";
import justinfoLogo from "../assets/justinfo.png";
import { LayoutDashboard, MapPin, Layers, Network, Sparkles } from "lucide-react";

const MENU = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/wilayah", label: "Wilayah", icon: MapPin },
  { to: "/profil", label: "Profil", icon: Layers },
  { to: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { to: "/ai-insight", label: "Ai Insight", icon: Sparkles },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 z-10 flex items-center gap-3 overflow-x-auto bg-[#071d36] px-3 py-2 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 lg:flex-col lg:items-stretch lg:gap-5 lg:overflow-visible lg:px-3 lg:py-5">
      <Link
        to="/"
        title="Kembali ke beranda"
        className="flex shrink-0 items-center justify-center rounded-2xl bg-white px-3 py-2 shadow-lg transition hover:bg-slate-100"
      >
        <img src={justinfoLogo} alt="JATIVA" className="h-9 w-auto object-contain lg:h-14" />
      </Link>

      <p className="hidden px-2 text-[11px] tracking-[0.2em] text-[#6f869c] lg:block">NAVIGATION</p>

      <nav className="flex gap-1.5 lg:flex-col">
        {MENU.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
                        className={({ isActive }) =>
              `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-[#1a7a6e] to-[#14606b] text-white"
                  : "text-[#c9d6e2] hover:bg-white/10"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="mt-auto hidden px-2 text-[11px] text-[#6f869c] lg:block">
        BRIDA Provinsi Jawa Timur
      </p>
    </aside>
  );
}
