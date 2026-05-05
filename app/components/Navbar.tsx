import { NavLink } from "react-router";
import { useTheme } from "@/providers/ThemeProvider";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-gray-900 dark:text-white">🥁 MetroDrum</span>
        <div className="flex gap-4">
          <NavLink
            to="/metronome"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? "text-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            Metronome
          </NavLink>
          <NavLink
            to="/midi"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? "text-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            MIDI
          </NavLink>
          <NavLink
            to="/fretboard"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? "text-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            Fretboard
          </NavLink>
          <NavLink
            to="/chords"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? "text-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            Chords
          </NavLink>

        </div>
      </div>
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </nav>
  );
}
