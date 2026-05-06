import { useState } from "react";
import { NavLink } from "react-router";
import { useTheme } from "@/providers/ThemeProvider";

const LINKS = [
  { to: "/metronome", label: "Metronome" },
  { to: "/midi",      label: "MIDI" },
  { to: "/fretboard", label: "Fretboard" },
  { to: "/chords",    label: "Chords" },
  { to: "/blues",     label: "Blues" },
];

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `text-sm font-medium transition-colors ${
          isActive
            ? "text-blue-500"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-gray-900 dark:text-white">🥁 MetroDrum</span>
          {/* Desktop links */}
          <div className="hidden sm:flex gap-4">
            {LINKS.map(l => <NavItem key={l.to} to={l.to} label={l.label} />)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="sm:hidden rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden flex flex-col gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          {LINKS.map(l => (
            <NavItem key={l.to} to={l.to} label={l.label} onClick={() => setMenuOpen(false)} />
          ))}
        </div>
      )}
    </nav>
  );
}
