import { NavLink, Outlet } from "react-router";

const TABS = [
  { to: "/fretboard", label: "Find the note", end: true },
  { to: "/fretboard/fret", label: "Find the fret", end: false },
];

export default function FretboardLayout() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4">
      <nav className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl" aria-label="Fretboard sections">
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
