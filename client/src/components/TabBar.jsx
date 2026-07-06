import { NavLink } from "react-router-dom";

const VOCI = [
  { to: "/", label: "zone", icon: "▦" },
  { to: "/chiusura", label: "chiusura", icon: "☾" },
  { to: "/scadenze", label: "scadenze", icon: "◷" },
  { to: "/report", label: "report", icon: "▤" },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 safe-bottom z-20">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {VOCI.map((voce) => (
          <NavLink
            key={voce.to}
            to={voce.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                isActive
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-400 dark:text-gray-500"
              }`
            }
          >
            <span className="text-lg leading-none">{voce.icon}</span>
            {voce.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
